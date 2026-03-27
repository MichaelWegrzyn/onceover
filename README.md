# onceover

Give your code a once-over.

Your AI agent just rewrote half your codebase. `git diff` in the terminal is a mess. Opening your IDE just to review changes feels heavy. You just want a quick, clean look at what changed.

```bash
npx onceover
```

That's it. A browser tab opens with a GitHub-quality diff view. No server, no config, no install. The CLI exits immediately — nothing left running.

## Usage

```bash
onceover              # unstaged changes
onceover --staged     # staged changes only
onceover --all        # staged + unstaged vs HEAD
onceover main         # diff against a branch
onceover HEAD~3       # last 3 commits
onceover abc123       # changes since a specific commit
```

Or skip the install entirely:

```bash
npx onceover
npx onceover --staged
npx onceover main
```

## What you get

- **Split and unified views** — toggle between side-by-side and inline diffs
- **Syntax highlighting** — 62 languages, auto-detected from file extensions
- **Dark and light mode** — picks up your system preference, or toggle manually
- **File sidebar** — click to jump, tracks your scroll position
- **Keyboard navigation** — `j`/`k` to move between files, `e` to expand/collapse
- **Copy file path** — one click to grab the path for your editor
- **Collapse/expand files** — focus on what matters
- **Self-contained HTML** — the output is a single file with everything inlined, no external requests

## How it works

1. Runs `git diff` in your current repo
2. Injects the diff into a pre-built HTML template
3. Writes it to a temp file
4. Opens your browser
5. Done

The HTML viewer is a React app bundled into a single file at build time (~115KB gzipped). At runtime, the CLI just does string replacement and file I/O — it's near-instant.

## Install

```bash
npm install -g onceover
```

Or just use `npx` — works without installing.

Requires Node.js 18+ and git.

## Why

I built this because I spend most of my time in the terminal with AI coding agents. When an agent finishes a task, I need to review the changes before committing. Terminal diffs are hard to scan across many files. IDEs are slow to open. I wanted something in between — a fast, beautiful diff view that's one command away.

## License

MIT
