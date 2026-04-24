---
name: round-table
description: Convenes a council of 3 specialists (or 4 with +doom) with distinct perspectives to attack a problem from multiple angles, via isolated Task subagents. Activate when the user says "summon the round table", "gather the council", "open the round table", "convene the table", or a variation with "+doom". Do NOT auto-summon — suggest use via a 1-line nudge when detecting a stuck problem, multiple defensible paths, or explicit uncertainty.
allowed-tools: Task
---

# Round Table

Multi-perspective council for decisions where Claude's monolithic response tends to fail. 6 common LLM errors attacked with structural discipline (M1–M8), not with "better prompts".

## When to activate

User invokes explicitly. Trigger phrases (case-insensitive):
- "summon the round table"
- "gather the council"
- "open the round table"
- "convene the table"
- "round table: [problem]"

**`+doom` modifier:** if the word `doom` appears alongside the trigger phrase (e.g., `summon the round table + doom` or `summon the round table for this problem, with doom`), adds a 4th universal parallel specialist (Doom Speaker). Use for irreversible/critical decisions.

## Flow (7 steps)

1. **Problem Brief (M5).** Write 4 lines BEFORE spawning any Task:
   - OBJECTIVE: what you want to decide/resolve (1 sentence)
   - CONSTRAINTS: technical, time, and scope limits
   - EVIDENCE: known facts (with `file:line` or quotation when applicable)
   - SUCCESS: how to know the decision was right

2. **Gate M7 — worth summoning?** Does the problem pass ≥2 of 3 criteria?
   - Irreversible or costly to undo
   - Multiple defensible paths (no single obvious one)
   - Cost-of-error > cost-of-Round-Table (~20k tokens)

   If it does NOT pass 2/3, **don't spawn**. Inform the user: "This problem seems solvable with a direct answer (gate M7: passes X/3). Do you still want to summon?" and wait for explicit confirmation.

3. **Classify type.** Map the problem to ONE of 5 types: Technical / Debug / Business / Plan Validation / Creative-open. Use table below. If ambiguous, ask the user before spawning.

4. **Fire parallels (M1 — cold start).** Load `references/problem-types.md`, extract the prompts for the 2 roles of the trio (+ Doom Speaker if `+doom`). Use `model:` per the table.

   **Parallel mechanics:** fire 2-3 `Task` calls in **ONE SINGLE assistant response** (multiple `tool_use` blocks in the same message) — the runtime parallelizes automatically and all return together as `tool_result` blocks before the next assistant turn. Each Task receives ONLY the brief — never the others' output.

   **DO NOT use `run_in_background: true`** here — that flag is for fire-and-forget (poll + notify later). We want foreground + native parallel, to collect all outputs before the Synthesizer.

