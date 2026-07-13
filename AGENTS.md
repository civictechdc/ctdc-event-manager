Also you must read AGENTS.local.md for local project preferences and follow those rules too.

# AGENTS

## Skills

Project skills live in `.agents/skills/`. List them with `bunx skills list`.

Before a task, identify relevant installed skills and read their `SKILL.md`. Use `bunx skills` to install or use skills; always pass `-a universal` to `bunx skills add` and `bunx skills use`.

## Code Quality
For project-wide validation, run:

```sh
bun run typecheck
bun run lint
bun run test
```
