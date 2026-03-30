import { useState, useRef, useEffect } from 'react';

export function CommentForm({ onSave, onCancel, initialText = '' }) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) onSave(text.trim());
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="comment-form mx-2 my-1.5">
      <textarea
        ref={textareaRef}
        className="w-full resize-none rounded-md border border-blue-400 bg-white px-3 py-2 text-[13px] leading-relaxed text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-blue-500/60 dark:bg-[#161b22] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/50"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a review comment... (Enter to save, Esc to cancel)"
      />
    </div>
  );
}

export function CommentBar({ text, onEdit, onDelete }) {
  return (
    <div className="comment-bar group mx-2 my-1 flex items-start gap-2 rounded-md border-l-[3px] border-blue-500 bg-blue-50 px-3 py-2 dark:border-blue-400 dark:bg-blue-500/10">
      <span
        className="flex-1 cursor-pointer text-[13px] leading-relaxed text-gray-700 dark:text-gray-300"
        onClick={onEdit}
        title="Click to edit"
      >
        {text}
      </span>
      <button
        className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        onClick={onDelete}
        aria-label="Delete comment"
        title="Delete comment"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
