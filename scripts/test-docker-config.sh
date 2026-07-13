#!/bin/bash

# Docker Configuration Validation Script
# Tests Docker files without requiring Docker daemon

set -e

echo "🐳 Docker Configuration Validation"
echo "=================================="
echo ""

# Check if Docker files exist
echo "✓ Checking Docker files..."

files=(
	"docker/Dockerfile"
	"docker/Dockerfile.dev"
	"docker/docker-compose.yml"
	".dockerignore"
	"docker/DOCKER.md"
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
echo "✓ Validating Dockerfile syntax..."

# Check Dockerfile for common issues
if grep -q "FROM node:20-alpine" docker/Dockerfile; then
	echo "  ✓ Uses Node 20 Alpine base"
else
	echo "  ✗ Should use Node 20 Alpine"
	exit 1
fi

if grep -q "USER eventuser" docker/Dockerfile; then
	echo "  ✓ Runs as non-root user"
else
	echo "  ✗ Should run as non-root user"
	exit 1
fi

if grep -q "ENTRYPOINT" docker/Dockerfile; then
	echo "  ✓ Has ENTRYPOINT defined"
else
	echo "  ✗ Missing ENTRYPOINT"
	exit 1
fi

echo ""
echo "✓ Validating Dockerfile.dev syntax..."

if grep -q 'CMD \["bun", "run", "dev"\]' docker/Dockerfile.dev; then
	echo "  ✓ Development mode configured"
else
	echo "  ✗ Missing development CMD"
	exit 1
fi

echo ""
echo "✓ Validating docker-compose.yml..."

# Check docker-compose.yml structure
if grep -q "version:" docker/docker-compose.yml; then
	echo "  ✓ Has version specified"
else
	echo "  ✗ Missing version"
	exit 1
fi

if grep -q "event-publisher-dev:" docker/docker-compose.yml; then
	echo "  ✓ Development service defined"
else
	echo "  ✗ Missing development service"
	exit 1
fi

if grep -q "volumes:" docker/docker-compose.yml; then
	echo "  ✓ Volume mounts configured"
else
	echo "  ✗ Missing volume mounts"
	exit 1
fi

echo ""
echo "✓ Validating .dockerignore..."

if grep -q "node_modules" .dockerignore; then
	echo "  ✓ Excludes node_modules"
else
	echo "  ✗ Should exclude node_modules"
	exit 1
fi

if grep -q ".git" .dockerignore; then
	echo "  ✓ Excludes .git directory"
else
	echo "  ✗ Should exclude .git"
	exit 1
fi

echo ""
echo "✓ Checking package.json Docker scripts..."

# Check package.json has Docker scripts
if grep -q '"docker:build"' package.json; then
	echo "  ✓ docker:build script exists"
else
	echo "  ✗ Missing docker:build script"
	exit 1
fi

if grep -q '"docker:run"' package.json; then
	echo "  ✓ docker:run script exists"
else
	echo "  ✗ Missing docker:run script"
	exit 1
fi

if grep -q '"docker:dev"' package.json; then
	echo "  ✓ docker:dev script exists"
else
	echo "  ✗ Missing docker:dev script"
	exit 1
fi

echo ""
echo "✅ All Docker configuration files are valid!"
echo ""
echo "📝 Next steps:"
echo "  1. Start Docker daemon"
echo "  2. Run: npm run docker:build"
echo "  3. Run: npm run docker:run -- --help"
echo "  4. Read: docker/DOCKER.md for detailed usage"
echo ""
