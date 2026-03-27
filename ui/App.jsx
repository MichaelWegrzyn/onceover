import { useState, useMemo, useEffect, useRef } from 'react';
import { parseDiff } from 'react-diff-view';
import FileTree from './components/FileTree';
import DiffHeader from './components/DiffHeader';
import DiffViewer, { getFilePath } from './components/DiffViewer';
import Toolbar from './components/Toolbar';

export default function App() {
  const [viewType, setViewType] = useState('split');
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [collapsedFiles, setCollapsedFiles] = useState(new Set());
  const [activeFile, setActiveFile] = useState(null);
  const mainPaneRef = useRef(null);

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
        />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <FileTree files={files} onFileClick={handleFileClick} activeFile={activeFile} />
        <main ref={mainPaneRef} className="custom-scrollbar flex-1 overflow-y-auto bg-gray-100/50 dark:bg-[#010409]">
          <DiffViewer
            files={files}
            viewType={viewType}
            collapsedFiles={collapsedFiles}
            onToggleCollapse={handleToggleCollapse}
          />
        </main>
      </div>
    </div>
  );
}
