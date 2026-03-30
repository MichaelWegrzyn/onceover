import { getFileStats, getFilePath } from './DiffViewer.jsx';

function FilePathDisplay({ path, isActive }) {
  const lastSlash = path.lastIndexOf('/');
  const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '';
  const file = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;

  return (
    <span className="flex min-w-0 flex-col">
      <span
        className={`truncate text-xs font-medium ${
          isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
        }`}
      >
        {file}
      </span>
      {dir && (
        <span
          className={`truncate text-[10px] leading-tight ${
            isActive ? 'text-blue-500/60 dark:text-blue-400/50' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {dir}
        </span>
      )}
    </span>
  );
}

export default function FileTree({ files, onFileClick, activeFile, commentCounts = {} }) {
  return (
    <nav className="custom-scrollbar hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/80 md:block dark:border-gray-700/80 dark:bg-[#0d1117]" aria-label="Changed files">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur-sm dark:border-gray-700/80 dark:bg-[#0d1117]/95">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Changed Files ({files.length})
        </h2>
      </div>
      <ul className="py-1">
        {files.map((file) => {
          const path = getFilePath(file);
          const stats = getFileStats(file);
          const isActive = activeFile === path;
          const commentCount = commentCounts[path] || 0;

          return (
            <li
              key={path}
              className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-1.5 transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
              onClick={() => onFileClick(path)}
              title={path}
            >
              <span className="min-w-0 font-mono">
                <FilePathDisplay path={path} isActive={isActive} />
              </span>
              <span className="flex shrink-0 items-center gap-1.5 self-start pt-0.5">
                {commentCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                    {commentCount}
                  </span>
                )}
                <span className="flex gap-1.5 text-[11px] font-semibold tabular-nums">
                  {stats.additions > 0 && (
                    <span className="text-green-600 dark:text-green-400">+{stats.additions}</span>
                  )}
                  {stats.deletions > 0 && (
                    <span className="text-red-600 dark:text-red-400">-{stats.deletions}</span>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
