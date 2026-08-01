# Method AI-DLC — Lite Profile (Claude Code)

Claude Code is the default assistant for this profile. The full, tool-agnostic profile
lives in `AGENTS.md` and is imported below — follow it exactly. Its **Claude Code
(default)** column names the specific skills and agents to use (`/spec`, `/plan`,
`/build`, `/test`, `/code-review`, `/verify`, `Plan`, `Explore`, `general-purpose`).

This file is a thin adapter so Claude Code auto-loads the profile; the single source of
truth is `AGENTS.md`. Other assistants (Codex, Cursor, Gemini CLI, Copilot) read
`AGENTS.md` directly.

@AGENTS.md
