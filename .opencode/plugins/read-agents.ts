import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

export const ReadAgentsPlugin = async ({ client, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.created") return

      const info = event.properties?.info
      if (!info?.id) return

      const sessionId = info.id
      const dir = info.directory || directory
      const parts: Array<{ type: "text"; text: string }> = []

      const agentsPath = join(dir, "AGENTS.md")
      if (existsSync(agentsPath)) {
        try {
          const content = readFileSync(agentsPath, "utf-8")
          parts.push({
            type: "text",
            text: `[Session Start Hook] AGENTS.md — read and follow these instructions:\n\n${content}`,
          })
        } catch {}
      }

      const localPath = join(dir, "AGENTS.local.md")
      const altLocalPath = join(dir, ".agent", "local", "AGENTS.local.md")
      const resolvedLocalPath = existsSync(localPath)
        ? localPath
        : existsSync(altLocalPath)
          ? altLocalPath
          : null

      if (resolvedLocalPath) {
        try {
          const content = readFileSync(resolvedLocalPath, "utf-8")
          parts.push({
            type: "text",
            text: `[Session Start Hook] AGENTS.local.md — read and follow these local project preferences:\n\n${content}`,
          })
        } catch {}
      }

      if (parts.length === 0) return

      try {
        await client.session.prompt({
          path: { id: sessionId },
          body: {
            noReply: true,
            parts,
          },
        })

        await client.tui.showToast({
          body: {
            message: "AGENTS.md and AGENTS.local.md loaded at session start",
            variant: "info",
          },
        })
      } catch (e) {
        await client.app.log({
          body: {
            service: "read-agents-plugin",
            level: "error",
            message: `Failed to inject context: ${String(e)}`,
          },
        })
      }
    },
  }
}
