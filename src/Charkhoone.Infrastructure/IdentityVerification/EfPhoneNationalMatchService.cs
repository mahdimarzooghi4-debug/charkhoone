using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.IdentityVerification;

public sealed class UnavailablePhoneNationalMatchAdapter : IPhoneNationalMatchAdapter
{
    public string Provider => "unconfigured";
    public bool GuaranteesProviderIdempotency => false;

    public Task<PhoneNationalMatchResponse> VerifyAsync(
        PhoneNationalMatchRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PhoneNationalMatchResponse(PhoneNationalMatchOutcome.Indeterminate, Provider));
}

// A reusable proof must be tied to both the account and the OIDC-verified phone.
// Only HMAC digests and an authentic provider reference are stored in the audit log;
// national ID and mobile are never stored as raw values by this component.
public sealed class EfPhoneNationalMatchService(
    CharkhooneDbContext db,
    IPhoneNationalMatchAdapter adapter,
    IConfiguration configuration,
    TimeProvider timeProvider) : IPhoneNationalMatchService
{
    private const string Action = "phone_national_match_verified_v1";
    private const string AggregateType = "User";

    public static string? NormalizeMobile(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var value = input.Trim();
        if (value.StartsWith("+98", StringComparison.Ordinal)) value = "0" + value[3..];
        else if (value.StartsWith("0098", StringComparison.Ordinal)) value = "0" + value[4..];
        return value.Length == 11
            && value.StartsWith("09", StringComparison.Ordinal)
            && value.All(c => c is >= '0' and <= '9') ? value : null;
    }

    public static bool ValidNationalId(string? value)
    {
        if (value is null || value.Length != 10 || !value.All(c => c is >= '0' and <= '9'))
            return false;
        if (value.All(c => c == value[0])) return false;
        var sum = 0;
        for (var i = 0; i < 9; i++) sum += (value[i] - '0') * (10 - i);
        var remainder = sum % 11;
        var checkDigit = value[9] - '0';
        return remainder < 2 ? checkDigit == remainder : checkDigit == 11 - remainder;
    }

    public async Task<bool> IsVerifiedForPhoneAsync(
        Guid userId, string verifiedMobile, CancellationToken cancellationToken = default)
    {
        var mobile = NormalizeMobile(verifiedMobile);
        var key = GetHmacKey();
        var validFor = GetEvidenceValidity();
        if (userId == Guid.Empty || mobile is null || key is null || validFor is null) return false;
        var now = timeProvider.GetUtcNow();
        var cutoff = now - validFor.Value;
        var prefix = "phone:" + Digest(key, mobile) + ";";
        return await db.AuditEvents.AsNoTracking().AnyAsync(x =>
            x.AggregateType == AggregateType && x.AggregateId == userId
            && x.Action == Action && x.Reason.StartsWith(prefix)
            && x.OccurredAtUtc >= cutoff && x.OccurredAtUtc <= now, cancellationToken);
    }

    public async Task<bool> IsVerifiedForPairAsync(
        Guid userId, string verifiedMobile, string nationalId,
        CancellationToken cancellationToken = default)
    {
        var mobile = NormalizeMobile(verifiedMobile);
        var key = GetHmacKey();
        var validFor = GetEvidenceValidity();
        if (userId == Guid.Empty || mobile is null || !ValidNationalId(nationalId)
            || key is null || validFor is null) return false;

        var now = timeProvider.GetUtcNow();
        var cutoff = now - validFor.Value;
        var prefix = "phone:" + Digest(key, mobile)
            + ";national:" + Digest(key, nationalId) + ";";
        return await db.AuditEvents.AsNoTracking().AnyAsync(x =>
            x.AggregateType == AggregateType && x.AggregateId == userId
            && x.Action == Action && x.Reason.StartsWith(prefix)
            && x.OccurredAtUtc >= cutoff && x.OccurredAtUtc <= now,
            cancellationToken);
    }

    public async Task<PhoneNationalMatchResult> VerifyAsync(
        Guid userId, string verifiedMobile, string nationalId, DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        var mobile = NormalizeMobile(verifiedMobile);
        if (userId == Guid.Empty || mobile is null || !ValidNationalId(nationalId))
            return new(PhoneNationalMatchProcessStatus.InvalidInput, false);

        // Fail closed unless a real provider explicitly implements exact-key
        // duplicate-charge prevention. There is no fake or local "matched" mode.
        var key = GetHmacKey();
        var validFor = GetEvidenceValidity();
        if (key is null || validFor is null)
            return new(PhoneNationalMatchProcessStatus.NotConfigured, false);
        var now = timeProvider.GetUtcNow();
        var cutoff = now - validFor.Value;

        var phoneDigest = Digest(key, mobile);
        var nationalDigest = Digest(key, nationalId);
        var proofPrefix = $"phone:{phoneDigest};national:{nationalDigest};";
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var user = await db.Users.FromSqlInterpolated(
            $"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (user is null) return new(PhoneNationalMatchProcessStatus.UserNotFound, false);

        var existing = await db.AuditEvents.AsNoTracking().AnyAsync(x =>
            x.AggregateType == AggregateType && x.AggregateId == userId
            && x.Action == Action && x.Reason.StartsWith(proofPrefix)
            && x.OccurredAtUtc >= cutoff && x.OccurredAtUtc <= now, cancellationToken);
        if (existing) return new(PhoneNationalMatchProcessStatus.AlreadyVerified, true);

        // Reuse previously attested exact-pair evidence even if the provider is
        // temporarily disconnected. New paid inquiries still fail closed.
        if (!adapter.GuaranteesProviderIdempotency || adapter.Provider == "unconfigured")
            return new(PhoneNationalMatchProcessStatus.NotConfigured, false);

        // Exact input is stable across retries and can be reconciled by the
        // external provider without a new paid request. This call is not enabled
        // in Production until an idempotent authorized adapter is configured.
        var stableKey = "phone-national:v1:" + Digest(key, $"{userId:D}|{mobile}|{nationalId}");
        var answer = await adapter.VerifyAsync(
            new PhoneNationalMatchRequest(userId, nationalId, mobile, stableKey), cancellationToken);

        if (answer.Outcome == PhoneNationalMatchOutcome.Mismatched)
            return new(PhoneNationalMatchProcessStatus.Mismatch, false);
        if (answer.Outcome != PhoneNationalMatchOutcome.Matched ||
            string.IsNullOrWhiteSpace(answer.ExternalReference) ||
            !string.Equals(answer.Provider, adapter.Provider, StringComparison.Ordinal) ||
            answer.Provider.Length > 128 ||
            answer.ExternalReference.Length > 256)
            return new(PhoneNationalMatchProcessStatus.Indeterminate, false);

        db.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = userId,
            ActorId = "phone-national:" + answer.Provider,
            Action = Action,
            Reason = proofPrefix + "provider:" + answer.Provider + ";reference:" + answer.ExternalReference,
            OccurredAtUtc = occurredAtUtc,
        });
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return new(PhoneNationalMatchProcessStatus.Verified, true);
    }

    private TimeSpan? GetEvidenceValidity()
    {
        // Explicit provider/business approval required. No invented expiry threshold.
        var text = configuration["IdentityMatch:EvidenceValidFor"];
        return TimeSpan.TryParse(text, CultureInfo.InvariantCulture, out var duration)
            && duration > TimeSpan.Zero
            ? duration : null;
    }

    private byte[]? GetHmacKey()
    {
        // Must be an explicitly supplied 32-byte-or-longer private key.
        var value = configuration["IdentityMatch:HmacKey"];
        return value is not null && Encoding.UTF8.GetByteCount(value) >= 32
            ? Encoding.UTF8.GetBytes(value) : null;
    }

    private static string Digest(byte[] key, string value) =>
        Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(value)));
}
