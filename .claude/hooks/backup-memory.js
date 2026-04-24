// PostToolUse hook: backup files in .claude/memory/*.md after Edit/Write
//
// Project root derivation: always from tool_input.file_path (the absolute path CC passes),
// NEVER from process.cwd() — cwd may be wrong if CC was opened outside the SEED.
//
// Silent success; errors go to <project>/.backup/_hook-errors.log.

let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const parsed = JSON.parse(d);
    filePath = (parsed.tool_input || {}).file_path || '';

    // Match only files in .claude/memory/*.md and extract:
    //   m[1] = project root (everything BEFORE .claude/)
    //   m[2] = filename (without path)
    const m = filePath.match(
      /^(.*?)[\x2F\x5C]\.claude[\x2F\x5C]+memory[\x2F\x5C]+([^\x2F\x5C]+\.md)$/
    );
    if (!m) return; // not a memory file — ignore without error

    const fs = require('fs');
    const path = require('path');

    // Gate: source must exist on the filesystem.
    // If file_path comes in a format Node-Windows can't resolve (e.g., /c/Users/...),
    // existsSync=false → bail without creating a bogus dir.
    if (!fs.existsSync(filePath)) return;

    const projectRoot = m[1];
    const filename = m[2];
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backupDir = path.join(projectRoot, '.backup');
    const backupName = filename.replace(/\.md$/, '') + '-' + ts + '.md';

    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(filePath, path.join(backupDir, backupName));
  } catch (e) {
    // Error logging — tries to write to <project>/.backup/_hook-errors.log
    try {
      const fs = require('fs');
      const path = require('path');
      const m = filePath.match(/^(.*?)[\x2F\x5C]\.claude[\x2F\x5C]/);
      const root = (m && m[1]) || process.cwd();
      const logDir = path.join(root, '.backup');
      fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(
        path.join(logDir, '_hook-errors.log'),
        new Date().toISOString() +
          ' [PostToolUse/backup-memory] ' +
          (e.message || String(e)) +
          ' file=' + filePath + '\n'
      );
    } catch (_) {
      // last resort: nowhere to log, swallow
    }
  }
});
