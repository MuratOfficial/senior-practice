"use client";

import { useState, useTransition } from "react";
import { Check, Link2, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor, type CodeEditorLanguage } from "@/components/code-editor";
import { ConsolePanel } from "@/features/sandbox/console-panel";
import { useSandbox } from "@/features/sandbox/use-sandbox";
import { transpileTs } from "@/features/sandbox/transpile";
import {
  DEFAULT_TIMEOUT_MS,
  PYTHON_TIMEOUT_MS,
} from "@/features/sandbox/types";
import { saveSnippet } from "./actions";

const STARTERS: Record<CodeEditorLanguage, string> = {
  javascript: `// Свободное пространство: код выполняется в браузере.\nconsole.log("Привет, Senior Practice!");\n`,
  typescript: `// TypeScript транспилируется esbuild прямо в браузере.\ninterface User {\n  name: string;\n}\nconst user: User = { name: "Senior" };\nconsole.log(user.name);\n`,
  python: `# Python выполняется через Pyodide (CPython в WebAssembly).\nprint("Привет, Senior Practice!")\n`,
};

const LANGUAGE_LABELS: Record<CodeEditorLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

export function PlaygroundClient({
  initialLanguage,
  initialCode,
}: {
  initialLanguage: CodeEditorLanguage | null;
  initialCode: string | null;
}) {
  const sandbox = useSandbox();
  const [isSaving, startSave] = useTransition();

  const [language, setLanguage] = useState<CodeEditorLanguage>(
    initialLanguage ?? "javascript"
  );
  const [codeByLang, setCodeByLang] = useState<
    Record<CodeEditorLanguage, string>
  >(() => ({
    ...STARTERS,
    ...(initialLanguage && initialCode ? { [initialLanguage]: initialCode } : {}),
  }));
  const code = codeByLang[language];

  const [error, setError] = useState<string | null>(null);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRun() {
    setError(null);
    sandbox.clearConsole();

    let prepared = code;
    if (language !== "python") {
      try {
        prepared = await transpileTs(code);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка компиляции");
        return;
      }
    }

    const outcome = await sandbox.run(
      language === "python" ? "python" : "javascript",
      prepared,
      [],
      language === "python" ? PYTHON_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
    );
    if (!outcome.ok) setError(outcome.error);
  }

  function handleShare() {
    startSave(async () => {
      setError(null);
      const result = await saveSnippet({ language, code });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const url = `${window.location.origin}/playground?s=${result.id}`;
      setSharedUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // буфер обмена недоступен — ссылка показана текстом
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(STARTERS) as CodeEditorLanguage[]).map((l) => (
          <Button
            key={l}
            variant={l === language ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLanguage(l)}
          >
            {LANGUAGE_LABELS[l]}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Очистить"
            onClick={() =>
              setCodeByLang((prev) => ({ ...prev, [language]: "" }))
            }
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={handleShare}
          >
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copied ? "Скопировано" : "Поделиться"}
          </Button>
          <Button size="sm" disabled={sandbox.running} onClick={handleRun}>
            <Play className="size-4" />
            Запустить
          </Button>
        </div>
      </div>

      <CodeEditor
        language={language}
        value={code}
        onChange={(value) =>
          setCodeByLang((prev) => ({ ...prev, [language]: value }))
        }
        height="480px"
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {sharedUrl && (
        <p className="break-all rounded-lg border bg-accent/30 p-3 font-mono text-xs">
          {sharedUrl}
        </p>
      )}

      <ConsolePanel lines={sandbox.consoleLines} status={sandbox.status} />
    </div>
  );
}
