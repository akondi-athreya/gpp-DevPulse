"use client";

import { useState, useEffect } from "react";
import { Code } from "lucide-react";
import Editor from "@monaco-editor/react";

type CodeViewerProps = {
  codeContent: string;
  language: string;
};

const mapLanguageToMonaco = (lang: string): string => {
  switch (lang) {
    case "C++":
      return "cpp";
    case "C#":
      return "csharp";
    case "HTML":
      return "html";
    case "CSS":
      return "css";
    case "SQL":
      return "sql";
    default:
      return lang.toLowerCase();
  }
};

const ViewerLoadingSkeleton = () => (
  <div className="w-full h-[500px] bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 rounded-2xl animate-pulse">
    <div className="flex items-center gap-3 text-zinc-400 text-sm">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span>Loading Code Viewer...</span>
    </div>
  </div>
);

export default function CodeViewer({ codeContent, language }: CodeViewerProps) {
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs">("vs-dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = mediaQuery.matches ? "vs-dark" : "vs";

    requestAnimationFrame(() => {
      setEditorTheme(initialTheme);
      setMounted(true);
    });

    const handleChange = (e: MediaQueryListEvent) => {
      setEditorTheme(e.matches ? "vs-dark" : "vs");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const monacoLanguage = mapLanguageToMonaco(language);

  // Fallback for SSR / static pre-rendering
  if (!mounted) {
    return (
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300">{language} Code Snippet</span>
          </div>
        </div>
        <pre className="p-5 overflow-x-auto text-xs leading-relaxed font-mono text-zinc-100 bg-zinc-950 whitespace-pre">
          <code>{codeContent}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-lg transition-all">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {/* macOS window controls */}
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
            main.{monacoLanguage === "typescript" ? "ts" : monacoLanguage === "javascript" ? "js" : monacoLanguage}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider font-mono">
            {language}
          </span>
        </div>
      </div>

      {/* Code Viewer Instance */}
      <div className="p-1 dark:bg-zinc-950 bg-white">
        <Editor
          height="500px"
          language={monacoLanguage}
          value={codeContent}
          theme={editorTheme}
          loading={<ViewerLoadingSkeleton />}
          options={{
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            minimap: { enabled: false },
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: true,
            domReadOnly: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            wordWrap: "on",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
