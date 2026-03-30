export default function Toolbar({ viewType, onViewTypeChange, theme, onThemeChange, commentCount = 0, onToggleReview }) {
  return (
    <div className="flex items-center gap-3" role="toolbar" aria-label="Diff view controls">
      {/* Comment count / review toggle */}
      {commentCount > 0 && (
        <button
          className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          onClick={onToggleReview}
          aria-label="Toggle review sidebar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </button>
      )}

      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600" role="group" aria-label="View mode">
        <button
          className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
            viewType === 'split'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={() => onViewTypeChange('split')}
          aria-pressed={viewType === 'split'}
        >
          Split
        </button>
        <button
          className={`border-l border-gray-200 px-3.5 py-1.5 text-xs font-medium transition-colors dark:border-gray-600 ${
            viewType === 'unified'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={() => onViewTypeChange('unified')}
          aria-pressed={viewType === 'unified'}
        >
          Unified
        </button>
      </div>
      <button
        className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            Light
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            Dark
          </span>
        )}
      </button>
    </div>
  );
}
