// PreToolUse hook (matcher: Bash): blocks `rm` / `del` / `rmdir` / `Remove-Item`
// targeting protected seed files (CLAUDE.md and critical .claude/ folders).
//
// Stdin receives JSON from Claude Code with { tool_input: { command: "..." } }.
// Stdout returns JSON { continue: boolean, stopReason?: string }.
//
// Extracted from an inline hook in settings.json to avoid escape-hell
// (backtick inside double-quoted shell caused command substitution).

let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(d);
    const cmd = (input.tool_input || {}).command || '';

    const protectedTargets =
      '(CLAUDE\\.md|\\.claude[\\/\\\\]+(memory|commands|skills|hooks|settings\\.json|settings\\.local\\.json))';
    const destructive = '(rm|del|rmdir|Remove-Item)';
    const re = new RegExp(
      '(^|[\\s;&|\\x60])' + destructive + '\\b[^\\n]*' + protectedTargets
    );

    if (re.test(cmd)) {
      process.stdout.write(JSON.stringify({
        continue: false,
        stopReason: '[S8] Protected seed file. Delete manually outside Claude Code if intentional.'
      }));
    } else {
      process.stdout.write(JSON.stringify({ continue: true }));
    }
  } catch (_) {
    // Fail-open: if we can't parse, don't block (Claude Code proceeds).
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
