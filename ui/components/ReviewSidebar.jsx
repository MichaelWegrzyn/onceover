import { useState, useMemo } from 'react';

function buildReviewPrompt(commentsByFile) {
  const sections = [];
  for (const { filePath, comments } of commentsByFile) {
    for (const comment of comments) {
      const lineLabel = comment.lineNumber ? ` (line ${comment.lineNumber})` : '';
      sections.push(`## ${filePath}${lineLabel}\n${comment.text}`);
    }
  }
  if (sections.length === 0) return '';
  return `I have the following feedback on these changes:\n\n${sections.join('\n\n')}`;
}

export default function ReviewSidebar({ comments, files, onJumpToComment, isOpen, onToggle }) {
  const [copied, setCopied] = useState(false);

  // Group comments by file in file-tree order
  const commentsByFile = useMemo(() => {
    const grouped = [];
    const commentEntries = Object.entries(comments);
    if (commentEntries.length === 0) return grouped;

    const fileOrder = files.map((f) => f.newPath || f.oldPath);

    const byFile = {};
    for (const [changeKey, comment] of commentEntries) {
      if (!byFile[comment.filePath]) byFile[comment.filePath] = [];
      byFile[comment.filePath].push({ ...comment, changeKey });
    }

    for (const filePath of fileOrder) {
      if (byFile[filePath]) {
        const sorted = byFile[filePath].sort((a, b) => (a.lineNumber || 0) - (b.lineNumber || 0));
        grouped.push({ filePath, comments: sorted });
      }
    }

    return grouped;
  }, [comments, files]);

  const totalComments = Object.keys(comments).length;
  const promptText = useMemo(() => buildReviewPrompt(commentsByFile), [commentsByFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (totalComments === 0) return null;

  return (
    <>
      {/* Toggle tab on the edge — only visible when sidebar is closed */}
      {!isOpen && (
        <button
          className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-l-md border border-r-0 border-gray-200 bg-white px-1.5 py-3 text-[11px] font-semibold text-blue-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#161b22] dark:text-blue-400 dark:hover:bg-[#1c2128]"
          onClick={onToggle}
          title="Show review"
        >
          <span className="flex items-center gap-1 [writing-mode:vertical-lr]">
            Review ({totalComments})
          </span>
        </button>
      )}

      {/* Sidebar — always rendered, animated via width transition */}
      <aside
        className={`review-sidebar shrink-0 overflow-hidden border-l border-gray-200 bg-gray-50/80 transition-[width] duration-200 ease-out dark:border-gray-700/80 dark:bg-[#0d1117] ${
          isOpen ? 'w-72' : 'w-0 border-l-0'
        }`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700/80">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Review ({totalComments})
            </h2>
            <button
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              onClick={onToggle}
              aria-label="Close review sidebar"
              title="Close"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Comment list */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-2.5">
            {commentsByFile.map(({ filePath, comments: fileComments }) => (
              <div key={filePath} className="mb-3">
                <div className="mb-1 truncate font-mono text-[10px] font-semibold text-gray-500 dark:text-gray-400" title={filePath}>
                  {filePath}
                </div>
                {fileComments.map((comment) => (
                  <button
                    key={comment.changeKey}
                    className="mb-1 w-full rounded border-l-2 border-blue-500 bg-white px-2.5 py-1.5 text-left text-[11px] leading-snug text-gray-700 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-400 dark:bg-[#161b22] dark:text-gray-300 dark:hover:bg-blue-500/10"
                    onClick={() => onJumpToComment(comment.filePath, comment.changeKey)}
                  >
                    <span className="block text-[9px] font-medium text-gray-400 dark:text-gray-500">
                      L{comment.lineNumber || '?'}
                    </span>
                    {comment.text}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Copy button */}
          <div className="border-t border-gray-200 p-2.5 dark:border-gray-700/80">
            <button
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy Review
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
