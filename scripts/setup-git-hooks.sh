#!/bin/sh
set -eu

# Install Git 2.54+ config-native quality hooks for this repository.
# The pre-commit hook runs linting then type checking.

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

if ! command -v bun >/dev/null 2>&1; then
    printf 'Error: bun is required but was not found in PATH.\n' >&2
    exit 1
fi
BUN_PATH="$(command -v bun)"

REQUIRED_GIT_MAJOR=2
REQUIRED_GIT_MINOR=54
GIT_VERSION="$(git --version)"
GIT_VERSION="${GIT_VERSION#git version }"
GIT_VERSION="${GIT_VERSION%% *}"
GIT_MAJOR="${GIT_VERSION%%.*}"
GIT_MINOR="${GIT_VERSION#*.}"
GIT_MINOR="${GIT_MINOR%%.*}"

case "$GIT_VERSION" in
    *.*) ;;
    *)
        printf 'Error: unsupported Git version format: %s\n' "$GIT_VERSION" >&2
        exit 1
        ;;
esac
case "$GIT_MAJOR:$GIT_MINOR" in
    *[!0-9:]*|:*|*:)
        printf 'Error: unsupported Git version format: %s\n' "$GIT_VERSION" >&2
        exit 1
        ;;
esac

if [ "$GIT_MAJOR" -lt "$REQUIRED_GIT_MAJOR" ] || { [ "$GIT_MAJOR" -eq "$REQUIRED_GIT_MAJOR" ] && [ "$GIT_MINOR" -lt "$REQUIRED_GIT_MINOR" ]; }; then
    printf 'Error: Git %s.%s or later is required (found %s).\n' "$REQUIRED_GIT_MAJOR" "$REQUIRED_GIT_MINOR" "$GIT_VERSION" >&2
    exit 1
fi

# Escape command paths so they are safe inside single-quoted shell words.
ESCAPED_ROOT=$(printf '%s' "$REPO_ROOT" | awk '{gsub(/\047/, "\047\\\047\047"); print}')
ESCAPED_BUN=$(printf '%s' "$BUN_PATH" | awk '{gsub(/\047/, "\047\\\047\047"); print}')

HOOK_NAME="quality"
HOOK_COMMAND="cd -- '${ESCAPED_ROOT}' && '${ESCAPED_BUN}' run lint && '${ESCAPED_BUN}' run typecheck"

# Ensure idempotency by clearing any prior event values.
git config --local --unset-all "hook.${HOOK_NAME}.event" >/dev/null 2>&1 || true
git config --local --add "hook.${HOOK_NAME}.event" pre-commit
git config --local "hook.${HOOK_NAME}.command" "$HOOK_COMMAND"
