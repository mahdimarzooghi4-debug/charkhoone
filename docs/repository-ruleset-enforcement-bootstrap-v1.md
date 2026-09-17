# Repository Ruleset Enforcement Bootstrap V1

## Purpose

This phase converts the checked-in repository governance contract into an exact GitHub repository-ruleset specification and an idempotent applicator. It does **not** claim that live enforcement is active until GitHub returns an active ruleset for `main` and the effective branch rules contain the required protections.

## Target contract

The ruleset is `charkhoone-main-release-gates` and targets only `refs/heads/main`.

It requires:

- changes to `main` to arrive through a pull request;
- `repository-governance-gate`;
- `release-ci-gate`;
- `container-release-gate`;
- `supply-chain-evidence-gate`;
- `mobile-export-build-gate`;
- all five checks to come from the GitHub Actions application (`integration_id=15368`);
- strict required checks, so the PR must be tested with the latest base branch;
- branch deletion to be blocked;
- force pushes to be blocked.

The review-approval count remains deliberately undefined at the organization-policy level. The ruleset therefore requires a pull request but sets `required_approving_review_count=0` and does not invent code-owner, last-push, stale-review, or thread-resolution policy.

## Applying live enforcement

GitHub requires repository `Administration: write` permission to create or update repository rulesets. Do not store the token in source control or workflow logs.

Run from a trusted operator environment:

```bash
export GITHUB_REPOSITORY=mahdimarzooghi4-debug/charkhoone
export GITHUB_ADMIN_TOKEN='<fine-grained token with Administration: write>'
python3 scripts/release/verify-repository-ruleset-spec.py
python3 scripts/release/apply-repository-ruleset.py
```

The applicator is idempotent. It updates an existing repository ruleset with the exact approved name or creates it when missing, then reads the live ruleset and the effective `main` rules back from GitHub. It writes non-secret evidence to `artifacts/repository-governance/live-enforcement.json` only after verification succeeds.

## Evidence boundary

Static CI can prove that the intended ruleset specification is stable and matches the five release gates. Static CI cannot prove that repository administration settings were changed. Live enforcement must only be claimed after an administration-authorized application succeeds and GitHub live reads confirm the active ruleset.
