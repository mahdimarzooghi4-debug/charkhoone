using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Internal;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore.Update.Internal;

namespace Charkhoone.Infrastructure.Persistence.LedgerProtection;

// EF 10.0.12 internal service extension. Pin/retest when upgrading EF.
// Real `dotnet ef migrations add` serializes these SQL operations into the migration;
// historical migrations therefore do not depend on mutable embedded resources.
#pragma warning disable EF1001
public sealed class LedgerProtectionModelDiffer(
    IRelationalTypeMappingSource typeMappingSource,
    IMigrationsAnnotationProvider migrationsAnnotationProvider,
    IRelationalAnnotationProvider relationalAnnotationProvider,
    IRowIdentityMapFactory rowIdentityMapFactory,
    CommandBatchPreparerDependencies commandBatchPreparerDependencies)
    : MigrationsModelDiffer(typeMappingSource, migrationsAnnotationProvider, relationalAnnotationProvider,
        rowIdentityMapFactory, commandBatchPreparerDependencies)
{
    public const string Annotation = "Charkhoone:LedgerProtection";
    public const string Version = "v1";

    public override bool HasDifferences(IRelationalModel? source, IRelationalModel? target)
        => GetDifferences(source, target).Count != 0;

    public override IReadOnlyList<MigrationOperation> GetDifferences(IRelationalModel? source, IRelationalModel? target)
    {
        var before = source?.Model.FindAnnotation(Annotation)?.Value as string;
        var after = target?.Model.FindAnnotation(Annotation)?.Value as string;
        var operations = base.GetDifferences(source, target).ToList();
        if (before == after) return operations;
        if (before is null && after == Version)
        {
            // Full initial schema creation has no old journal tables to preflight.
            if (source?.FindTable("journal_entries", null) is not null)
                operations.Insert(0, new SqlOperation { Sql = Read("Preflight.sql") });
            operations.Add(new SqlOperation { Sql = Read("Install.sql") });
        }
        else if (before == Version && after is null)
            operations.Insert(0, new SqlOperation { Sql = Read("Remove.sql") });
        else
            throw new InvalidOperationException($"Unsupported ledger protection change: {before} -> {after}");
        return operations;
    }

    private static string Read(string name)
    {
        using var stream = typeof(LedgerProtectionModelDiffer).Assembly.GetManifestResourceStream(
            $"Charkhoone.Infrastructure.Persistence.LedgerProtection.{name}")
            ?? throw new InvalidOperationException($"Missing ledger SQL resource: {name}");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
#pragma warning restore EF1001
