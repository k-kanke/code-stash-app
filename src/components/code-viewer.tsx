"use client";

import { useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-javascript";
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
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide">{language ?? normalized}</span>
        <button
          onClick={handleCopy}
          className="rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-wide"
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={`language-${normalized} overflow-x-auto bg-card p-4 text-[13px] leading-relaxed`}
        tabIndex={0}
      >
        <code
          className={`language-${normalized}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}
