<div align="center">

# 🦞 Nexus-Seed

**Template for creating [Claude Code](https://claude.com/claude-code) agents that learn as you direct them.**

No fixed domain. Persistent memory. Structured reflection at the end of each session.

[![Claude Code](https://img.shields.io/badge/built%20for-Claude%20Code-D97757?style=flat-square)](https://claude.com/claude-code)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Status: seed](https://img.shields.io/badge/status-seed-yellow?style=flat-square)](#)

</div>

---

## What it is

**Nexus-Seed** is a project skeleton for Claude Code. Instead of starting from scratch each conversation, you clone this repository and get an agent with four built-in capabilities:

- **Persistent memory** — confirmed decisions and session diaries in versioned files.
- **Structured reflection** — every session end generates a *Regret / Gratitude / Evolve* block that feeds the next one.
- **Seed file protection** — a hook blocks accidental `rm` on `CLAUDE.md` and the `.claude/` folder.
- **Automatic backup** — every edit to `.claude/memory/*.md` creates a timestamped copy in `.backup/`.

The agent **has no predefined role**. You name it, describe its function, and tell it how you want to be addressed in the first session — all of that becomes law in `decisions.md`.

---

## Philosophy

> Most agents start each conversation from zero. This one picks up where the last one left off — without writing new code, just reading files.

Three principles that run through the design:

1. **Memory is append-only and goes through a Gate.** Nothing enters `decisions.md` without the user's exact confirmation. Zero paraphrase, zero invention.
2. **Reflection is a ritual, not optional.** `/reflect` at the end of the session forces three questions: what not to repeat, what to keep, what to change.
3. **Seed files are sacred.** A hook prevents accidental deletion of the agent's contracts.

---

## Quick start

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | recent | agent runtime |
| [Node.js](https://nodejs.org/) | ≥ 18 | runs the hooks (`guard-rm.js`, `backup-memory.js`) |
| [Git](https://git-scm.com/) | any | version-control the memory |

### Installation

```bash
# 1. Clone into a local directory with any name you like
git clone https://github.com/MidasAssessoria/Nexus-Seed.git "🦞 - SEED"
cd "🦞 - SEED"

# 2. Open Claude Code IN THIS directory
claude-code
```

> **Important:** Claude Code must be opened with this directory as the working directory. If opened elsewhere, hooks still protect (path is derived from the absolute `file_path`, not `cwd`), but slash commands and relative reads of `.claude/memory/` may fail.

### First session

1. Claude reads `.claude/memory/diary.md` and `decisions.md` — both are empty scaffolds, so it detects **real first session**.
2. Asks three things:
   - Agent name
   - Its initial role
   - How you prefer to be addressed
3. You converse/work normally.
4. At the end, say `/reflect`:
   - Agent proposes registering decisions one by one, with your exact text
   - Asks for reflection (Regret / Gratitude / Evolve)
   - Shows a summary of what it will write
   - Only persists after you confirm
5. `/clear` clears the context and the next session already knows who you and it are.

---

## Structure

```
🦞 - SEED/
├── CLAUDE.md                     # Agent contract, read every session
├── README.md                     # You are here
├── LICENSE
├── .gitignore
└── .claude/
    ├── settings.json             # Registers the hooks
    ├── memory/
    │   ├── decisions.md          # Decisions via Gate — append-only
    │   └── diary.md              # Sessions: facts + reflection + next step
    ├── commands/
    │   └── reflect.md            # /reflect: end-of-session ritual
    ├── hooks/
    │   ├── guard-rm.js           # PreToolUse/Bash: blocks rm on seed files
    │   └── backup-memory.js      # PostToolUse/Edit|Write: backup of memory/*.md
    └── skills/
        └── round-table/          # Local skill: council of 3 (or 4) specialists
```

---

## How it works

### Hooks

Registered in [.claude/settings.json](.claude/settings.json):

| Hook | Trigger | Action | File |
|---|---|---|---|
| **Protection** | `PreToolUse` on `Bash` | Blocks `rm`/`del`/`rmdir`/`Remove-Item` targeting seed files. Returns `[S8]` to Claude. | [.claude/hooks/guard-rm.js](.claude/hooks/guard-rm.js) |
| **Backup** | `PostToolUse` on `Edit\|Write` | If the file is in `.claude/memory/*.md`, copies it to `.backup/<name>-<timestamp>.md`. | [.claude/hooks/backup-memory.js](.claude/hooks/backup-memory.js) |

Both derive the project root from the absolute `file_path` passed by Claude Code — not from `process.cwd()`. This means backup and protection work even if Claude Code was opened outside the project root. Backup errors go silently to `.backup/_hook-errors.log`.

### Memory

Two files with distinct responsibilities:

#### `.claude/memory/decisions.md`
Confirmed, canonical, immutable decisions. **Gate required:** enters only via `/reflect`, with the exact text the user confirms. If a dated entry exists, it is law — the agent does not reinvent it.

#### `.claude/memory/diary.md`
Append-only session log. Each entry has:

```markdown
## Session — YYYY-MM-DD (short description)

**Facts**
- files created/edited, skills invoked, decisions made

**Reflection**
- Regret: what you wouldn't repeat
- Gratitude: what worked and is worth keeping
- Evolve: what changes in the next session

**Next session**
- open items
- clear next step
```

The **Evolve** block from the last session is extracted and applied at the start of the next one. If it says *"use more bullets"*, the following session uses bullets by default. This way the agent drifts over time in the direction you want.

**Claude Code native auto-memory** (typed facts: `user` / `project` / `feedback` / `reference`) operates in parallel — but for canonical project contracts, `decisions.md` is the source of truth.

### `/reflect` — end-of-session ritual

Slash command defined in [.claude/commands/reflect.md](.claude/commands/reflect.md). Four steps:

1. **Decisions (Gate).** Agent lists decisions from the session not yet registered. For each: *"Proposing to register: `[exact text]`. Confirm, adjust, or discard?"*
2. **Reflection.** Three questions: what not to repeat, what to keep, what to change.
3. **Summary.** Agent shows exactly what it will write to each file and waits for confirmation.
4. **Write.** Updates `diary.md` always. Updates `decisions.md` only if there were confirmed decisions.

**Rule:** a purely exploratory session generates no entry in `decisions.md`.

### Skills

#### Always-available local skill

| Skill | Trigger | Function |
|---|---|---|
| [`round-table`](.claude/skills/round-table/SKILL.md) | *"summon the round table"* (+ `doom` for irreversible) | Convenes a council of 3 or 4 internal specialists for stuck decisions, multiple defensible paths, or explicit uncertainty |

#### External skills (optional)

If the corresponding plugin is installed, the agent invokes them at the right moments. If not, it notes the pattern in `diary.md` to revisit.

| Skill | Plugin | When |
|---|---|---|
| `brainstorming` | `superpowers` | Before any creative work |
| `writing-plans` | `superpowers` | Multi-step task that deserves a formal plan |
| `test-driven-development` | `superpowers` | Before writing code |
| `systematic-debugging` | `superpowers` | Before proposing a bug fix |
| `consolidate-memory` | `anthropic-skills` | When `diary.md` / `decisions.md` have grown large |
| `skill-creator` | `anthropic-skills` | When a routine pattern has repeated 3+ times |

---

## Customizing

After the first session, apply the **naming checklist**:

1. In [CLAUDE.md](CLAUDE.md:1), replace `[name to be defined]` with the chosen name.
2. (Optional) Rename the local directory from `🦞 - SEED` to `🦞 - <name>` (requires closing and reopening Claude Code).
3. Register the canonical triple (`name`, `initial role`, `form of address`) in `decisions.md` via `/reflect`.

Then evolve as you like:

- **New local skills** in `.claude/skills/<name>/SKILL.md`
- **New slash commands** in `.claude/commands/<name>.md`
- **New hooks** in `.claude/hooks/<name>.js`, registered in `.claude/settings.json`

---

## Roadmap

- [ ] Real first session: agent naming
- [ ] Identity and scope consolidation in `decisions.md`
- [ ] Growing local skill bank as patterns emerge
- [ ] (Future) Template script: `npx create-nexus-seed <name>`

---

## License

[MIT](LICENSE) © [Midas Assessoria](https://github.com/MidasAssessoria)

---

<div align="center">
<sub>The repository name is <code>Nexus-Seed</code>, the template. The agent lives in the <code>🦞 - SEED</code> directory until named — then becomes <code>🦞 - &lt;name&gt;</code>.</sub>
</div>
