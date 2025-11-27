"use client";

import { useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";
import { toast } from "sonner";

interface CodeDisplayProps {
  code: string;
  filename?: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CodeDisplay({
  code,
  filename,
  language = "tsx",
  showLineNumbers = true,
  maxHeight = "400px",
  className = "",
}: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const lines = code.split("\n");

  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#0D0D0D] border border-white/5 ${className}`}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <FileCode size={14} />
            <span className="font-mono">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Code Area */}
      <div className="relative" style={{ maxHeight }}>
        <div className="overflow-auto h-full">
          <pre className="p-4 text-sm font-mono">
            <code className="text-zinc-300">
              {showLineNumbers ? (
                lines.map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none text-zinc-600 w-10 pr-4 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1">{highlightSyntax(line, language)}</span>
                  </div>
                ))
              ) : (
                code
              )}
            </code>
          </pre>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0D0D0D] to-transparent pointer-events-none" />
      </div>

      {/* Copy button (when no filename header) */}
      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(line: string, language: string): React.ReactNode {
  if (language !== "tsx" && language !== "ts" && language !== "jsx" && language !== "js") {
    return line;
  }

  // Simple regex-based highlighting
  const patterns: [RegExp, string][] = [
    // Comments
    [/(\/\/.*$)/g, "text-zinc-500 italic"],
    // Strings (double quotes)
    [/("(?:[^"\\]|\\.)*")/g, "text-green-400"],
    // Strings (single quotes)
    [/('(?:[^'\\]|\\.)*')/g, "text-green-400"],
    // Template literals
    [/(`(?:[^`\\]|\\.)*`)/g, "text-green-400"],
    // Keywords
    [/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|interface|type|async|await|default|as)\b/g, "text-purple-400"],
    // React/JSX
    [/\b(React|useState|useEffect|useRef|useMemo|useCallback)\b/g, "text-cyan-400"],
    // Types
    [/\b(string|number|boolean|void|null|undefined|any)\b/g, "text-yellow-400"],
    // JSX tags
    [/<\/?([A-Z][a-zA-Z0-9]*)/g, "text-cyan-400"],
    // HTML tags
    [/<\/?([a-z][a-z0-9]*)/g, "text-pink-400"],
    // Props/attributes
    [/\s([a-zA-Z-]+)=/g, "text-orange-400"],
    // Numbers
    [/\b(\d+\.?\d*)\b/g, "text-orange-400"],
  ];

  let result = line;
  const segments: { start: number; end: number; className: string }[] = [];

  // Find all matches
  patterns.forEach(([pattern, className]) => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(line)) !== null) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        className,
      });
    }
  });

  // If no segments, return plain text
  if (segments.length === 0) {
    return line;
  }

  // Sort segments by start position
  segments.sort((a, b) => a.start - b.start);

  // Build highlighted output
  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  segments.forEach((seg, i) => {
    // Skip overlapping segments
    if (seg.start < lastEnd) return;

    // Add text before this segment
    if (seg.start > lastEnd) {
      parts.push(line.slice(lastEnd, seg.start));
    }

    // Add highlighted segment
    parts.push(
      <span key={i} className={seg.className}>
        {line.slice(seg.start, seg.end)}
      </span>
    );

    lastEnd = seg.end;
  });

  // Add remaining text
  if (lastEnd < line.length) {
    parts.push(line.slice(lastEnd));
  }

  return <>{parts}</>;
}

export default CodeDisplay;
