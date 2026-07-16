# Main Branch Protection Design

## Goal

Protect `main` in `civictechdc/ctdc-event-manager` with the existing PR test
job while keeping Docker validation post-merge and Code Owner review optional.

## Scope

- Add `@kvithayathil` as the repository-wide Code Owner.
- Keep `Test / test` as the sole required status check for `main`.
- Require pull requests and up-to-date branches before merging to `main`.
- Block force pushes and deletion of `main`.
- Allow repository administrators to bypass branch protection.
- Run the existing Docker build and smoke test only after pushes to `main`.

## Non-Goals

- Require Code Owner approval.
- Require the Docker job before merging a pull request.
- Add scheduled Docker validation.
- Change application code or unit tests.

## Implementation

`test.yml` retains the `Test` workflow and `test` job, preserving its check
name as `Test / test`. The `docker` job is guarded so it runs only when the
workflow was triggered by a push to `refs/heads/main`.

`.github/CODEOWNERS` contains `* @kvithayathil`. GitHub branch protection is
configured through `gh api` for `civictechdc/ctdc-event-manager` with:

- `Test / test` as the required, strict status check.
- Pull requests required, with zero required approvals.
- `require_code_owner_reviews` disabled.
- `enforce_admins` disabled, allowing administrator bypass.
- Force pushes and branch deletion disabled.

## Validation

- Run local typecheck, lint, and unit tests.
- Verify workflow YAML and the Docker-job condition.
- Query the GitHub branch-protection endpoint after applying settings.
- If GitHub is available, open a disposable branch PR to confirm `Test / test`
  is required; close the PR and delete the branch afterward.
