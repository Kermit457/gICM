"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface AgentPromptViewerProps {
  content: string;
  fileName?: string;
}

// Sections that should be collapsible
const COLLAPSIBLE_SECTIONS = [
  "Production Rust Code Examples",
  "Security Checklist",
  "Real-World Example Workflows",
  "Example Workflows",
];

interface Section {
  title: string;
  content: string;
  isCollapsible: boolean;
}

/**
 * Displays agent/skill/command prompts with markdown-style formatting
 * and collapsible sections for long content
 */
export function AgentPromptViewer({ content, fileName }: AgentPromptViewerProps) {
  // Parse content into sections
  const sections = parseContentIntoSections(content);

  return (
    <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-black/10 pb-3">
        <FileText size={20} className="text-black" />
        <div>
          <h3 className="text-sm font-semibold text-black">Full Agent Prompt</h3>
          {fileName && <p className="text-xs text-zinc-600 font-mono">{fileName}</p>}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <Section key={idx} section={section} />
        ))}
      </div>
    </div>
  );
}

function Section({ section }: { section: Section }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!section.isCollapsible) {
    // Regular section - always visible
    return (
      <div className="prose prose-sm max-w-none">
        {formatContent(section.content)}
      </div>
    );
  }

  // Collapsible section
  return (
    <div className="border border-black/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-black/5 hover:bg-black/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-black">{section.title}</h3>
          <span className="text-xs text-zinc-600 bg-white px-2 py-0.5 rounded-full">
            Click to {isExpanded ? "collapse" : "expand"}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="p-4 prose prose-sm max-w-none">
          {formatContent(section.content)}
        </div>
      )}
    </div>
  );
}

function parseContentIntoSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let currentTitle = "";
  let currentIsCollapsible = false;
  let currentContent: string[] = [];

  const saveCurrentSection = () => {
    if (currentTitle) {
      sections.push({
        title: currentTitle,
        content: currentContent.join("\n"),
        isCollapsible: currentIsCollapsible,
      });
    }
  };

  for (const line of lines) {
    // Check for section heading (## Title)
    if (line.startsWith("## ")) {
      // Save previous section
      saveCurrentSection();

      // Start new section
      currentTitle = line.replace("## ", "");
      currentIsCollapsible = COLLAPSIBLE_SECTIONS.includes(currentTitle);
      currentContent = [];
    } else {
      // Add line to current section content
      currentContent.push(line);
    }
  }

  // Save last section
  saveCurrentSection();

  // If no sections found, treat entire content as one section
  if (sections.length === 0) {
    sections.push({
      title: "Content",
      content: text,
      isCollapsible: false,
    });
  }

  return sections;
}

function formatContent(text: string): JSX.Element[] {
  const lines = text.split("\n");
  const formatted: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  lines.forEach((line, idx) => {
    // Code block start/end
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.replace("```", "");
        codeBlockContent = [];
      } else {
        // End code block
        formatted.push(
          <div key={idx} className="rounded-lg bg-black p-3 my-2 overflow-x-auto">
            <code className="text-sm text-lime-300 font-mono whitespace-pre">
              {codeBlockContent.join("\n")}
            </code>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
      }
      return;
    }

    // Inside code block
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Heading (### or #)
    if (line.startsWith("### ")) {
      formatted.push(
        <h4 key={idx} className="text-base font-bold text-black mt-4 mb-2">
          {line.replace("### ", "")}
        </h4>
      );
    } else if (line.startsWith("# ")) {
      formatted.push(
        <h2 key={idx} className="text-xl font-black text-black mt-6 mb-3 border-b border-black/20 pb-2">
          {line.replace("# ", "")}
        </h2>
      );
    }
    // Checklist item
    else if (line.trim().startsWith("- [ ]")) {
      formatted.push(
        <div key={idx} className="flex items-start gap-2 text-sm text-zinc-600 mb-1">
          <input type="checkbox" className="mt-1" disabled />
          <span>{line.replace("- [ ]", "").trim()}</span>
        </div>
      );
    }
    // Bullet points
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      formatted.push(
        <li key={idx} className="text-sm text-zinc-600 ml-4 mb-1">
          {line.replace(/^[-*] /, "")}
        </li>
      );
    }
    // Bold text **text**
    else if (line.includes("**")) {
      const parts = line.split("**");
      formatted.push(
        <p key={idx} className="text-sm text-zinc-600 leading-relaxed mb-2">
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-black">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    }
    // Inline code `code`
    else if (line.includes("`") && !line.startsWith("```")) {
      const parts = line.split("`");
      formatted.push(
        <p key={idx} className="text-sm text-zinc-600 leading-relaxed mb-2">
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <code key={i} className="bg-black/5 px-1 py-0.5 rounded font-mono text-xs">
                {part}
              </code>
            ) : (
              part
            )
          )}
        </p>
      );
    }
    // Regular paragraph
    else if (line.trim().length > 0) {
      formatted.push(
        <p key={idx} className="text-sm text-zinc-600 leading-relaxed mb-2">
          {line}
        </p>
      );
    }
    // Empty line (spacing)
    else {
      formatted.push(<div key={idx} className="h-2" />);
    }
  });

  return formatted;
}
