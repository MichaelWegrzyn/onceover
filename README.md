# onceover

Give your code a once-over.

Your AI agent just rewrote half your codebase. `git diff` in the terminal is a mess. Opening your IDE just to review changes feels heavy. You just want a quick, clean look at what changed.

```bash
npx onceover
```

That's it. A browser tab opens with a GitHub-quality diff view. No server, no config, no install. The CLI exits immediately — nothing left running.

![onceover demo](demo.gif)

## Inline Feedback

Spot something? Click the `+` on any line number to leave a comment. A review sidebar builds a structured prompt as you go — file paths, line numbers, and your instructions. Hit **Copy Review** and paste it straight into Claude Code, Cursor, or any AI coding tool.

```
npx onceover → scan → comment → copy → paste into terminal → agent fixes → npx onceover again
```

Comments persist across refreshes via localStorage (keyed by diff content). New diff = clean slate.

## Usage

```bash
npm install -g onceover   # or just use npx

onceover              # unstaged changes
onceover --staged     # staged changes only
onceover --all        # staged + unstaged vs HEAD
onceover main         # diff against a branch
onceover HEAD~3       # last 3 commits
onceover abc123       # changes since a specific commit
```

Requires Node.js 18+ and git.

## How it works

1. Runs `git diff` in your current repo
2. Injects the diff into a pre-built HTML template
3. Writes it to a temp file
4. Opens your browser
5. Done

The HTML viewer is a React app bundled into a single file at build time (~115KB gzipped). At runtime, the CLI just does string replacement and file I/O — it's near-instant.

## License

MIT
