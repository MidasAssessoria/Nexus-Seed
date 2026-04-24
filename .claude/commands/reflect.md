---
description: Closes the session — pending items, reflection, and persistence before /clear
when_to_use: when the user mentions /clear, ending the session, closing, wrapping up for today
allowed-tools: Read, Edit, Write, Bash
---

Run the end-of-session check-in.

**Step 1 — Session decisions (Memory Gate)**

Read `.claude/memory/decisions.md` (create empty if it doesn't exist).
List any important decisions made in the session not yet registered.
For each new decision:

> "Proposing to register: `[exact decision]`. Confirm, adjust, or discard?"

Write **exactly** what the user confirms — no paraphrase. One at a time.

**Step 2 — Reflection**

Ask: "Is there anything you'd do differently? Anything that worked well? Any learning from this session?"
Structure in three parts:
- **Regret** — what you wouldn't repeat
- **Gratitude** — what worked and is worth keeping
- **Evolve** — what changes in the next session

**Step 3 — Confirm before saving**

Present summary: what will be written to each file.
Wait for confirmation before writing.

**Step 4 — Write memory**

Update `.claude/memory/diary.md` (create if it doesn't exist):
- Header: `## Session — YYYY-MM-DD (short description)`
- What was done (facts: files created/edited, skills invoked, decisions)
- Reflection (Regret / Gratitude / Evolve) — from Step 2
- Next session: open items, clear next step

If there were decisions confirmed in Step 1, also update `.claude/memory/decisions.md`:
- Header: `## YYYY-MM-DD` (if section for the day doesn't exist)
- One decision per bullet, exact text confirmed by the user

**Rules:**

- Do not invent decisions. Purely exploratory session → don't register anything in decisions.md.
- If the user doesn't want to check-in: respect it, don't insist.
- diary.md records facts and reflection — decisions.md only receives via Gate (Step 1).
- The "Evolve" reflection is read at the start of the next session.
- When a pattern repeats 3+ sessions, propose to the user turning it into a skill. If the `skill-creator` skill is available (plugin `anthropic-skills` installed), use it. Otherwise, note the pattern in a `## Candidate skill patterns` block in `diary.md` to revisit when the plugin is available.
