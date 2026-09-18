#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

PROJECT = Path("tests/Charkhoone.Api.IntegrationTests/Charkhoone.Api.IntegrationTests.csproj")
DEFAULT_REPORT = Path("artifacts/pilot-scenario-cohort/summary.json")

SCENARIOS: dict[str, dict[str, str]] = {
    "success": {
        "test": "Charkhoone.Api.IntegrationTests.TrustedBankFundingIntegrationTests.TrustedEligibility_DrivesBankApprovalAndFundFreeze_AndReplayIsIdempotent",
        "evidence": "trusted eligibility -> approved bank funding -> principal freeze -> idempotent replay",
    },
    "indeterminate": {
        "test": "Charkhoone.Api.IntegrationTests.TrustedCreditEligibilityIntegrationTests.ReconcileEndpoint_IsApplicantOwned_AndUnavailableProviderUsesTrustedSnapshot",
        "evidence": "unavailable provider -> external-check indeterminate with trusted persisted amount",
    },
    "retry": {
        "test": "Charkhoone.Api.IntegrationTests.ScenarioCohortCoverageIntegrationTests.Retry_IndeterminateBankDecision_CanResumeAndFundExactlyOnce",
        "evidence": "indeterminate bank result -> retry -> funded -> replay does not call provider again",
    },
    "decline": {
        "test": "Charkhoone.Api.IntegrationTests.ScenarioCohortCoverageIntegrationTests.Decline_BankDecision_RejectsApplicationWithoutFundingOrFundCall",
        "evidence": "authoritative bank decline -> rejected application, no allocation and no fund call",
    },
    "needs-documents": {
        "test": "Charkhoone.Api.IntegrationTests.ScenarioCohortCoverageIntegrationTests.NeedsDocuments_PropertyEvidence_PersistsStateWithoutCreatingContract",
        "evidence": "property evidence needs documents -> persisted state, no contract creation",
    },
    "payment": {
        "test": "Charkhoone.Api.IntegrationTests.MonthlyDueLifecycleIntegrationTests.DueMonth_ExactConfirmedComponents_ClosesPaidAndReplayDoesNotRequery",
        "evidence": "exact confirmed monthly components -> paid -> replay does not requery provider",
    },
    "delinquency": {
        "test": "Charkhoone.Api.IntegrationTests.MonthlyDueLifecycleIntegrationTests.ThirdDueMonth_BlockedByOlderArrears_LatchesCancellationWithoutProviderCall",
        "evidence": "oldest debt first and third consecutive missed month -> cancellation pending",
    },
    "cancellation": {
        "test": "Charkhoone.Api.IntegrationTests.CancellationSettlementV2IntegrationTests.Cancellation_SettlesLostReturnFromTenantContribution_TransfersOnlyResidual_AndLeavesFrozenPrincipalUntouched",
        "evidence": "cancellation settlement preserves frozen bank principal and settles tenant contribution/Lost Fund Return",
    },
    "maturity": {
        "test": "Charkhoone.Api.IntegrationTests.NormalMaturityIntegrationTests.CompleteTwelveMonthSchedule_TransitionsActiveContractOnce",
        "evidence": "complete 12-month schedule -> maturity transition exactly once",
    },
}


