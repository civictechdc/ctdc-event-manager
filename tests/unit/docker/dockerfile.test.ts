import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const dockerfilePath = path.resolve(__dirname, '../../../docker/Dockerfile');

function extractBuilderStage(dockerfile: string): string {
  const match = dockerfile.match(
    /FROM node:24\.18\.0-alpine AS builder([\s\S]*?)(?:\nFROM |$)/
  );
  expect(match, 'builder stage is defined').toBeTruthy();
  return match![1];
}

function findRunCommands(stage: string): string[] {
  const commands: string[] = [];
  const lines = stage.split('\n');
  let current: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.endsWith('\\')) {
      current.push(line.slice(0, -1).trimEnd());
      continue;
    }
    if (current.length > 0) {
      current.push(line);
      commands.push(current.join(' '));
      current = [];
    } else if (line.startsWith('RUN ')) {
      commands.push(line);
    }
  }

  return commands;
}

describe('Dockerfile builder stage', () => {
  const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
  const builderStage = extractBuilderStage(dockerfile);

  it('installs all dependencies (including TypeScript) before building', () => {
    const buildIndex = builderStage.indexOf('RUN bun run build');
    expect(buildIndex, 'builder stage runs bun run build').toBeGreaterThan(0);

    const preBuild = builderStage.slice(0, buildIndex);
    const installCommands = findRunCommands(preBuild).filter((cmd) =>
      cmd.includes('bun install')
    );

    expect(installCommands.length, 'builder stage runs bun install before build').toBeGreaterThan(0);

    for (const command of installCommands) {
      expect(command).not.toContain('--production');
    }
  });
});
