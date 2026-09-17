using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class MonthlyObligationRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public int ContractMonthNumber { get; set; }
    public DateTimeOffset DueAtUtc { get; set; }
    public MonthlyObligationStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? ClosedAtUtc { get; set; }
}

public sealed class MonthlyObligationComponentRow
{
    public Guid PaymentInstructionId { get; set; }
    public Guid MonthlyObligationId { get; set; }
    public MonthlyObligationComponentKind Kind { get; set; }
}

public sealed class ContractDelinquencyRow
{
    public Guid ContractId { get; set; }
    public int ConsecutiveMissedMonths { get; set; }
    public bool CancellationRequired { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