5. **Fire Synthesizer.** In the **next assistant turn** (with parallels' outputs already in context), invoke 1 sequential Task (`model: opus`, foreground) passing brief + literal outputs of the parallels. Full prompt in `references/problem-types.md` (section 7).

6. **Verdict in rigid format (M6 + M8).** The Synthesizer returns in the 6 mandatory sections (see Output Format). If a section is missing, re-invoke 1× with feedback. If it fails 2×, report partial.

7. **Present to user.** Behind-the-scenes in a collapsed `<details>`, verdict highlighted.

## Types × Trios × Models

| Type | A (parallel) | B (parallel) | Synthesizer (lens) |
|---|---|---|---|
| **Technical** | Proponent (Sonnet) | Skeptic (Sonnet) | Opus + First-principles |
| **Debug** | Observer (Haiku) | Alt-Hypothesis (Sonnet) | Opus + 5-Whys causal |
| **Business** | Optimist (Sonnet) | Pessimist (Sonnet) | Opus + Second-order |
| **Validation** | Pre-mortem (Sonnet) | Red Team (Sonnet) | Opus + Hostile stakeholder |
| **Creative** | Reframer (Sonnet) | Inverter (Sonnet) | Opus + First-principles |

**With `+doom`:** adds a 3rd universal parallel = Doom Speaker (Sonnet), regardless of type.

**Full prompts for each role in `references/problem-types.md`.** Load on demand (lazy load), NOT by default — only when building the `Task` calls.

## M1–M8 — Inviolable principles

1. **M1 Cold start.** Parallels NEVER see each other's output. Fire 2-3 `Task` calls in a single assistant response (multiple `tool_use` blocks) — runtime parallelizes, all return before the next turn. Foreground, not `run_in_background`.
2. **M2 Evidence mandate.** Every claim in specialist output cites a source (`file:line`, stdout, PRD). No citation → Synthesizer marks `[unverified hypothesis]`.
3. **M3 Mandatory dissent.** Skeptic / Pessimist / Red Team / Inverter / Alt-Hypothesis CANNOT agree. Output "looks good, no objections" = invalid → re-invoke 1× with feedback: "Find at least 1 genuine flaw."
4. **M4 Frame by type.** Roles selected via table above, not improvised.
5. **M5 Problem Brief required.** 4 lines before any Task.
6. **M6 Dissent preserved.** Synthesizer delivers format with DISSENT section. Never dissolves disagreement.
7. **M7 Activation gate.** Implemented as explicit step 2 of the flow — not a mental check, it's a mandatory stage. Problem must pass ≥2 of 3 (irreversible / multiple defensible paths / cost-of-error > ~20k tokens) OR have explicit user confirmation.
8. **M8 Risk section.** Synthesizer ALWAYS includes "Risks & Failure Modes" (3 items minimum), even without Doom Speaker.

## Output Format

Present to the user EXACTLY in this format:

~~~markdown
## 🏛️ Round Table summoned — [Problem type]

> **Maestro's Brief:** [4 lines of the problem brief]

<details>
<summary>📜 Behind the deliberation (click to expand)</summary>

### Specialist A — [Role name]
[full output of Task A]

### Specialist B — [Role name]
[full output of Task B]

### Specialist C — Doom Speaker  *(only if +doom was used)*
[full output of Task C]

</details>

## ⚖️ Verdict

**🎯 Decision:** [clear sentence — choose ONE]

**🧠 Reasons:**
- [reason 1 with cited evidence]
- [reason 2]
- [reason 3]

**🔀 Dissent preserved:** [what one of the specialists defended against the decision and WHY that position has merit — do NOT dissolve it]

**🚫 Non-negotiables:** [what is NOT acceptable, even within the chosen decision]

**⚠️ Risks & Failure Modes:**
1. [most likely risk] — trigger: [when it appears]
2. [risk #2]
3. [risk #3]

**➡️ Next step:** [one concrete action, 1 sentence]
~~~

Rules:
- Behind-the-scenes **always collapsed** by default (`<details>`).
- Verdict **always highlighted**, never inside `<details>`.
- Section emojis are fixed (visual consistency across invocations).

## Nudge — when to suggest use (do NOT auto-summon)

Add **1 line at the end of your normal response** if you detect any of the 3 triggers. Do NOT call the skill on your own — only suggest.

**Trigger A (M7 structural).** Decision passes ≥2 of 3:
1. Irreversible or costly to undo
2. Multiple defensible paths (no single obvious one)
3. Cost-of-error > cost-of-Round-Table (~20k tokens)

**Trigger B (stuck detection):**
- 3rd response about the same bug after 2 proposed fixes that didn't work, OR
- 2nd contradictory architectural proposal in sequence, OR
- Self-correction 2× or more in the same turn.

**Trigger C (explicit user uncertainty):**
- User said "I don't know", "I'm stuck", "blocked", "unsure", "not sure", "help me decide".

**Fixed format (one line only, even with multiple triggers):**
> `💡 Multiple perspectives might help here — say "summon the round table" if you want.`

Max 1 nudge per user turn. Don't repeat nudge in the same conversation.

## Fallback (Claude Code < 2.1)

If `Task` doesn't accept the `model:` param, fire without routing — all inherit the parent model. Loses economy (~65%) but the methodology keeps working.

## Reference

Full prompts for each role (Proponent, Skeptic, Observer, Alt-Hypothesis, Optimist, Pessimist, Pre-mortem, Red Team, Reframer, Inverter, Doom Speaker, Synthesizer) in `references/problem-types.md`. Load only when building the `Task` calls.
