import { useMemo, useState } from 'react';
import { Diff, Hunk, tokenize, markEdits, getChangeKey } from 'react-diff-view';
import { refractor } from 'refractor';
import { CommentForm, CommentBar } from './InlineComment';

// Adapter: refractor v4 returns a Root node from highlight(),
// but react-diff-view expects the v3 API that returned an array of nodes.
// Wrap refractor to extract .children so tokenize() gets what it expects.
const refractorAdapter = {
  highlight(code, language) {
    const root = refractor.highlight(code, language);
    return root.children;
  },
  registered(language) {
    return refractor.registered(language);
  },
};

const EXT_TO_LANGUAGE = {
  // JavaScript / TypeScript
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  // Frameworks (use JS highlighting for script-heavy formats)
  vue: 'javascript', svelte: 'javascript',
  // Backend
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  php: 'php', swift: 'swift', kt: 'kotlin',
  // C family
  c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cs: 'csharp', m: 'objectivec',
  // Markup / styles
  html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup',
  css: 'css', scss: 'scss', less: 'less', sass: 'sass',
  // Data / config
  json: 'json', yaml: 'yaml', yml: 'yaml',
  ini: 'ini', env: 'ini',
  // Shell / scripting
  sh: 'bash', bash: 'bash', zsh: 'bash',
  lua: 'lua', r: 'r', pl: 'perl',
  // Docs / other
  md: 'markdown', sql: 'sql',
  makefile: 'makefile', dockerfile: 'docker',
};

const FILENAME_TO_LANGUAGE = {
  makefile: 'makefile', dockerfile: 'docker',
  '.bashrc': 'bash', '.zshrc': 'bash', '.profile': 'bash',
  '.gitignore': 'ini', '.env': 'ini', '.editorconfig': 'ini',
};

function getLanguage(filePath) {
  const fileName = filePath.split('/').pop()?.toLowerCase();
  if (FILENAME_TO_LANGUAGE[fileName]) return FILENAME_TO_LANGUAGE[fileName];
  const ext = fileName?.split('.').pop();
  if (ext === fileName) return undefined; // No extension
  return EXT_TO_LANGUAGE[ext] || undefined;
}

export function getFilePath(file) {
  return file.newPath || file.oldPath;
}

export function getFileStats(file) {
  let additions = 0;
  let deletions = 0;
  for (const hunk of file.hunks) {
    for (const change of hunk.changes) {
      if (change.isInsert) additions++;
      if (change.isDelete) deletions++;
    }
  }
  return { additions, deletions };
}

// Get the new-file line number for a change (used for export)
export function getNewLineNumber(change) {
  if (change.isInsert) return change.lineNumber;
  if (change.isNormal) return change.newLineNumber;
  // For deletes, there's no new line number
  return change.lineNumber;
}

function useTokens(hunks, language) {
  return useMemo(() => {
    if (!hunks?.length || !language) return undefined;

    try {
      return tokenize(hunks, {
        highlight: true,
        refractor: refractorAdapter,
        language,
        enhancers: [markEdits(hunks, { type: 'block' })],
      });
    } catch {
      return undefined;
    }
  }, [hunks, language]);
}

const TYPE_LABELS = {
  add: 'Added',
  delete: 'Deleted',
  modify: 'Modified',
  rename: 'Renamed',
  copy: 'Copied',
};

const TYPE_COLORS = {
  add: 'bg-green-500/15 text-green-700 dark:text-green-400',
  delete: 'bg-red-500/15 text-red-700 dark:text-red-400',
  modify: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  rename: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  copy: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
};

function CopyPathButton({ path }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      onClick={handleCopy}
      aria-label={`Copy file path: ${path}`}
      title="Copy file path"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
}

function CommentWidget({ changeKey, filePath, comment, activeCommentKey, onSave, onCancel, onEdit, onDelete }) {
  const isEditing = activeCommentKey === changeKey;

  if (!isEditing && !comment) return null;

  return (
    <div id={`comment-${changeKey}`}>
      {isEditing ? (
        <CommentForm
          initialText={comment?.text || ''}
          onSave={(text) => onSave(changeKey, filePath, text)}
          onCancel={onCancel}
        />
      ) : (
        <CommentBar
          text={comment.text}
          onEdit={() => onEdit(changeKey)}
          onDelete={() => onDelete(changeKey)}
        />
      )}
    </div>
  );
}

