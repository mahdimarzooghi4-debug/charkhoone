using System.Security.Claims;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Api.Endpoints;

public static class MobileAccountEndpoints
{
    public static RouteGroupBuilder MapMobileAccountEndpoints(this RouteGroupBuilder api)
    {
        var account = api.MapGroup("/mobile/account").RequireAuthorization();
        account.MapGet("", GetAsync);
        account.MapPut("/name", UpdateNameAsync);
        account.MapPut("/photo", UpdatePhotoAsync);
        account.MapDelete("/photo", DeletePhotoAsync);
        return api;
    }

    private static async Task<Guid?> UserIdAsync(ClaimsPrincipal principal, IUserIdentityLookup lookup, CancellationToken ct)
    {
        var subject = principal.FindFirst("sub")?.Value?.Trim();
        return string.IsNullOrWhiteSpace(subject) ? null : await lookup.FindInternalUserIdAsync(subject, ct);
    }

    private static async Task<IResult> GetAsync(ClaimsPrincipal principal, IUserIdentityLookup lookup, CharkhooneDbContext db, CancellationToken ct)
    {
        var userId = await UserIdAsync(principal, lookup, ct);
        if (userId is null) return Results.Forbid();
        var user = await db.Users.AsNoTracking().Where(x => x.Id == userId.Value)
            .Select(x => new { x.PreferredName, x.AvatarDataUrl }).SingleOrDefaultAsync(ct);
        return user is null ? Results.Forbid() : Results.Ok(user);
    }

    private static async Task<IResult> UpdateNameAsync(NameRequest input, ClaimsPrincipal principal, IUserIdentityLookup lookup, CharkhooneDbContext db, CancellationToken ct)
    {
        var name = input.PreferredName?.Trim();
        if (name is null || name.Length is < 2 or > 120 || name.Any(char.IsControl))
            return Results.BadRequest(new { code = "invalid_preferred_name" });
        var userId = await UserIdAsync(principal, lookup, ct);
        if (userId is null) return Results.Forbid();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId.Value, ct);
        if (user is null) return Results.Forbid();
        user.PreferredName = name;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { user.PreferredName, user.AvatarDataUrl });
    }

    private static async Task<IResult> UpdatePhotoAsync(PhotoRequest input, ClaimsPrincipal principal, IUserIdentityLookup lookup, CharkhooneDbContext db, CancellationToken ct)
    {
        var value = input.DataUrl;
        if (value is null || value.Length > 720_000)
            return Results.BadRequest(new { code = "photo_too_large_or_missing" });
        var comma = value.IndexOf(',');
        if (comma < 0) return Results.BadRequest(new { code = "invalid_photo" });
        var prefix = value[..comma];
        if (prefix is not ("data:image/jpeg;base64" or "data:image/png;base64" or "data:image/webp;base64"))
            return Results.BadRequest(new { code = "unsupported_photo_type" });
        byte[] bytes;
        try { bytes = Convert.FromBase64String(value[(comma + 1)..]); }
        catch (FormatException) { return Results.BadRequest(new { code = "invalid_photo" }); }
        if (bytes.Length is < 16 or > 500_000 || !IsValidImage(prefix, bytes))
            return Results.BadRequest(new { code = "invalid_photo" });
        var userId = await UserIdAsync(principal, lookup, ct);
        if (userId is null) return Results.Forbid();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId.Value, ct);
        if (user is null) return Results.Forbid();
        user.AvatarDataUrl = value;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { user.PreferredName, user.AvatarDataUrl });
    }

    private static bool IsValidImage(string prefix, byte[] bytes) => prefix switch
    {
        "data:image/jpeg;base64" => bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff && bytes[^2] == 0xff && bytes[^1] == 0xd9,
        "data:image/png;base64" => bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
        "data:image/webp;base64" => bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
        _ => false,
    };

    private static async Task<IResult> DeletePhotoAsync(ClaimsPrincipal principal, IUserIdentityLookup lookup, CharkhooneDbContext db, CancellationToken ct)
    {
        var userId = await UserIdAsync(principal, lookup, ct);
        if (userId is null) return Results.Forbid();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId.Value, ct);
        if (user is null) return Results.Forbid();
        user.AvatarDataUrl = null;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { user.PreferredName, user.AvatarDataUrl });
    }
}

public sealed record NameRequest(string? PreferredName);
public sealed record PhotoRequest(string? DataUrl);
