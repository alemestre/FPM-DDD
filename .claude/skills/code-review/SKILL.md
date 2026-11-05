---
name: code-review
description: >
  Review code changes for bugs, regressions, security issues, correctness,
  maintainability, and missing tests. Use when the user asks for a code review,
  review of a diff or pull request, or an assessment of changes before merge.
  Focus on actionable findings rather than style preferences.
---

# Code Review Assistant

## Objective

Review the requested changes as a critical, evidence-based reviewer. Prioritize
real defects and risks over stylistic preferences. Do not modify files while
performing a review unless the user separately asks for fixes.

## 1. Establish review scope

Determine the intended comparison:
- Working tree changes: inspect staged and unstaged diffs.
- Branch review: compare the feature branch with its target.
- Commit review: inspect the specified commit and its parent.
- Pull request review: use the stated base and head revisions.

If the base branch or comparison range is ambiguous, ask one concise question
rather than silently choosing an unreliable range.

Start with:

```bash
git status --short --branch
git diff
git diff --cached
```

For branch comparisons, use an appropriate range such as:

```bash
git diff <base>...<head>
```

Inspect the surrounding code and relevant callers, tests, types, configuration,
and documentation. A diff alone may not provide enough context.

## 2. Review priorities

Look for the following, in order of importance:

### Correctness and behavior
- Incorrect logic, conditions, calculations, or state transitions.
- Null, undefined, empty, boundary, and error cases.
- Race conditions, concurrency problems, and lifecycle issues.
- Incorrect assumptions about ordering, time zones, encoding, or precision.
- Broken API contracts or backward compatibility.

### Security and privacy
- Injection, unsafe deserialization, and improper input validation.
- Authentication or authorization gaps.
- Exposure of secrets, personal data, or sensitive logs.
- Unsafe file, network, process, or permission handling.
- Insecure defaults and trust-boundary mistakes.

### Reliability and performance
- Unhandled errors and resource leaks.
- N+1 queries or avoidable expensive operations.
- Unbounded loops, memory growth, or excessive retries.
- Failure handling, timeouts, and partial-success behavior.

### Tests and maintainability
- Missing tests for meaningful behavior changes.
- Tests that do not exercise the relevant edge cases.
- Misleading names, duplicated logic, or unnecessary complexity where these
  create a concrete maintenance risk.

Do not report formatting or subjective preferences as defects unless the
repository explicitly requires them or they create a practical problem.

## 3. Validate each finding

Before reporting a finding:

1. Confirm it is introduced by the reviewed changes.
2. Trace the relevant code path and surrounding assumptions.
3. Check whether another layer already handles the case.
4. Identify a concrete failure scenario.
5. Ensure the finding is not speculative.

Do not claim tests were run unless you actually ran them. If useful, run
targeted tests or static checks, but avoid changing the working tree.

## 4. Severity

Use these levels consistently:

- **Critical**: exploitable security issue, data loss, or severe system-wide
  failure.
- **High**: likely defect with significant user, data, or service impact.
- **Medium**: meaningful defect with a narrower scope or workaround.
- **Low**: minor defect or edge case with limited impact.

Do not inflate severity. If no actionable defects are found, say so clearly
and mention any remaining testing gaps.

## 5. Finding format

Present findings first, ordered by severity. Each finding should include:

- **[Severity] Short title**
- **Location:** file and the smallest useful line range.
- **Problem:** what is wrong.
- **Impact:** what can happen and under which conditions.
- **Suggested direction:** a concise way to address it.

Use precise line references from the changed code whenever possible. Avoid
large line ranges and avoid repeating the entire implementation.

Example:

```text
[High] Authorization is skipped for the update endpoint
Location: src/api/users.ts:84-91

The handler checks that a user is authenticated but does not verify that the
user can modify the requested account. An authenticated user could update
another user's profile by changing the account ID.

Suggested direction: enforce ownership or the appropriate permission check
before applying the update.
```

## 6. Review summary

After findings, include a short summary:
- Overall assessment.
- Important areas inspected.
- Tests or checks actually executed.
- Areas not verified and residual risks.

If there are no findings, do not manufacture issues to fill the report.

## 7. Boundaries

- Do not edit files or automatically fix findings during a review.
- Do not stage, commit, push, merge, or rebase as part of a review.
- Do not expose secrets in the report; describe their location and risk without
  reproducing their value.
- Distinguish confirmed defects from questions or suggestions.
