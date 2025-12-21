"use client";

import { useEffect, useMemo, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/themes/prism.css";
import { apiFetch } from "@/lib/client-api";

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
  noteId?: string;
};

export function CodeViewer({ code, language, noteId }: Props) {
  const [copied, setCopied] = useState(false);
  const [currentCode, setCurrentCode] = useState(code);
  const [draft, setDraft] = useState(code);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const normalized = language
    ? languageMap[language.toLowerCase()] ?? language.toLowerCase()
    : "typescript";
  const grammar = Prism.languages[normalized] ?? Prism.languages.typescript;
  const displayValue = isEditing ? draft : currentCode;
  const lines = displayValue.split("\n");
  const MIN_LINES = 6;
  const LINE_HEIGHT_EM = 1.6;
  const editorHeight = `${Math.max(lines.length + 3, MIN_LINES) * LINE_HEIGHT_EM}em`;

  useEffect(() => {
    setCurrentCode(code);
    setDraft(code);
    setIsEditing(false);
    setError(null);
  }, [code]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const highlighted = useMemo(() => {
    if (!mounted) {
      return currentCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    return Prism.highlight(currentCode, grammar, normalized);
  }, [currentCode, grammar, normalized, mounted]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }

  const canEdit = Boolean(noteId);

  async function handleSave() {
    if (!noteId) return;
    if (!draft.trim()) {
      setError("コードを入力してください");
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiFetch("/api/notes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId,
          code: draft,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "コードの更新に失敗しました");
      }
      setCurrentCode(draft);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "コードの更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDraft(currentCode);
    setIsEditing(false);
    setError(null);
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-white">
      <div className="absolute right-3 top-3 flex gap-2">
        {canEdit && (
          isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                disabled={isSaving}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground"
                disabled={isSaving}
              >
                {isSaving ? "saving..." : "save"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setDraft(currentCode);
                setError(null);
              }}
              className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              edit
            </button>
          )
        )}
        <button
          onClick={handleCopy}
          className="rounded border border-border bg-white/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
          type="button"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="flex bg-white text-[11px] font-mono leading-snug" style={{ fontSize: "0.72rem" }}>
        <ol
          className="select-none bg-white px-4 py-4 text-right text-muted-foreground"
          style={{ lineHeight: `${LINE_HEIGHT_EM}em` }}
        >
          {lines.map((_, index) => (
            <li key={index}>{index + 1}</li>
          ))}
        </ol>
        {isEditing ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full flex-1 border-l border-border/70 bg-white p-4 font-mono text-[0.72rem] leading-snug text-foreground outline-none"
            spellCheck="false"
            wrap="off"
            style={{
              height: editorHeight,
              lineHeight: `${LINE_HEIGHT_EM}em`,
              whiteSpace: "pre",
            }}
          />
        ) : (
          <pre
            className={`language-${normalized} overflow-x-auto p-4 pr-16 text-muted-foreground`}
            tabIndex={0}
            style={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              lineHeight: `${LINE_HEIGHT_EM}em`,
            }}
          >
            <code
              className={`language-${normalized}`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
            />
          </pre>
        )}
      </div>
      {error && <p className="px-4 py-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