def parse_positive_int(value: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("must be an integer") from exc

    if parsed < 1:
        raise argparse.ArgumentTypeError("must be at least 1")
    if parsed > 10000:
        raise argparse.ArgumentTypeError("must be 10000 or fewer per scenario")
    return parsed


def parse_args() -> argparse.Namespace:
    env_cases = os.environ.get("CHARKHOONE_SCENARIO_CASE_COUNT", str(len(SCENARIOS)))
    parser = argparse.ArgumentParser(
        description=(
            "Run a configurable internal-pilot scenario cohort against the real "
            "PostgreSQL integration boundary."
        )
    )
    parser.add_argument(
        "--cases",
        type=parse_positive_int,
        default=parse_positive_int(env_cases),
        help=(
            "total number of independent PostgreSQL-backed cases to execute across "
            "the selected scenarios (default: CHARKHOONE_SCENARIO_CASE_COUNT or "
            "one case per built-in scenario)"
        ),
    )
    parser.add_argument(
        "--scenarios",
        default=",".join(SCENARIOS),
        help=(
            "comma-separated scenario names; defaults to all: "
            + ",".join(SCENARIOS)
        ),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT,
        help=f"JSON summary path (default: {DEFAULT_REPORT})",
    )
    parser.add_argument(
        "--no-build",
        action="store_true",
        help="skip the one-time integration-test project build",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="list supported scenarios and exit without touching PostgreSQL",
    )
    return parser.parse_args()


def selected_scenarios(raw: str) -> list[str]:
    names = [item.strip() for item in raw.split(",") if item.strip()]
    if not names:
        raise ValueError("at least one scenario is required")

    unknown = [name for name in names if name not in SCENARIOS]
    if unknown:
        raise ValueError(
            "unknown scenario(s): "
            + ", ".join(unknown)
            + ". Supported: "
            + ", ".join(SCENARIOS)
        )

    if len(set(names)) != len(names):
        raise ValueError("scenario names must not be duplicated")

    return names


def require_real_postgres_opt_in() -> None:
    connection = os.environ.get("CHARKHOONE_INTEGRATION_POSTGRES", "").strip()
    if not connection:
        raise RuntimeError(
            "CHARKHOONE_INTEGRATION_POSTGRES must point to an explicit PostgreSQL "
            "integration database. The harness does not invent a connection."
        )

    if os.environ.get("CHARKHOONE_SCENARIO_ALLOW_POSTGRES", "").lower() != "true":
        raise RuntimeError(
            "Set CHARKHOONE_SCENARIO_ALLOW_POSTGRES=true to confirm that the configured "
            "integration PostgreSQL target may receive disposable scenario data."
        )


def run(command: list[str], env: dict[str, str]) -> int:
    completed = subprocess.run(command, env=env, check=False)
    return completed.returncode


def git_sha() -> str | None:
    configured = os.environ.get("GITHUB_SHA", "").strip()
    if len(configured) == 40:
        return configured

    try:
        completed = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return None

    value = completed.stdout.strip()
    return value if completed.returncode == 0 and len(value) == 40 else None


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def main() -> int:
    args = parse_args()

    if args.list:
        for name, contract in SCENARIOS.items():
            print(f"{name}: {contract['evidence']}")
        return 0

    try:
        scenarios = selected_scenarios(args.scenarios)
        require_real_postgres_opt_in()
    except (ValueError, RuntimeError) as exc:
        print(f"scenario cohort configuration error: {exc}", file=sys.stderr)
        return 2

    env = os.environ.copy()
    env["CHARKHOONE_SCENARIO_HARNESS"] = "true"

    if args.cases < len(scenarios):
        print(
            "scenario cohort configuration error: --cases must be at least the "
            "number of selected scenarios so every selected scenario is exercised",
            file=sys.stderr,
        )
        return 2

    if not args.no_build:
        build = [
            "dotnet",
            "build",
            str(PROJECT),
            "--configuration",
            "Release",
        ]
        if run(build, env) != 0:
            print("scenario cohort build failed", file=sys.stderr)
            return 3

    started_at = utc_now()
    started = time.monotonic()
    results: list[dict[str, object]] = []
    sequence = 0

    per_scenario_counts = {name: 0 for name in scenarios}
    for sequence in range(1, args.cases + 1):
        scenario = scenarios[(sequence - 1) % len(scenarios)]
        contract = SCENARIOS[scenario]
        per_scenario_counts[scenario] += 1
        case_number = per_scenario_counts[scenario]
        case_started = time.monotonic()
        print(
            f"[scenario-cohort] {sequence}/{args.cases} "
            f"scenario={scenario} case={case_number}",
            flush=True,
        )

        command = [
            "dotnet",
            "test",
            str(PROJECT),
            "--configuration",
            "Release",
            "--no-build",
            "--filter",
            f"FullyQualifiedName={contract['test']}",
            "--logger",
            "console;verbosity=minimal",
        ]
        return_code = run(command, env)
        duration_seconds = round(time.monotonic() - case_started, 3)
        results.append(
            {
                "sequence": sequence,
                "scenario": scenario,
                "scenarioCase": case_number,
                "test": contract["test"],
                "passed": return_code == 0,
                "exitCode": return_code,
                "durationSeconds": duration_seconds,
            }
        )

    passed = sum(1 for item in results if item["passed"])
    failed = len(results) - passed
    summary = {
        "schemaVersion": 1,
        "generatedAtUtc": utc_now(),
        "startedAtUtc": started_at,
        "gitSha": git_sha(),
        "postgresEvidence": "real-postgresql-integration-boundary",
        "requestedCaseCount": args.cases,
        "selectedScenarios": scenarios,
        "scenarioCaseCounts": per_scenario_counts,
        "totalCases": len(results),
        "passedCases": passed,
        "failedCases": failed,
        "durationSeconds": round(time.monotonic() - started, 3),
        "scenarioContracts": {
            name: {
                "test": SCENARIOS[name]["test"],
                "evidence": SCENARIOS[name]["evidence"],
            }
            for name in scenarios
        },
        "results": results,
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        f"[scenario-cohort] completed total={len(results)} "
        f"passed={passed} failed={failed} report={args.report}",
        flush=True,
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
