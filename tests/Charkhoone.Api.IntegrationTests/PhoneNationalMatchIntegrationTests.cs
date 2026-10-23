using System.Net;
using System.Net.Http.Json;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PhoneNationalMatchIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [InlineData("1111111111", false)]
    [InlineData("0071234561", true)]
    [InlineData("0071234562", false)]
    [InlineData("12345", false)]
    public void NationalIdChecksumIsVerifiedWithoutExternalCalls(string input, bool expected) =>
        Assert.Equal(expected, EfPhoneNationalMatchService.ValidNationalId(input));

    [Fact]
    public async Task UnconfiguredProvider_IsFailClosed_AndNeverClaimsOwnership()
    {
        var subject = "phone-national-" + Guid.NewGuid().ToString("N");
        using var anon = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anon.GetAsync("/api/v1/mobile/account/identity-status")).StatusCode);

        using var client = factory.CreateAuthenticatedClient(subject);
        Assert.Equal(HttpStatusCode.NoContent,
            (await client.PostAsync("/api/v1/mobile/account/activate", null)).StatusCode);
        var status = await client.GetFromJsonAsync<IdentityView>("/api/v1/mobile/account/identity-status");
        Assert.False(status!.Verified);
        Assert.True(status.RequiresVerifiedPhone);

        client.DefaultRequestHeaders.Add("X-Test-Phone", "+989121234567");
        client.DefaultRequestHeaders.Add("X-Test-Phone-Verified", "true");
        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.PostAsJsonAsync("/api/v1/mobile/account/identity/verify",
                new { nationalId = "0071234561", confirm = false })).StatusCode);
        var unavailable = await client.PostAsJsonAsync("/api/v1/mobile/account/identity/verify",
            new { nationalId = "0071234561", confirm = true });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, unavailable.StatusCode);
        var body = await unavailable.Content.ReadAsStringAsync();
        Assert.DoesNotContain("0071234561", body, StringComparison.Ordinal);
        var after = await client.GetFromJsonAsync<IdentityView>("/api/v1/mobile/account/identity-status");
        Assert.False(after!.Verified);

        using var unverified = factory.CreateAuthenticatedClient(subject);
        unverified.DefaultRequestHeaders.Add("X-Test-Phone", "09121234567");
        Assert.Equal(HttpStatusCode.Conflict,
            (await unverified.PostAsJsonAsync("/api/v1/mobile/account/identity/verify",
                new { nationalId = "0071234561", confirm = true })).StatusCode);
    }

    [Fact]
    public async Task VerifiedProviderEvidence_IsBoundToCurrentPhoneAndDoesNotRepeatExternalCall()
    {
        var subject = "phone-pair-" + Guid.NewGuid().ToString("N");
        using var client = factory.CreateAuthenticatedClient(subject);
        await client.PostAsync("/api/v1/mobile/account/activate", null);
        Guid userId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            userId = await db.Users.AsNoTracking()
                .Where(x => x.OidcSubject == subject).Select(x => x.Id).SingleAsync();
        }
        var fake = new IdempotentTestMatchAdapter();
        var cfg = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> {
                ["IdentityMatch:HmacKey"] = "test-only-not-a-production-secret-32-bytes",
                ["IdentityMatch:EvidenceValidFor"] = "01:00:00",
            }).Build();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            var service = new EfPhoneNationalMatchService(db, fake, cfg, TimeProvider.System);
            Assert.Equal(PhoneNationalMatchProcessStatus.Verified,
                (await service.VerifyAsync(userId, "09121234567", "0071234561", DateTimeOffset.UtcNow)).Status);
            Assert.Equal(PhoneNationalMatchProcessStatus.AlreadyVerified,
                (await service.VerifyAsync(userId, "+989121234567", "0071234561", DateTimeOffset.UtcNow)).Status);
            Assert.Equal(1, fake.CallCount);
            Assert.True(await service.IsVerifiedForPhoneAsync(userId, "09121234567"));
            Assert.False(await service.IsVerifiedForPhoneAsync(userId, "09129998877"));
        }
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            var evidence = await db.AuditEvents.AsNoTracking()
                .SingleAsync(x => x.AggregateId == userId && x.Action == "phone_national_match_verified_v1");
            Assert.DoesNotContain("0071234561", evidence.Reason, StringComparison.Ordinal);
            Assert.DoesNotContain("09121234567", evidence.Reason, StringComparison.Ordinal);
            evidence.OccurredAtUtc = DateTimeOffset.UtcNow.AddHours(-2);
            db.AuditEvents.Update(evidence);
            await db.SaveChangesAsync();
            var service = new EfPhoneNationalMatchService(db, fake, cfg, TimeProvider.System);
            Assert.False(await service.IsVerifiedForPhoneAsync(userId, "09121234567"));
        }
    }

    private sealed record IdentityView(bool Verified, bool RequiresVerifiedPhone);

    private sealed class IdempotentTestMatchAdapter : IPhoneNationalMatchAdapter
    {
        public string Provider => "integration-proof";
        public bool GuaranteesProviderIdempotency => true;
        public int CallCount { get; private set; }
        public Task<PhoneNationalMatchResponse> VerifyAsync(
            PhoneNationalMatchRequest request, CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new PhoneNationalMatchResponse(
                PhoneNationalMatchOutcome.Matched, Provider, "integration-only-ref"));
        }
    }
}
