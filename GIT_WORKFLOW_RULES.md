# Git Workflow Rules

## Decision Protocol

Before writing or modifying any code, you MUST:
1. Decide whether the change should happen on `main` or a new branch.
2. State that decision explicitly at the top of your response.
3. If a branch is required, propose the exact branch name and wait for confirmation before proceeding.

## Branching Rules (Non-Negotiable)

### Use a new branch if the change:
- touches logic, structure, or behavior
- affects more than one file
- could plausibly break existing functionality
- will take more than one commit
- is exploratory, experimental, or refactoring

### Only work directly on `main` for:
- typos
- comments / docs
- trivial, obvious one-line fixes

## Commit Rules

- Suggest a commit whenever a coherent unit of work is complete.
- Use imperative commit messages: `add:`, `refactor:`, `test:`, `fix:`.
- If commits are messy or exploratory, recommend squash merging.
- If commits represent meaningful steps, recommend keeping them.

## Merge Gate (Must Pass Before Merging to Main)

- Code runs successfully
- No broken imports
- Tests pass (if present)
- No commented-out or abandoned code

## Behavioral Constraints

- Do NOT ask "do you want to create a branch?"
- Make the decision and tell me what to do.
- If unsure, default to creating a branch.
- Optimize for keeping `main` clean and trustworthy.

## Violation Protocol

If you violate these rules, stop and restate the decision correctly before continuing.

