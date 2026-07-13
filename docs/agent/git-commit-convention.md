# Git Commit Message Convention

Follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/#specification) specification, combined with the widely-accepted seven rules of great commit messages ([cbea.ms](https://cbea.ms/git-commit/), [Pro Git](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project#_commit_guidelines), [git-commit manpage](https://git-scm.com/docs/git-commit#_discussion)).

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Subject line

- **Type prefix** (required): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Scope** (optional): noun in parentheses, e.g. `feat(api):`, `fix(parser):`
- **Breaking change**: append `!` before the colon, e.g. `feat!:`, `feat(api)!:`
- **Description** (required): imperative mood, capitalized, no trailing period
  - Must complete the sentence: "If applied, this commit will ___"
  - Examples: `Add Polish language`, `Fix array parsing issue`, `Drop support for Node 6`
- **Soft length limit**: aim for 50 characters total (including type prefix). 72 is the hard limit — GitHub truncates beyond this. The type prefix counts toward the limit, so keep descriptions tight.
- **Blank line** between subject and body is mandatory (Git treats text up to the first blank line as the title)

## Body (optional)

- Wrap body text at 72 characters
- Explain **what** changed and **why** — not **how** (the diff already shows how)
- If multiple distinct changes are in the commit, list them as a bulleted list:
  - Use `-` (hyphen) as the bullet marker
  - Capitalize the first word of each bullet
  - Each bullet is a high-level summary of one logical change, not a line-by-line narration of the diff
  - Do not list things that are obvious from reading `git diff` — focus on intent, rationale, and non-obvious side effects

### Example

```
feat(auth): add OAuth2 login flow

- Introduce OAuth2 provider abstraction for Google and GitHub
- Add token refresh logic with sliding expiration
- Redirect to original URL after successful login

The previous session-based auth did not support third-party
identity providers, which blocked SSO adoption for enterprise
users.
```

## Footers (optional)

- Place one blank line after the body
- Use `Token: value` format (git trailer convention), e.g. `Refs: #123`, `Reviewed-by: Z`
- `BREAKING CHANGE: <description>` for breaking changes (uppercase, required if `!` not used in subject)

## Anti-patterns to avoid

- Subject longer than 72 characters
- Subject in past tense or descriptive mood ("Fixed bug", "Adding feature")
- Subject ending with a period
- Body that restates the diff line-by-line
- Granular bullet lists of trivial changes (e.g. "Update import", "Rename variable")
- Missing blank line between subject and body
- Commit mixing unrelated changes (split into multiple commits instead)
