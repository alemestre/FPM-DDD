---
name: git
description: >
  Handle general Git operations in this repository, including status, diffs,
  branches, history, fetch, pull, push, merge, rebase, cherry-pick, stashes,
  tags, and conflict investigation. Use for Git tasks other than the dedicated
  commit workflow or code review workflow.
---

# Git Assistant

## Objective

Perform Git operations carefully, preserve the user's work, and explain relevant
effects before changing repository state.

## Mandatory first checks

Before any operation that depends on repository state, run:

```bash
git status --short --branch
git branch --show-current
```

Inspect additional information as needed:

```bash
git diff
git diff --cached
git branch -vv
git remote -v
git log -5 --oneline --decorate
```

Do not assume the working tree is clean, the current branch is the intended
branch, or that local and remote branches are synchronized.

## General safeguards

- Never discard, overwrite, or silently modify uncommitted user work.
- Do not stage files unless staging is part of the requested task.
- Do not use broad staging or cleanup commands blindly.
- Do not change remotes, upstreams, Git configuration, or branch tracking
  without explaining the change and obtaining authorization.
- Do not rewrite published/shared history without explicit authorization.
- Do not force-push by default. If explicitly authorized, prefer
  `--force-with-lease` to `--force`.
- Never expose secrets from diffs, configuration, or history in summaries.
- Prefer read-only inspection before state-changing commands.

## Branches

Before creating or switching branches:

1. Inspect the current branch and working tree.
2. Check existing branch naming conventions.
3. Identify whether uncommitted changes could be affected.
4. Use a descriptive branch name consistent with the repository.

Suggested names, only if the repository has no convention:

- `feature/<description>`
- `fix/<description>`
- `refactor/<description>`
- `chore/<description>`
- `hotfix/<description>`

Never delete a branch unless the user explicitly requests it. Before deletion,
check whether it contains commits not merged elsewhere.

## History and investigation

Useful commands include:

```bash
git log --oneline --graph --decorate -20
git show --stat <commit>
git show <commit>
git log --follow -- <path>
git blame <path>
git diff <base>...<head>
```

Use the narrowest command that answers the question. Distinguish clearly
between facts shown by Git and conclusions inferred from them.

## Fetch, pull, and push

Before fetching, pulling, or pushing, identify the remote and branch involved.

Before pulling:
- Check for local modifications.
- Check the upstream branch.
- Determine whether local commits are ahead or behind.
- Explain whether the operation may merge or rebase.

Before pushing:
- Inspect the commits that would be sent.
- Verify the destination remote and branch.
- Check for unintended commits and sensitive files.
- Do not push unless the user requested a push.

A fetch is generally safer than a pull when remote state needs inspection first.

## Merge, rebase, and cherry-pick

Before starting:
- Confirm the source and target branches or commit.
- Check the working tree.
- Inspect the commits involved.
- Explain whether history will be rewritten.

Never automatically resolve conflicts by choosing `ours` or `theirs`.
Inspect the conflicting content and preserve the intent of both sides.
After resolving conflicts, run relevant tests and inspect the resulting diff.

Do not continue or abort an in-progress merge, rebase, or cherry-pick unless
the user's request and the repository state make the intended action clear.

## Stashes and tags

Inspect existing stashes before creating, applying, or dropping one:

```bash
git stash list
git stash show --stat stash@{0}
```

Do not drop or clear stashes without explicit authorization.

Before creating or deleting tags, inspect the tag name and target commit.
Never move or delete an existing tag without explicit authorization.

## Destructive operations

Obtain explicit, current authorization before commands that can discard work
or rewrite history, including:

- `git reset --hard`
- `git clean` (especially `-f`, `-d`, or `-x`)
- `git push --force` or `git push --force-with-lease`
- `git branch -D`
- `git checkout -- <path>`
- `git restore` when it discards user changes
- `git commit --amend`
- rebasing published/shared commits
- dropping stashes or deleting/replacing tags

Before execution, state what will be changed or lost. An authorization for one
operation does not authorize a different destructive operation.

## Completion report

After a state-changing task, summarize:
- What operation was performed.
- Which branch, remote, or commit was involved.
- What changed.
- Whether tests or validations were run.
- Any remaining risks or unresolved conflicts.

Report failures accurately; never imply an operation succeeded if it did not.
