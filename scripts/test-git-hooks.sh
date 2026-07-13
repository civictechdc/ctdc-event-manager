#!/bin/sh
set -eu

# Integration test for scripts/setup-git-hooks.sh.
# Creates isolated temporary Git repositories, installs the hook
# configuration, and verifies the configured hook is present and
# executable even when the repository path contains spaces.

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SETUP_SRC="$REPO_ROOT/scripts/setup-git-hooks.sh"

git_version="$(git --version | awk '{print $3}')"
git_major="${git_version%%.*}"
git_minor="${git_version#*.}"
git_minor="${git_minor%%.*}"
if [ "$git_major" -lt 2 ] || { [ "$git_major" -eq 2 ] && [ "$git_minor" -lt 54 ]; }; then
    printf 'SKIP: Git 2.54 or later is required for config-native hook tests.\n'
    exit 0
fi

if [ ! -f "$SETUP_SRC" ]; then
    printf 'FAIL: setup script not found: %s\n' "$SETUP_SRC" >&2
    exit 1
fi

fail() {
    printf 'FAIL: %s\n' "$1" >&2
    exit 1
}

REQUIRED_GIT_MAJOR=2
REQUIRED_GIT_MINOR=54
GIT_VERSION_ACTUAL="$(git --version)"
GIT_VERSION_ACTUAL="${GIT_VERSION_ACTUAL#git version }"
GIT_VERSION_ACTUAL="${GIT_VERSION_ACTUAL%% *}"
GIT_MAJOR_ACTUAL="${GIT_VERSION_ACTUAL%%.*}"
GIT_MINOR_ACTUAL="${GIT_VERSION_ACTUAL#*.}"
GIT_MINOR_ACTUAL="${GIT_MINOR_ACTUAL%%.*}"

if [ "$GIT_MAJOR_ACTUAL" -lt "$REQUIRED_GIT_MAJOR" ] || { [ "$GIT_MAJOR_ACTUAL" -eq "$REQUIRED_GIT_MAJOR" ] && [ "$GIT_MINOR_ACTUAL" -lt "$REQUIRED_GIT_MINOR" ]; }; then
    printf 'SKIP: Git %s.%s or later required for integration test (found %s).\n' "$REQUIRED_GIT_MAJOR" "$REQUIRED_GIT_MINOR" "$GIT_VERSION_ACTUAL" >&2
    exit 0
fi

remove_from_path() {
    target="$1"
    result=""
    IFS=:
    for dir in $PATH; do
        [ "$dir" = "$target" ] && continue
        [ -z "$result" ] && result="$dir" || result="$result:$dir"
    done
    printf '%s' "$result"
}

run_basic_test() (
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "$TMP_DIR"' EXIT

    mkdir -p "$TMP_DIR/scripts"
    cp "$SETUP_SRC" "$TMP_DIR/scripts/setup-git-hooks.sh"

    cd "$TMP_DIR"
    git init -q
    git config user.email "test@example.com"
    git config user.name "Test User"

    sh scripts/setup-git-hooks.sh

    if ! git hook list pre-commit 2>/dev/null | grep -q '^[[:space:]]*quality[[:space:]]*$'; then
        fail 'quality hook not listed for pre-commit'
    fi

    command_value="$(git config --local hook.quality.command)"
    case "$command_value" in
        *'run lint && '*'run typecheck'*) ;;
        *)
            fail "hook.quality.command missing expected command: $command_value"
            ;;
    esac

    printf 'PASS: basic installation\n'
)

run_path_with_spaces_test() (
    WORK_DIR="$(mktemp -d)"
    trap 'rm -rf "$WORK_DIR"' EXIT

    REPO_DIR="$WORK_DIR/repo with spaces"
    mkdir -p "$REPO_DIR/scripts" "$REPO_DIR/bin"

    cp "$SETUP_SRC" "$REPO_DIR/scripts/setup-git-hooks.sh"

    cat > "$REPO_DIR/bin/bun" <<'BUN'
#!/bin/sh
case "$1 $2" in
    'run lint')
        echo 'LINT_OK'
        ;;
    'run typecheck')
        echo 'TYPECHECK_OK'
        ;;
    *)
        echo "BUN_UNEXPECTED: $*" >&2
        exit 1
        ;;
esac
BUN
    chmod +x "$REPO_DIR/bin/bun"

    cd "$REPO_DIR"
    git init -q
    git config user.email "test@example.com"
    git config user.name "Test User"

    export PATH="$REPO_DIR/bin:$PATH"
    sh scripts/setup-git-hooks.sh

    command_value="$(git config --local hook.quality.command)"
    case "$command_value" in
        *'run lint && '*'run typecheck'*) ;;
        *)
            fail "path-with-spaces command missing expected: $command_value"
            ;;
    esac

    output="$(PATH='/usr/bin:/bin' /bin/sh -c "$command_value" 2>&1)" || fail "configured command failed without Bun on PATH: $output"
    case "$output" in
        *LINT_OK*) ;;
        *) fail "lint was not executed: $output" ;;
    esac
    case "$output" in
        *TYPECHECK_OK*) ;;
        *) fail "typecheck was not executed: $output" ;;
    esac

    lint_pos="${output%%LINT_OK*}"
    typecheck_pos="${output%%TYPECHECK_OK*}"
    [ "${#lint_pos}" -lt "${#typecheck_pos}" ] || fail "typecheck ran before lint"

    printf 'PASS: path with spaces\n'
)

run_git_version_gate_test() (
    WORK_DIR="$(mktemp -d)"
    trap 'rm -rf "$WORK_DIR"' EXIT

    REPO_DIR="$WORK_DIR/repo"
    mkdir -p "$REPO_DIR/scripts" "$REPO_DIR/bin"

    cp "$SETUP_SRC" "$REPO_DIR/scripts/setup-git-hooks.sh"

    real_bun="$(command -v bun)"
    real_git="$(command -v git)"

    cat > "$REPO_DIR/bin/bun" <<EOF
#!/bin/sh
exec "$real_bun" "\$@"
EOF
    chmod +x "$REPO_DIR/bin/bun"

    cat > "$REPO_DIR/bin/git" <<EOF
#!/bin/sh
if [ "\$1" = "--version" ]; then
    echo "git version 2.53.0"
    exit 0
fi
exec "$real_git" "\$@"
EOF
    chmod +x "$REPO_DIR/bin/git"

    cd "$REPO_DIR"
    export PATH="$REPO_DIR/bin:$PATH"
    git init -q
    git config user.email "test@example.com"
    git config user.name "Test User"

    stderr_file="$WORK_DIR/stderr.txt"
    if sh scripts/setup-git-hooks.sh 2>"$stderr_file"; then
        fail "installer should reject Git versions below 2.54"
    fi

    if ! grep -q "2.54" "$stderr_file"; then
        fail "installer did not report required Git version: $(cat "$stderr_file")"
    fi

    if git config --local hook.quality.command >/dev/null 2>&1; then
        fail "hook command configured despite unsupported Git version"
    fi

    if git config --local --get-all hook.quality.event >/dev/null 2>&1; then
        fail "hook event configured despite unsupported Git version"
    fi

    printf 'PASS: Git version gate\n'
)

run_basic_test
run_path_with_spaces_test
run_git_version_gate_test

printf 'PASS: all tests\n'
