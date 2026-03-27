import { getFileStats } from './DiffViewer.jsx';

export default function DiffHeader({ files }) {
  const totalFiles = files.length;
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const file of files) {
    const stats = getFileStats(file);
    totalAdditions += stats.additions;
    totalDeletions += stats.deletions;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {totalFiles} file{totalFiles !== 1 ? 's' : ''} changed
      </span>
      <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
        +{totalAdditions}
      </span>
      <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
        -{totalDeletions}
      </span>
    </div>
  );
}
