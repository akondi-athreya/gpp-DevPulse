"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { AlertCircle, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import Editor from "@monaco-editor/react";

type TagType = {
  id: string;
  name: string;
  color: string;
};

type SubmitFormProps = {
  availableTags: TagType[];
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

const EditorLoadingSkeleton = () => (
  <div className="w-full h-[400px] bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 rounded-2xl animate-pulse">
    <div className="flex items-center gap-3 text-zinc-400 text-sm">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <span>Loading IDE editor...</span>
    </div>
  </div>
);

export default function SubmitForm({ availableTags }: SubmitFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [difficultyTag, setDifficultyTag] = useState("BEGINNER");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs">("vs-dark");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = mediaQuery.matches ? "vs-dark" : "vs";

    requestAnimationFrame(() => {
      setEditorTheme(initialTheme);
    });

    const handleChange = (e: MediaQueryListEvent) => {
      setEditorTheme(e.matches ? "vs-dark" : "vs");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      if (selectedTagIds.length >= 5) {
        setError("You can select a maximum of 5 tags");
        return;
      }
      setError("");
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !codeContent || !language || !difficultyTag) {
      setError("Please fill in all required fields");
      return;
    }
    if (selectedTagIds.length < 1) {
      setError("Please select at least 1 tag");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          codeContent,
          language,
          difficultyTag,
          tagIds: selectedTagIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create submission");
      } else {
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/feed"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Back to feed</span>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-white/10 relative shadow-2xl">
        <div className="border-b border-zinc-200/50 pb-5 mb-6 dark:border-zinc-800/50">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Request Code Review
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Submit a code snippet to get feedback from other senior developers.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Submission Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Optimizing Prisma Query Performance in Next.js Server Components"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              Min 10 characters, max 200 characters. Make it descriptive.
            </p>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Programming Language *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty tag */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Difficulty Level *
              </label>
              <select
                value={difficultyTag}
                onChange={(e) => setDifficultyTag(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Context & Explanation *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide some background context, what this code is supposed to do, and what specific reviews or help you are looking for."
              className="w-full px-4 py-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              Min 20 characters, max 2000 characters. Markdown is supported.
            </p>
          </div>

          {/* Code Content */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Code Content *
            </label>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-lg">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {/* macOS window controls */}
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                    main.{mapLanguageToMonaco(language) === "typescript" ? "ts" : mapLanguageToMonaco(language) === "javascript" ? "js" : mapLanguageToMonaco(language)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                    {language}
                  </span>
                </div>
              </div>

              {/* Editor Instance */}
              <div className="p-1 dark:bg-zinc-950 bg-white">
                <Editor
                  height="400px"
                  language={mapLanguageToMonaco(language)}
                  value={codeContent}
                  onChange={(val) => setCodeContent(val || "")}
                  theme={editorTheme}
                  loading={<EditorLoadingSkeleton />}
                  options={{
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    padding: { top: 12, bottom: 12 },
                    wordWrap: "on",
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Min 10 characters, max 50000 characters. Auto-formatted keywords.
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                {codeContent.length.toLocaleString()} / 50,000 chars
              </p>
            </div>
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Tags * <span className="text-xs font-normal text-zinc-400">(Select 1 to 5 tags)</span>
            </label>
            <div className="flex flex-wrap gap-2.5 mt-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      borderColor: isSelected ? tag.color : "transparent",
                      backgroundColor: isSelected ? `${tag.color}15` : undefined,
                      color: isSelected ? tag.color : undefined,
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
                      isSelected
                        ? "shadow-sm border border-zinc-400"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl gradient-bg hover:opacity-90 active:scale-[0.98] transition-all text-white font-bold text-sm disabled:opacity-50 mt-4 shadow-lg shadow-indigo-500/25"
          >
            {loading ? (
              "Publishing submission..."
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Code Review Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
