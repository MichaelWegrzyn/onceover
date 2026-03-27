import { exec } from 'node:child_process';
import { platform } from 'node:os';

export function openInBrowser(filePath) {
  const url = `file://${filePath}`;
  const platformName = platform();

  let openCommand;
  if (platformName === 'darwin') {
    openCommand = `open "${url}"`;
  } else if (platformName === 'win32') {
    openCommand = `start "" "${url}"`;
  } else {
    openCommand = `xdg-open "${url}"`;
  }

  exec(openCommand, () => {
    // Fire and forget — if the browser doesn't open,
    // the user still has the file path printed to stdout.
  });
}
