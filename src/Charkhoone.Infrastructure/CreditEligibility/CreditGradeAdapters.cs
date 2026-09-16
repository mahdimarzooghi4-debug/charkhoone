using Charkhoone.Application.CreditEligibility;
using Charkhoone.Domain.Finance;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.CreditEligibility;

public sealed class DevelopmentExternalCreditGradeAdapter(IConfiguration configuration)
    : IExternalCreditGradeAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalCreditGradeResponse> CheckAsync(
        ExternalCreditGradeRequest request,
        CancellationToken cancellationToken = default)
    {
        var configuredStatus = configuration["ExternalAdapters:CreditGrade:DevelopmentStatus"];
        var status = Enum.TryParse<ExternalCreditResultStatus>(configuredStatus, ignoreCase: true, out var parsed)
            ? parsed
            : ExternalCreditResultStatus.Unknown;

        var configuredSubGrade = configuration["ExternalAdapters:CreditGrade:DevelopmentSubGrade"];
        var subGrade = status == ExternalCreditResultStatus.Valid && !string.IsNullOrWhiteSpace(configuredSubGrade)
            ? configuredSubGrade.Trim()
            : null;

        return Task.FromResult(new ExternalCreditGradeResponse(
            status,
            Provider,
            subGrade,
            $"dev:{request.AssessmentId:D}",
            "development_mock_response"));
    }
}

public sealed class UnavailableExternalCreditGradeAdapter : IExternalCreditGradeAdapter
{
    public string Provider => "unconfigured";

    public Task<ExternalCreditGradeResponse> CheckAsync(
        ExternalCreditGradeRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalCreditGradeResponse(
            ExternalCreditResultStatus.Unknown,
            Provider,
            ExternalSubGrade: null,
            ReasonCode: "credit_grade_provider_unconfigured"));
}
