# Repository Governance Hardening V1

## Purpose

This phase makes the repository-side merge contract explicit and machine-verifiable. It does not claim that GitHub branch protection or a GitHub ruleset is active until that setting is actually enabled in GitHub.

The repository contract is `deploy/repository-governance.json` and is validated by `scripts/release/verify-repository-governance.py`.

## Stable required status checks

The intended `main` protection must require these exact check names:

- `repository-governance-gate`
- `release-ci-gate`
- `container-release-gate`
- `supply-chain-evidence-gate`

The check names are intentionally explicit job names so workflow file names or internal job IDs can change without silently changing the protection contract.

`release-ci-gate` always runs after backend, web, and mobile CI jobs and explicitly fails unless all three succeeded.

`container-release-gate` always runs after base-image pin validation plus API, Worker, and Web image jobs and explicitly fails unless every dependency succeeded. This avoids treating a skipped aggregate job as release success.

`supply-chain-evidence-gate` performs the SHA-bound SBOM and vulnerability-evidence workflow.

`repository-governance-gate` verifies the repository policy itself, including stable gate names, pull-request triggers, read-only workflow permissions, SHA-pinned GitHub Actions, and the prohibition on `pull_request_target` in current workflows.

The path-filtered `staging-release-ops-validation` workflow remains a compatibility/test workflow and is not a globally required check because it does not run for every pull request.

## GitHub enforcement baseline

The intended branch ruleset targets `main` and requires:

- changes through a pull request before merge;
- all four status checks above to pass;
- branches to be up to date with `main` before merge;
- force pushes blocked;
- branch deletion blocked.

The number of approving reviews is deliberately not encoded because no organization-wide approval-count policy is defined in this repository. Do not invent one as part of automation.

GitHub documents branch rulesets with rules for requiring pull requests, requiring status checks, blocking force pushes, and restricting deletions. GitHub also documents the strict required-check option as requiring the topic branch to be up to date before merging. Required check names for normal workflow jobs are the job names, which is why this repository uses the four stable names above.

## Activation handoff

An administrator with permission to edit repository rules must perform the following in GitHub:

1. Open repository Settings.
2. Open Rules, then Rulesets.
3. Create a new branch ruleset.
4. Target the default branch / `main`.
5. Set enforcement to Active.
6. Enable `Require a pull request before merging`.
7. Enable `Require status checks to pass before merging`.
8. Add all four exact required status-check names listed above.
9. Enable the option requiring branches to be up to date before merging.
10. Keep force pushes blocked.
11. Keep deletion of `main` restricted.
12. Do not add bypass actors unless an explicit organization policy authorizes them.
13. Create the ruleset.

After activation, verify the repository ruleset from GitHub and perform a negative test with a pull request whose required check is failing. The pull request must not be mergeable until the check succeeds.

## Current execution boundary

The connected GitHub integration used during this phase can read the repository ruleset collection, which currently contains no rulesets, but it does not have repository-administration access to the branch-protection endpoint and exposes no ruleset mutation action. Therefore this phase cannot truthfully claim to enable GitHub enforcement itself.

The governance workflow evidence records:

- the exact release SHA;
- the SHA-256 of `deploy/repository-governance.json`;
- the SHA-256 of the verifier;
- the four required check names;
- `github_branch_protection=enforcement-not-verified-by-workflow`;
- `github_ruleset=enforcement-not-verified-by-workflow`.

That distinction is intentional: repository policy verification is automated; GitHub-side enforcement requires an administrator-capable action or explicit UI/API configuration.

## References

Current behavior and terminology were checked against GitHub Docs sections `Creating rulesets for a repository`, `Available rules for rulesets`, and `Troubleshooting rules` on 2026-09-17.
