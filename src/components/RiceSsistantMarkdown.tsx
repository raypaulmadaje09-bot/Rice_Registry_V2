import React from 'react';

interface RiceSsistantMarkdownProps {
  content: string;
}

export const RiceSsistantMarkdown: React.FC<RiceSsistantMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Sanitize any action tokens, duplicate prefixes or prompt artifacts
  const cleanContent = content
    .replace(/\[ACTION:[a-z_]+\]/gi, '')
    .replace(/^(RiceSsistant:\s*)+/i, 'RiceSsistant: ')
    .trim();

  // Split content into blocks by double newlines or table/list breaks
  const rawBlocks = cleanContent.split(/\n\n+/);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-800 break-words">
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();

        // 1. Table Block Detection
        if (trimmed.includes('|') && trimmed.split('\n').filter(l => l.trim().startsWith('|')).length >= 2) {
          const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
          if (lines.length >= 2) {
            const headerLine = lines[0];
            const dataLines = lines.slice(1).filter(l => !l.replace(/[\s|:-]/g, '').length === false);

            const headers = headerLine
              .split('|')
              .slice(1, -1)
              .map(h => h.trim());

            return (
              <div key={blockIdx} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      {headers.map((h, i) => (
                        <th key={i} className="px-2.5 py-1.5 whitespace-nowrap">
                          {parseInlineMarkdown(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataLines.map((rowLine, rowIdx) => {
                      // skip separator lines like |---|---|
                      if (/^\|[\s:-|]+\|$/.test(rowLine)) return null;
                      const cells = rowLine
                        .split('|')
                        .slice(1, -1)
                        .map(c => c.trim());
                      return (
                        <tr key={rowIdx} className="hover:bg-emerald-50/30 transition-colors">
                          {cells.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-2.5 py-1.5 text-slate-700">
                              {parseInlineMarkdown(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 2. Callout / Blockquote
        if (trimmed.startsWith('>')) {
          const calloutText = trimmed
            .split('\n')
            .map(l => l.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <div
              key={blockIdx}
              className="my-2 p-2.5 rounded-r-xl border-l-4 border-emerald-600 bg-emerald-50/80 text-emerald-950 font-medium text-[11.5px]"
            >
              {parseInlineMarkdown(calloutText)}
            </div>
          );
        }

        // 3. Headers (###, ##, #)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={blockIdx} className="font-bold text-slate-900 text-xs tracking-tight mt-2 text-emerald-900 flex items-center gap-1.5">
              <span>🌾</span>
              <span>{parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={blockIdx} className="font-bold text-slate-900 text-sm tracking-tight mt-2 text-emerald-950">
              {parseInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }

        // 4. Bullet lists
        const lines = trimmed.split('\n');
        const isBulletList = lines.every(l => /^\s*[-*•]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="space-y-1 my-1 pl-1">
              {lines.map((line, lineIdx) => {
                const isNumbered = /^\s*\d+\.\s+/.test(line);
                const content = line.replace(/^\s*[-*•\d.]+\s+/, '');
                return (
                  <li key={lineIdx} className="flex items-start gap-1.5 text-slate-700">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">
                      {isNumbered ? `${lineIdx + 1}.` : '•'}
                    </span>
                    <span className="flex-1">{parseInlineMarkdown(content)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 5. Standard paragraph with inline formatting
        return (
          <p key={blockIdx} className="leading-relaxed">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Helper to parse inline markdown: bold (**text**), code (`code`), badge tokens
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split on bold (**...**) and inline code (`...`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 text-emerald-800 font-mono text-[10.5px] border border-slate-200">
          {codeText}
        </code>
      );
    }
    return part;
  });
}
