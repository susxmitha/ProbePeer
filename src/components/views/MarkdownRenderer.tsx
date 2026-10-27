import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into block elements by double newlines or major structure
  const normalized = content.replace(/\r\n/g, '\n');
  const rawBlocks = normalized.split(/\n\s*\n/);

  const renderInline = (text: string): React.ReactNode => {
    // Tokenize for bold (**...** or __...__), italic (*...* or _..._), code (`...`), link ([...](...)), citation ([...])
    const regex = /(\*\*.*?\*\*|__.*?__|`.*?`|\[.+?\]\(.+?\)|\[[A-Za-z\s]+et\sal\.,\s\d{4}[a-z]?\]|\*[^\*]+?\*|_[^_]+?_)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold: **text** or __text__
      if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
        const inner = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-[var(--text-main)]">{inner}</strong>;
      }

      // Inline code: `text`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <code key={index} className="font-mono text-xs bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] px-1.5 py-0.5 rounded">
            {inner}
          </code>
        );
      }

      // Link: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] hover:underline font-medium underline-offset-2"
          >
            {renderInline(linkMatch[1])}
          </a>
        );
      }

      // Citation: [Author et al., Year]
      if (/^\[[A-Za-z\s]+et\sal\.,\s\d{4}[a-z]?\]$/.test(part)) {
        return (
          <span key={index} className="font-sans text-[11px] font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-1 py-0.5 rounded border border-[var(--accent-primary)]/20 mx-0.5 whitespace-nowrap">
            {part}
          </span>
        );
      }

      // Italic: *text* or _text_
      if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
          (part.startsWith('_') && part.endsWith('_') && part.length >= 2 && !part.startsWith('__'))) {
        const inner = part.slice(1, -1);
        return <em key={index} className="italic text-[var(--text-main)]">{inner}</em>;
      }

      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const renderBlock = (block: string, blockIndex: number) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Horizontal rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      return <hr key={blockIndex} className="border-t border-[var(--border)] my-6" />;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={blockIndex} className="font-serif text-xl sm:text-2xl font-bold text-[var(--text-main)] mt-6 mb-3 tracking-tight">
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={blockIndex} className="font-serif text-lg sm:text-xl font-semibold text-[var(--text-main)] mt-5 mb-2.5 tracking-tight border-b border-[var(--border)] pb-1.5">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={blockIndex} className="font-serif text-base sm:text-lg font-semibold text-[var(--text-main)] mt-4 mb-2">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    }

    // Heading 4
    if (trimmed.startsWith('#### ')) {
      return (
        <h4 key={blockIndex} className="font-serif text-sm font-semibold uppercase tracking-wider text-[var(--text-main)] mt-3 mb-1.5">
          {renderInline(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines = trimmed.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n');
      return (
        <blockquote key={blockIndex} className="border-l-2 border-[var(--accent-primary)] pl-3.5 italic text-[var(--text-muted)] my-3 font-serif">
          {renderInline(quoteLines)}
        </blockquote>
      );
    }

    const lines = trimmed.split('\n');

    // Ordered list (every non-empty line starts with number.)
    if (lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      return (
        <ol key={blockIndex} className="list-decimal list-outside pl-5 space-y-1.5 my-3 font-serif text-sm text-[var(--text-main)] leading-relaxed">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="pl-1">
              {renderInline(line.trim().replace(/^\d+\.\s+/, ''))}
            </li>
          ))}
        </ol>
      );
    }

    // Unordered list (every non-empty line starts with - or *)
    if (lines.length > 0 && lines.every((l) => /^[\-\*]\s+/.test(l.trim()))) {
      return (
        <ul key={blockIndex} className="list-disc list-outside pl-5 space-y-1.5 my-3 font-serif text-sm text-[var(--text-main)] leading-relaxed">
          {lines.map((line, lIdx) => (
            <li key={lIdx} className="pl-1">
              {renderInline(line.trim().replace(/^[\-\*]\s+/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Regular paragraph
    return (
      <div key={blockIndex} className="font-serif text-sm leading-relaxed text-[var(--text-main)] mb-3.5 tracking-normal">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={`manuscript-markdown-body space-y-2 ${className}`}>
      {rawBlocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
};
