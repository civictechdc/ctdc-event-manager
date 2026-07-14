import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { ReadAgentsPlugin } from "../../../.opencode/plugins/read-agents"

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })))
})

test("adds project rules to the hidden system prompt without terminal notifications", async () => {
  const directory = await mkdtemp(join(tmpdir(), "read-agents-"))
  directories.push(directory)
  await writeFile(join(directory, "AGENTS.md"), "Global project rules")
  await writeFile(join(directory, "AGENTS.local.md"), "Local project rules")

  const client = {
    session: { prompt: vi.fn() },
    tui: { showToast: vi.fn() },
    app: { log: vi.fn() },
  }
  const hooks = await ReadAgentsPlugin({ client, directory } as never)
  const sessionId = "session-1"

  await hooks.event?.({
    event: { type: "session.created", properties: { info: { id: sessionId, directory } } },
  } as never)

  expect(hooks["experimental.chat.system.transform"]).toBeTypeOf("function")

  const output = { system: [] as string[] }
  await hooks["experimental.chat.system.transform"]?.({ sessionID: sessionId } as never, output)

  expect(output.system).toEqual([
    "[Session Start Hook] AGENTS.md — read and follow these instructions:\n\nGlobal project rules",
    "[Session Start Hook] AGENTS.local.md — read and follow these local project preferences:\n\nLocal project rules",
  ])
  expect(client.session.prompt).not.toHaveBeenCalled()
  expect(client.tui.showToast).not.toHaveBeenCalled()
})
