import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

export const ReadAgentsPlugin = async ({ client, directory }) => {
  const rulesBySession = new Map<string, string[]>()

  return {
    event: async ({ event }) => {
      if (event.type !== "session.created") return

      const info = event.properties?.info
      if (!info?.id) return

      const sessionId = info.id
      const dir = info.directory || directory
      const rules: string[] = []

      const agentsPath = join(dir, "AGENTS.md")
      if (existsSync(agentsPath)) {
        try {
          const content = readFileSync(agentsPath, "utf-8")
          rules.push(`[Session Start Hook] AGENTS.md — read and follow these instructions:\n\n${content}`)
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
          rules.push(`[Session Start Hook] AGENTS.local.md — read and follow these local project preferences:\n\n${content}`)
        } catch {}
      }

      if (rules.length === 0) return

      try {
        rulesBySession.set(sessionId, rules)
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
    "experimental.chat.system.transform": async ({ sessionID }, output) => {
      if (!sessionID) return
      output.system.push(...(rulesBySession.get(sessionID) ?? []))
    },
  }
}
