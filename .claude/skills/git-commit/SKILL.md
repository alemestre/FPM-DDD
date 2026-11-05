---
name: git-commit
description: >
  Prepare and create Git commits. Use when the user asks to commit, create a
  commit, stage changes for a commit, or prepare a commit message. Inspect the
  complete relevant diff, stage only intended files, and follow repository
  commit-message conventions.
disable-model-invocation: true
---

# Git Commit Assistant

## Objective

Create small, coherent, reviewable commits without including unrelated user
changes. This skill is explicitly invoked by the user; still obtain confirmation
before any commit if the request did not clearly authorize creating one.

## 1. Inspect repository state

Start with:

```bash
git status --short --branch
git branch --show-current
git diff
git diff --cached
```

Also inspect untracked files and relevant project guidance. Do not assume
untracked files appear in `git diff`.

Determine:
- Current branch.
- Staged, unstaged, and untracked changes.
- Whether changes belong to one logical unit.
- Whether staged changes were already prepared by the user.
- Whether any files may contain secrets, credentials, generated output, or
  local-only configuration.

Do not alter existing staged changes without first understanding their purpose.

## 2. Review the proposed commit contents

Inspect the full diff for every file that may be included:

```bash
git diff -- <path>
git diff --cached -- <path>
```

Check for:
- Accidental debug statements or temporary code.
- Tests or documentation that should accompany the change.
- Unrelated modifications.
- Generated files that should not be committed.
- Secrets, tokens, private keys, credentials, or personal data.
- Changes that appear incomplete or internally inconsistent.

If unrelated changes are mixed together, keep them out of the commit. Ask the
user how to proceed if the intended file boundaries are unclear.

## 3. Validate

Run the most relevant available checks for the change, using project scripts
and instructions where available. Examples include tests, lint, type checking,
and build.

Do not invent test commands. If checks are expensive, unavailable, or outside
the requested scope, explain that and report them as not run.

A failing check must be reported. Do not conceal or work around failures merely
to produce a commit.

## 4. Stage precisely

Stage only files that belong to the requested commit. Prefer explicit paths:

```bash
git add -- path/to/file-a path/to/file-b
```

Do not use `git add .` or `git add -A` blindly.

If a file contains both relevant and unrelated hunks, consider interactive
staging (`git add -p`) only when it can be done safely and the intended hunks
are clear. Otherwise ask the user.

After staging, inspect:

```bash
git status --short
git diff --cached --check
git diff --cached
```

Confirm that the staged diff contains exactly the intended changes. Do not
commit if unrelated or sensitive content is staged.

## 5. Compose the commit message

First inspect recent commit messages and repository contribution guidance.
Follow the existing convention.

If the repository uses Conventional Commits, use:

```text
<type>(<scope>): <imperative description>
```

Common types:
- `feat`: new functionality
- `fix`: bug fix
- `refactor`: restructuring without intended behavior change
- `perf`: performance improvement
- `test`: tests
- `docs`: documentation
- `style`: formatting or style-only changes
- `build`: build system or dependency changes
- `ci`: CI/CD changes
- `chore`: maintenance

Keep the subject concise and specific. Describe the purpose or user-visible
effect, not merely the files touched. Do not invent a scope if the project
does not use scopes.

## 6. Create the commit

Only run `git commit` when the user has clearly requested the commit. If they
asked only for a suggested message or preparation, stop before committing.

Never amend an existing commit unless explicitly requested. Never bypass
commit hooks with `--no-verify` unless explicitly authorized.

After committing, verify the result:

```bash
git status --short --branch
git log -1 --oneline
```

Do not push unless the user separately requested a push.

## 7. Report

Report:
- Commit hash and subject.
- Branch.
- Files included.
- Checks run and their outcomes.
- Any checks not run or known limitations.
- Whether the working tree still contains other changes.

If the commit command fails, report the failure and preserve the repository
state; do not silently retry with bypass flags.
