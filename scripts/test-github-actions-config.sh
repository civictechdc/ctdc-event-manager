#!/bin/bash

# GitHub Actions Configuration Validation Script
# Tests workflow files without running them

set -e

echo "⚡ GitHub Actions Configuration Validation"
echo "=========================================="
echo ""

# Check if workflow files exist
echo "✓ Checking workflow files..."

files=(
	".github/workflows/test.yml"
	".github/workflows/create-event.yml"
	".github/workflows/release.yml"
	".github/workflows/README.md"
)

for file in "${files[@]}"; do
	if [ -f "$file" ]; then
		echo "  ✓ $file exists"
	else
		echo "  ✗ $file missing"
		exit 1
	fi
done

echo ""
echo "✓ Validating test.yml workflow..."

# Check test.yml structure
if grep -q "name: Test" .github/workflows/test.yml; then
	echo "  ✓ Test workflow has name"
else
	echo "  ✗ Test workflow missing name"
	exit 1
fi

if grep -q "on:" .github/workflows/test.yml; then
	echo "  ✓ Test workflow has triggers"
else
	echo "  ✗ Test workflow missing triggers"
	exit 1
fi

if grep -q "push:" .github/workflows/test.yml && grep -q "pull_request:" .github/workflows/test.yml; then
	echo "  ✓ Test workflow responds to push and PR"
else
	echo "  ✗ Test workflow missing push/PR triggers"
	exit 1
fi

if grep -q "bun install" .github/workflows/test.yml; then
	echo "  ✓ Uses Bun for installation"
else
	echo "  ✗ Should use Bun"
	exit 1
fi

if grep -q "codecov" .github/workflows/test.yml; then
	echo "  ✓ Codecov integration configured"
else
	echo "  ✗ Missing Codecov integration"
	exit 1
fi

echo ""
echo "✓ Validating create-event.yml workflow..."

# Check create-event.yml structure
if grep -q "name: Create Event" .github/workflows/create-event.yml; then
	echo "  ✓ Create Event workflow has name"
else
	echo "  ✗ Create Event workflow missing name"
	exit 1
fi

if grep -q "workflow_dispatch:" .github/workflows/create-event.yml; then
	echo "  ✓ Manual trigger configured"
else
	echo "  ✗ Missing manual trigger"
	exit 1
fi

if grep -q "inputs:" .github/workflows/create-event.yml; then
	echo "  ✓ Workflow has inputs"
else
	echo "  ✗ Missing workflow inputs"
	exit 1
fi

if grep -q "template:" .github/workflows/create-event.yml; then
	echo "  ✓ Template input defined"
else
	echo "  ✗ Missing template input"
	exit 1
fi

if grep -q "date:" .github/workflows/create-event.yml; then
	echo "  ✓ Date input defined"
else
	echo "  ✗ Missing date input"
	exit 1
fi

if grep -q "dry_run:" .github/workflows/create-event.yml; then
	echo "  ✓ Dry run option defined"
else
	echo "  ✗ Missing dry run option"
	exit 1
fi

if grep -q "secrets.LUMA_API_KEY" .github/workflows/create-event.yml; then
	echo "  ✓ Luma API key secret referenced"
else
	echo "  ✗ Missing Luma API key secret"
	exit 1
fi

if grep -q "secrets.MEETUP_ACCESS_TOKEN" .github/workflows/create-event.yml; then
	echo "  ✓ Meetup access token secret referenced"
else
	echo "  ✗ Missing Meetup access token secret"
	exit 1
fi

echo ""
echo "✓ Validating release.yml workflow..."

# Check release.yml structure
if grep -q "name: Release" .github/workflows/release.yml; then
	echo "  ✓ Release workflow has name"
else
	echo "  ✗ Release workflow missing name"
	exit 1
fi

if grep -q "release:" .github/workflows/release.yml && grep -q "published" .github/workflows/release.yml; then
	echo "  ✓ Release trigger configured"
else
	echo "  ✗ Missing release trigger"
	exit 1
fi

if grep -q "ghcr.io" .github/workflows/release.yml; then
	echo "  ✓ GitHub Container Registry configured"
else
	echo "  ✗ Missing container registry"
	exit 1
fi

echo ""
echo "✓ Checking YAML syntax..."

# Check YAML syntax with Python (available on most systems)
if command -v python3 &>/dev/null; then
	if python3 -c "import yaml" 2>/dev/null; then
		for file in .github/workflows/*.yml; do
			if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
				echo "  ✓ $file has valid YAML syntax"
			else
				echo "  ✗ $file has invalid YAML syntax"
				exit 1
			fi
		done
	else
		echo "  ⚠ Python yaml module not available, skipping YAML syntax check"
		echo "  ℹ️ Install with: pip3 install pyyaml"
	fi
else
	echo "  ⚠ Python not available, skipping YAML syntax check"
fi

echo ""
echo "✓ Checking documentation..."

# Check README exists and has content
if [ -f ".github/workflows/README.md" ]; then
	lines=$(wc -l <.github/workflows/README.md | tr -d ' ')
	if [ "$lines" -gt 100 ]; then
		echo "  ✓ Comprehensive documentation provided ($lines lines)"
	else
		echo "  ⚠ Documentation could be more comprehensive ($lines lines)"
	fi
else
	echo "  ✗ Missing documentation"
	exit 1
fi

echo ""
echo "✅ All GitHub Actions configuration files are valid!"
echo ""
echo "📝 Next steps:"
echo "  1. Set up GitHub secrets:"
echo "     - LUMA_API_KEY"
echo "     - MEETUP_ACCESS_TOKEN"
echo "     - MEETUP_GROUP_URLNAME"
echo "  2. Push changes to trigger test workflow"
echo "  3. Try manual event creation via Actions tab"
echo "  4. Read: .github/workflows/README.md for detailed usage"
echo ""
echo "🔐 Required secrets can be configured at:"
echo "   Settings > Secrets and variables > Actions > New repository secret"
echo ""
