#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { assertGitRepo, getDiff, getUntrackedDiff } from '../src/git.js';
import { buildHtml } from '../src/template.js';
import { openInBrowser } from '../src/open.js';

function printUsage() {
  console.log(`Usage: onceover [options] [ref]

Options:
  --staged    Show staged changes only
  --all       Show staged + unstaged changes vs HEAD
  --help      Show this help message
  --version   Show version number

Arguments:
  ref         Git ref to diff against (branch, tag, commit, HEAD~N)`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = 'default';
  let ref = null;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--version' || arg === '-v') {
      const __dir = dirname(fileURLToPath(import.meta.url));
      const pkg = JSON.parse(readFileSync(join(__dir, '..', 'package.json'), 'utf-8'));
      console.log(pkg.version);
      process.exit(0);
    }
    if (arg === '--staged') {
      if (mode !== 'default') {
        console.error('Error: Cannot combine --staged with --all or a ref.');
        process.exit(1);
      }
      mode = 'staged';
    } else if (arg === '--all') {
      if (mode !== 'default') {
        console.error('Error: Cannot combine --all with --staged or a ref.');
        process.exit(1);
      }
      mode = 'all';
    } else if (arg.startsWith('--')) {
      console.error(`Error: Unknown flag "${arg}". Run with --help for usage.`);
      process.exit(1);
    } else {
      if (mode === 'staged' || mode === 'all') {
        console.error(`Error: Cannot combine a ref with --${mode}.`);
        process.exit(1);
      }
      if (ref !== null) {
        console.error('Error: Only one ref argument is supported.');
        process.exit(1);
      }
      ref = arg;
      mode = 'ref';
    }
  }

  return { mode, ref };
}

function main() {
  const { mode, ref } = parseArgs(process.argv);

  assertGitRepo();

  let diffText = getDiff(mode, ref);

  if (mode === 'default' || mode === 'all') {
    diffText += getUntrackedDiff();
  }

  if (!diffText.trim()) {
    console.log('No changes to review.');
    process.exit(0);
  }

  const html = buildHtml(diffText);
  const outPath = join(tmpdir(), `onceover-${Date.now()}.html`);
  writeFileSync(outPath, html);

  console.log(`Opening your once-over: ${outPath}`);
  openInBrowser(outPath);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
