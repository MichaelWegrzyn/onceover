import { useState, useMemo, useEffect, useRef } from 'react';
import { parseDiff, getChangeKey } from 'react-diff-view';
import FileTree from './components/FileTree';
import DiffHeader from './components/DiffHeader';
import DiffViewer, { getFilePath, getNewLineNumber } from './components/DiffViewer';
import Toolbar from './components/Toolbar';
import ReviewSidebar from './components/ReviewSidebar';

// Simple hash of diff data for localStorage key
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return 'onceover-' + hash;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function loadStoredComments(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { comments: parsed.comments || {}, sidebarOpen: parsed.sidebarOpen || false };
    }
  } catch {}
  return { comments: {}, sidebarOpen: false };
}

function pruneStaleEntries(currentKey) {
  try {
    const now = Date.now();
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('onceover-') || key === currentKey) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (!entry?.lastAccessed || now - entry.lastAccessed > SEVEN_DAYS) {
          toRemove.push(key);
        }
      } catch {
        toRemove.push(key); // corrupt entry, remove it
      }
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}
}

export default function App() {
  const [viewType, setViewType] = useState('split');
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [collapsedFiles, setCollapsedFiles] = useState(new Set());
  const [activeFile, setActiveFile] = useState(null);
  const mainPaneRef = useRef(null);

  // Storage key derived from diff data
  const storageKey = useMemo(() => {
    const encoded = window.__DIFF_DATA__;
    return encoded && encoded !== '__DIFF_PLACEHOLDER__' ? hashCode(encoded) : null;
  }, []);

  // Restore comments from localStorage on mount (single parse)
  const storedState = useMemo(() => {
    return storageKey ? loadStoredComments(storageKey) : { comments: {}, sidebarOpen: false };
  }, [storageKey]);

  const [comments, setComments] = useState(storedState.comments);
  const [activeCommentKey, setActiveCommentKey] = useState(null);
  const [reviewSidebarOpen, setReviewSidebarOpen] = useState(storedState.sidebarOpen);

  // Prune stale entries on mount
  useEffect(() => {
    if (storageKey) pruneStaleEntries(storageKey);
  }, [storageKey]);

  // Persist comments to localStorage on change
  useEffect(() => {
    if (!storageKey) return;
    const data = { comments, sidebarOpen: reviewSidebarOpen, lastAccessed: Date.now() };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [comments, reviewSidebarOpen, storageKey]);

  // Warn before closing/refreshing if there are unsaved comments
  useEffect(() => {
    const hasComments = Object.keys(comments).length > 0;
    const handler = (e) => {
      if (hasComments) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [comments]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const files = useMemo(() => {
    const encodedDiff = window.__DIFF_DATA__;
    if (!encodedDiff || encodedDiff === '__DIFF_PLACEHOLDER__') return [];
    try {
      const diffText = atob(encodedDiff);
      return parseDiff(diffText, { nearbySequences: 'zip' });
    } catch {
      return [];
    }
  }, []);

  // Track which file is in view via IntersectionObserver
  useEffect(() => {
    if (!files.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible file diff
        let topEntry = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
              topEntry = entry;
            }
          }
        }
        if (topEntry) {
          const id = topEntry.target.id;
          // id is "file-<encodedPath>"
          const path = decodeURIComponent(id.replace('file-', ''));
          setActiveFile(path);
        }
      },
      {
        root: mainPaneRef.current,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe all file diff containers
    const elements = mainPaneRef.current?.querySelectorAll('[id^="file-"]');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [files]);

  const handleFileClick = (path) => {
    setActiveFile(path);
    const el = document.getElementById(`file-${encodeURIComponent(path)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleCollapse = (path) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Comment handlers — scope keys by file path to avoid collisions across files
  const scopedKey = (filePath, changeKey) => `${filePath}:${changeKey}`;

  const handleGutterClick = (changeKey, filePath, change, targetElement) => {
    const key = scopedKey(filePath, changeKey);
    // If already editing this key, do nothing
    if (activeCommentKey === key) return;

    // Preserve scroll position to prevent layout shift when closing
    // a form in another file and opening one here
    if (activeCommentKey && targetElement && mainPaneRef.current) {
      const rect = targetElement.getBoundingClientRect();
      const scrollContainer = mainPaneRef.current;
      const offsetBefore = rect.top;

      // After React re-renders, correct scroll so this element stays put
      requestAnimationFrame(() => {
        const offsetAfter = targetElement.getBoundingClientRect().top;
        const drift = offsetAfter - offsetBefore;
        if (Math.abs(drift) > 1) {
          scrollContainer.scrollTop += drift;
        }
      });
    }

    setActiveCommentKey(key);
  };

  const handleSaveComment = (changeKey, filePath, text) => {
    // changeKey is already file-scoped from CommentWidget, extract raw key for line lookup
    const rawKey = changeKey.slice(filePath.length + 1);
    const lineNumber = findLineNumberForKey(rawKey);
    setComments((prev) => {
      // Auto-open sidebar on first comment
      if (Object.keys(prev).length === 0) {
        setReviewSidebarOpen(true);
      }
      return { ...prev, [changeKey]: { filePath, lineNumber, text } };
    });
    setActiveCommentKey(null);
  };

  const handleCancelComment = () => {
    setActiveCommentKey(null);
  };

  const handleEditComment = (changeKey) => {
    setActiveCommentKey(changeKey);
  };

  const handleDeleteComment = (changeKey) => {
    setComments((prev) => {
      const next = { ...prev };
      delete next[changeKey];
      return next;
    });
    if (activeCommentKey === changeKey) {
      setActiveCommentKey(null);
    }
  };

  // Find the new-file line number for a raw change key by scanning hunks
  const findLineNumberForKey = (rawChangeKey) => {
    for (const file of files) {
      for (const hunk of file.hunks) {
        for (const change of hunk.changes) {
          if (getChangeKey(change) === rawChangeKey) {
            return getNewLineNumber(change);
          }
        }
      }
    }
    return null;
  };

  // Jump to a comment from the sidebar
  const handleJumpToComment = (filePath, changeKey) => {
    // Uncollapse file if collapsed, then scroll to the comment
    setCollapsedFiles((prev) => {
      if (prev.has(filePath)) {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      }
      return prev;
    });

    // Scroll to the specific comment after React renders (file may have been uncollapsed)
    requestAnimationFrame(() => {
      const commentEl = document.getElementById(`comment-${changeKey}`);
      if (commentEl) {
        commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  // Comment counts per file for badges
  const commentCountsByFile = useMemo(() => {
    const counts = {};
    for (const comment of Object.values(comments)) {
      counts[comment.filePath] = (counts[comment.filePath] || 0) + 1;
    }
    return counts;
  }, [comments]);

  const totalComments = Object.keys(comments).length;

  // Keyboard navigation: j/k between files, e to expand/collapse
  useEffect(() => {
    const filePaths = files.map(getFilePath);
    if (!filePaths.length) return;

    const handleKeyDown = (e) => {
      // Don't capture when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const currentIndex = filePaths.indexOf(activeFile);
        let nextIndex;
        if (e.key === 'j') {
          nextIndex = currentIndex < filePaths.length - 1 ? currentIndex + 1 : currentIndex;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        }
        const nextPath = filePaths[nextIndex];
        setActiveFile(nextPath);
        document.getElementById(`file-${encodeURIComponent(nextPath)}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (e.key === 'e' && activeFile) {
        e.preventDefault();
        handleToggleCollapse(activeFile);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [files, activeFile]);

  if (files.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-400 dark:bg-[#0d1117] dark:text-gray-500">
        <p className="text-lg">No diff data to display.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-[#0d1117] dark:text-gray-200">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-2.5 dark:border-gray-700/80 dark:bg-[#161b22]">
        <DiffHeader files={files} />
        <Toolbar
          viewType={viewType}
          onViewTypeChange={setViewType}
          theme={theme}
          onThemeChange={setTheme}
          commentCount={totalComments}
          onToggleReview={() => setReviewSidebarOpen((o) => !o)}
        />
      </header>
      <div className="relative flex flex-1 overflow-hidden">
        <FileTree
          files={files}
          onFileClick={handleFileClick}
          activeFile={activeFile}
          commentCounts={commentCountsByFile}
        />
        <main ref={mainPaneRef} className="custom-scrollbar flex-1 overflow-y-auto bg-gray-100/50 dark:bg-[#010409]">
          <DiffViewer
            files={files}
            viewType={viewType}
            collapsedFiles={collapsedFiles}
            onToggleCollapse={handleToggleCollapse}
            comments={comments}
            activeCommentKey={activeCommentKey}
            onGutterClick={handleGutterClick}
            onSaveComment={handleSaveComment}
            onCancelComment={handleCancelComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
          />
        </main>
        <ReviewSidebar
          comments={comments}
          files={files}
          onJumpToComment={handleJumpToComment}
          isOpen={reviewSidebarOpen}
          onToggle={() => setReviewSidebarOpen((o) => !o)}
        />
      </div>
    </div>
  );
}
