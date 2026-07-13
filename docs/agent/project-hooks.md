# Project Hooks

This document records the project hook integrations, their enforcement
boundaries, and their primary documentation. It is platform-neutral: each
platform entry uses the same fields so the document remains coherent as
integrations change.

## Commit Message Guidance

The canonical rules are in
[Git Commit Message Convention](git-commit-convention.md). Hook integrations
must report that document as the source of every result.

### Enforcement Policy

| Check | Result | Reason |
| --- | --- | --- |
| Type is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert` | Block | Deterministic Conventional Commit rule |
| Optional scope uses parentheses and optional breaking marker is immediately before `:` | Block | Deterministic subject grammar |
| Subject has `: ` followed by a description | Block | Required subject structure |
| Description starts with an uppercase letter | Block | Deterministic project rule |
| Subject ends with a period | Block | Deterministic project rule |
| Subject is 51-72 characters | Warn, allow | Project soft limit is 50 characters |
| Subject exceeds 72 characters | Warn, allow | Hard limit guidance is advisory for this integration |
| Body line exceeds 72 characters | Warn, allow | Wrapped body text is detectable but non-blocking |
| Imperative mood, explanation quality, and commit cohesion | Do not scan | These require semantic judgment |

## Platform Integrations

### OpenCode

| Field | Value |
| --- | --- |
| Status | Planned project integration |
| Configuration location | `.opencode/plugins/commit-message-guidance.ts` |
| Interception point | `tool.execute.before` for the `bash` tool |
| Trigger | A direct `git commit` command with an inline `-m` message |
| Blocking behavior | Throw an error for a blocking result before the command runs |
| Warning behavior | Emit actionable guidance while allowing the command to run |
| Source rules | [Git Commit Message Convention](git-commit-convention.md) |

The plugin must skip commands whose message cannot be extracted safely. It
must not infer shell expansions or command substitutions.
For every block or warning, include the failed rule and a compliant subject
template, for example `feat(scope): Add concise description`.

**References**

- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode configuration schema](https://opencode.ai/config.json)

### Visual Studio Code

| Field | Value |
| --- | --- |
| Status | Hook API available in Preview |
| Configuration location | `.github/hooks/*.json` for workspace hooks |
| Interception point | `PreToolUse` |
| Enforcement capability | Can deny a single tool call or stop processing through JSON output or exit code |
| Compatibility note | VS Code can read Claude-format hook files, but ignores their matchers |

**References**

- [VS Code Agent Hooks](https://code.visualstudio.com/docs/agent-customization/hooks)
- [VS Code Hooks Reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference)

### Claude Code

| Field | Value |
| --- | --- |
| Status | Hook API available |
| Configuration location | `.claude/settings.json` or plugin `hooks/hooks.json` |
| Interception point | `PreToolUse` matched to the Bash tool |
| Enforcement capability | Can deny a tool call with hook JSON output |

**References**

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Hook Guide](https://code.claude.com/docs/en/hooks-guide)

### Git

| Field | Value |
| --- | --- |
| Status | Native hook API available |
| Configuration location | `$GIT_DIR/hooks/commit-msg` or `core.hooksPath` |
| Interception point | `commit-msg` after Git prepares the message |
| Enforcement capability | Non-zero exit aborts the commit |
| Limitation | `git commit --no-verify` bypasses the hook |

**References**

- [Git Hooks: `commit-msg`](https://git-scm.com/docs/githooks#_commit_msg)
- [Git Commit](https://git-scm.com/docs/git-commit)

### Zed

| Field | Value |
| --- | --- |
| Status | No native agent lifecycle hook API documented |
| Available integration | Project instructions and Agent Skills |
| Project instruction file | `AGENTS.md` |
| Enforcement capability | Guidance only; no documented arbitrary tool-call interception |

**References**

- [Zed Agent Instructions](https://zed.dev/docs/ai/instructions)
- [Zed Agent Skills](https://zed.dev/docs/ai/skills)
- [Zed Extensions](https://zed.dev/docs/extensions/developing-extensions)

## Platform Entry Contract

Each platform section contains: status, configuration location, interception
point, enforcement capability, known limitations, and official references.
Update the entry when a platform API or the project integration changes. Do
not treat instructions or skills as enforcement unless the platform exposes a
documented blocking lifecycle hook.
