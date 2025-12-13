"use client";

import { useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/themes/prism.css";

const languageMap: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  json: "json",
  tsx: "tsx",
  shell: "bash",
};

type Props = {
  code: string;
  language?: string;
};

export function CodeViewer({ code, language }: Props) {
  const [copied, setCopied] = useState(false);
  const normalized = language
    ? languageMap[language.toLowerCase()] ?? language.toLowerCase()
    : "typescript";
  const grammar = Prism.languages[normalized] ?? Prism.languages.typescript;
  const lines = code.split("\n");

  const highlighted = useMemo(() => {
    return Prism.highlight(code, grammar, normalized);
  }, [code, grammar, normalized]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-white">
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
        >
          edit
        </button>
        <button
          onClick={handleCopy}
          className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
          type="button"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="flex bg-white text-[11px] font-mono leading-snug" style={{ fontSize: "0.72rem" }}>
        <ol className="select-none bg-white px-4 py-4 text-right text-muted-foreground">
          {lines.map((_, index) => (
            <li key={index} className="h-4 leading-snug">
              {index + 1}
            </li>
          ))}
        </ol>
        <pre
          className={`language-${normalized} overflow-x-auto p-4 pr-16 text-muted-foreground`}
          tabIndex={0}
          style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
        >
          <code
            className={`language-${normalized}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
            style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
          />
        </pre>
      </div>
    </div>
  );
}
