using System.Net;
using System.Net.Http.Json;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class MobileAccountIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task FirstAuthenticatedVisit_ActivatesOneOwnedAccount_WithoutAcceptingAnAnonymousRequest()
    {
        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync("/api/v1/mobile/account/activate", null)).StatusCode);
        var subject = $"new-mobile-{Guid.NewGuid():D}";
        using var client = factory.CreateAuthenticatedClient(subject);
        var results = await Task.WhenAll(
            client.PostAsync("/api/v1/mobile/account/activate", null),
            client.PostAsync("/api/v1/mobile/account/activate", null));
        Assert.All(results, response => Assert.Equal(HttpStatusCode.NoContent, response.StatusCode));
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        Assert.Equal(1, await db.Users.CountAsync(user => user.OidcSubject == subject));
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/mobile/account")).StatusCode);
    }

    [Fact]
    public async Task AccountChangesRequireAuthentication_StayScopedToTheOwner_AndRejectInvalidImages()
    {
        var ownerId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var ownerSubject = $"account-owner-{ownerId:D}";
        var otherSubject = $"account-other-{otherId:D}";
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow { Id = ownerId, OidcSubject = ownerSubject, CreatedAtUtc = DateTimeOffset.UtcNow },
                new UserRow { Id = otherId, OidcSubject = otherSubject, CreatedAtUtc = DateTimeOffset.UtcNow });
            await db.SaveChangesAsync();
        }

        using var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/v1/mobile/account")).StatusCode);

        using var owner = factory.CreateAuthenticatedClient(ownerSubject);
        using var other = factory.CreateAuthenticatedClient(otherSubject);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PutAsJsonAsync("/api/v1/mobile/account/photo", new { dataUrl = "data:image/svg+xml;base64,PHN2Zz4=" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PutAsJsonAsync("/api/v1/mobile/account/photo", new { dataUrl = "data:image/png;base64,bad" })).StatusCode);

        const string png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/B2sAAAAASUVORK5CYII=";
        Assert.Equal(HttpStatusCode.OK, (await owner.PutAsJsonAsync("/api/v1/mobile/account/name", new { preferredName = "نام نمایشی" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.PutAsJsonAsync("/api/v1/mobile/account/photo", new { dataUrl = png })).StatusCode);

        var ownerView = await owner.GetFromJsonAsync<AccountView>("/api/v1/mobile/account");
        var otherView = await other.GetFromJsonAsync<AccountView>("/api/v1/mobile/account");
        Assert.Equal("نام نمایشی", ownerView?.PreferredName);
        Assert.Equal(png, ownerView?.AvatarDataUrl);
        Assert.Null(otherView?.PreferredName);
        Assert.Null(otherView?.AvatarDataUrl);

        Assert.Equal(HttpStatusCode.OK, (await owner.DeleteAsync("/api/v1/mobile/account/photo")).StatusCode);
        await using var verifyScope = factory.Services.CreateAsyncScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var persisted = await verifyDb.Users.AsNoTracking().SingleAsync(user => user.Id == ownerId);
        Assert.Equal("نام نمایشی", persisted.PreferredName);
        Assert.Null(persisted.AvatarDataUrl);
    }

    private sealed record AccountView(string? PreferredName, string? AvatarDataUrl);
}
