import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function buildHtml(diffText) {
  const templatePath = join(__dirname, '..', 'build', 'index.html');
  let templateHtml = readFileSync(templatePath, 'utf-8');

  // Base64 encode to avoid </script> injection issues.
  // Raw diffs can contain </script> in HTML file changes,
  // which would prematurely close the script tag.
  const encoded = Buffer.from(diffText, 'utf-8').toString('base64');

  // Target the exact assignment in the HTML script tag.
  // The bundled JS also contains the placeholder as a string comparison,
  // so we must match the specific assignment to avoid replacing the wrong one.
  templateHtml = templateHtml.replace(
    'window.__DIFF_DATA__ = "__DIFF_PLACEHOLDER__"',
    `window.__DIFF_DATA__ = "${encoded}"`
  );

  return templateHtml;
}
