import { execSync, execFileSync } from 'node:child_process';

export function assertGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('git is not installed. Please install git first.');
    }
    if (err.stderr?.includes('not a git repository')) {
      throw new Error('Not a git repository. Run this command inside a git repo.');
    }
    throw new Error(`Git error: ${err.stderr || err.message}`);
  }
}

export function getDiff(mode, ref) {
  const commands = {
    default: 'git diff',
    staged: 'git diff --cached',
    all: 'git diff HEAD',
    ref: `git diff ${ref}`,
  };

  const diffCommand = commands[mode];
  if (!diffCommand) {
    throw new Error(`Unknown diff mode: ${mode}`);
  }

  try {
    return execSync(diffCommand, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('git is not installed. Please install git first.');
    }
    throw new Error(`Git error: ${err.stderr?.trim() || err.message}`);
  }
}

export function getUntrackedDiff() {
  let files;
  try {
    files = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    }).trim();
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('git is not installed. Please install git first.');
    }
    throw new Error(`Git error: ${err.stderr?.trim() || err.message}`);
  }

  if (!files) return '';

  let result = '';
  for (const file of files.split('\n')) {
    try {
      execFileSync('git', ['diff', '--no-index', '--', '/dev/null', file], {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (err) {
      // git diff --no-index exits with code 1 when files differ (expected)
      if (err.status === 1 && err.stdout) {
        result += err.stdout;
      }
    }
  }

  return result;
}