function FileDiff({ file, viewType, isCollapsed, onToggleCollapse, comments, activeCommentKey, onGutterClick, onSaveComment, onCancelComment, onEditComment, onDeleteComment }) {
  const path = getFilePath(file);
  const language = getLanguage(path);
  const tokens = useTokens(file.hunks, language);
  const stats = getFileStats(file);
  const isBinary = file.hunks.length === 0;

  // Build widgets map: changeKey -> ReactElement for comments
  // Comments and activeCommentKey are scoped as "filePath:changeKey" to avoid collisions across files
  const scopedKey = (changeKey) => `${path}:${changeKey}`;

  const widgets = useMemo(() => {
    const w = {};
    // All changes across hunks
    const allChanges = file.hunks.flatMap((h) => h.changes);
    for (const change of allChanges) {
      const key = getChangeKey(change);
      const scoped = scopedKey(key);
      const comment = comments[scoped];
      const isActive = activeCommentKey === scoped;
      if (comment || isActive) {
        w[key] = (
          <CommentWidget
            changeKey={scoped}
            filePath={path}
            comment={comment}
            activeCommentKey={activeCommentKey}
            onSave={onSaveComment}
            onCancel={onCancelComment}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
        );
      }
    }
    return w;
  }, [file.hunks, comments, activeCommentKey, path, onSaveComment, onCancelComment, onEditComment, onDeleteComment]);

  // Custom gutter renderer to add the + button
  const renderGutter = useMemo(() => {
    return function GutterRenderer({ side, renderDefault, wrapInAnchor, change }) {
      // Show + only on the "new" side gutter (side is always "old" or "new")
      const showButton = side === 'new';
      // Don't show + on delete lines
      const isDelete = change?.isDelete;

      return (
        <div className="gutter-content">
          {wrapInAnchor(renderDefault())}
          {showButton && !isDelete && (
            <button
              className="gutter-add-btn"
              aria-label="Add comment"
              title="Add comment"
              onClick={(e) => {
                e.stopPropagation();
                if (!change) return;
                const key = getChangeKey(change);
                // Pass the closest table row so App can preserve scroll position
                const row = e.currentTarget.closest('tr');
                onGutterClick(key, path, change, row);
              }}
            >
              +
            </button>
          )}
        </div>
      );
    };
  }, [onGutterClick, path]);

  return (
    <div
      className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700/80"
      id={`file-${encodeURIComponent(path)}`}
    >
      {/* File header */}
      <div
        className="sticky top-0 z-10 flex cursor-pointer items-center gap-2.5 border-b border-gray-200 bg-gray-50 px-4 py-2.5 select-none transition-colors hover:bg-gray-100 dark:border-gray-700/80 dark:bg-[#161b22] dark:hover:bg-[#1c2128]"
        onClick={onToggleCollapse}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${path}`}
      >
        <svg
          className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-150 dark:text-gray-500 ${isCollapsed ? '' : 'rotate-90'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-semibold text-gray-800 dark:text-gray-200">
          {path}
        </span>
        <CopyPathButton path={path} />
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_COLORS[file.type] || TYPE_COLORS.modify}`}>
          {TYPE_LABELS[file.type] || file.type}
        </span>
        <span className="flex shrink-0 items-center gap-2.5 pl-1 text-xs font-semibold tabular-nums">
          <span className="text-green-600 dark:text-green-400">+{stats.additions}</span>
          <span className="text-red-600 dark:text-red-400">-{stats.deletions}</span>
        </span>
      </div>

      {/* Diff content */}
      {!isCollapsed && !isBinary && (
        <div className="diff-table-wrap">
          <Diff
            viewType={viewType}
            diffType={file.type}
            hunks={file.hunks}
            tokens={tokens}
            widgets={widgets}
            renderGutter={renderGutter}
          >
            {(hunks) => hunks.map((hunk) => (
              <Hunk key={hunk.content} hunk={hunk} />
            ))}
          </Diff>
        </div>
      )}
      {!isCollapsed && isBinary && (
        <div className="bg-gray-50 py-10 text-center text-sm text-gray-400 dark:bg-[#0d1117] dark:text-gray-500">
          Binary file changed
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({ files, viewType, collapsedFiles, onToggleCollapse, comments, activeCommentKey, onGutterClick, onSaveComment, onCancelComment, onEditComment, onDeleteComment }) {
  return (
    <div className="p-4">
      {files.map((file) => {
        const path = getFilePath(file);
        // Filter comments for this file (keys are scoped as "filePath:changeKey")
        const fileComments = {};
        const prefix = `${path}:`;
        for (const [key, comment] of Object.entries(comments)) {
          if (key.startsWith(prefix)) {
            fileComments[key] = comment;
          }
        }
        return (
          <FileDiff
            key={path}
            file={file}
            viewType={viewType}
            isCollapsed={collapsedFiles.has(path)}
            onToggleCollapse={() => onToggleCollapse(path)}
            comments={fileComments}
            activeCommentKey={activeCommentKey}
            onGutterClick={onGutterClick}
            onSaveComment={onSaveComment}
            onCancelComment={onCancelComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        );
      })}
    </div>
  );
}
