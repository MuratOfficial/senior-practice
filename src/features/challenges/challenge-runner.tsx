"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleX,
  EyeOff,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeEditor, type CodeEditorLanguage } from "@/components/code-editor";
import { ConsolePanel } from "@/features/sandbox/console-panel";
import { useSandbox } from "@/features/sandbox/use-sandbox";
import { transpileTs } from "@/features/sandbox/transpile";
import {
  DEFAULT_TIMEOUT_MS,
  PYTHON_TIMEOUT_MS,
  type SandboxTest,
  type TestResult,
} from "@/features/sandbox/types";
import { submitChallenge } from "./actions";

interface RunnerLanguage {
  id: "javascript" | "python";
  starter: string;
  tests: SandboxTest[];
}

export function ChallengeRunner({
  slug,
  languages,
}: {
  slug: string;
  languages: RunnerLanguage[];
}) {
  const router = useRouter();
  const sandbox = useSandbox();
  const [isSubmitting, startSubmit] = useTransition();

  const [langId, setLangId] = useState(languages[0].id);
  const lang = useMemo(
    () => languages.find((l) => l.id === langId) ?? languages[0],
    [languages, langId]
  );
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>(() =>
    Object.fromEntries(languages.map((l) => [l.id, l.starter]))
  );
  const code = codeByLang[lang.id] ?? lang.starter;

  const [results, setResults] = useState<TestResult[] | null>(null);
  const [phase, setPhase] = useState<"run" | "submit" | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const editorLanguage: CodeEditorLanguage =
    lang.id === "python" ? "python" : "typescript";
  const timeoutMs = lang.id === "python" ? PYTHON_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  async function prepareCode(): Promise<string | null> {
    if (lang.id === "python") return code;
    try {
      // JS — валидный TS: всегда прогоняем через esbuild (срезает типы)
      return await transpileTs(code);
    } catch (error) {
      setRunError(
        error instanceof Error ? error.message : "Ошибка компиляции"
      );
      return null;
    }
  }

  async function execute(tests: SandboxTest[], kind: "run" | "submit") {
    setRunError(null);
    setSubmitStatus(null);
    setResults(null);
    sandbox.clearConsole();

    const prepared = await prepareCode();
    if (prepared === null) return null;

    const outcome = await sandbox.run(lang.id, prepared, tests, timeoutMs);
    if (!outcome.ok) {
      setRunError(outcome.error);
      setPhase(kind);
      return null;
    }
    setResults(outcome.tests);
    setPhase(kind);
    return outcome;
  }

  function handleRun() {
    void execute(lang.tests.filter((t) => !t.hidden), "run");
  }

  function handleSubmit() {
    startSubmit(async () => {
      const outcome = await execute(lang.tests, "submit");
      const passed = outcome ? outcome.tests.filter((t) => t.passed).length : 0;
      const response = await submitChallenge({
        slug,
        language: lang.id,
        code,
        passedTests: passed,
        totalTests: lang.tests.length,
        durationMs: outcome ? Math.round(outcome.durationMs) : null,
        hadError: !outcome,
      });
      if ("error" in response) {
        setRunError(response.error);
        return;
      }
      setSubmitStatus(response.status);
      router.refresh(); // открывает разбор и решение на сервере
    });
  }

  function handleReset() {
    setCodeByLang((prev) => ({ ...prev, [lang.id]: lang.starter }));
    setResults(null);
    setRunError(null);
    setSubmitStatus(null);
    sandbox.clearConsole();
  }

  const passedCount = results?.filter((r) => r.passed).length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {languages.length > 1 &&
          languages.map((l) => (
            <Button
              key={l.id}
              variant={l.id === lang.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLangId(l.id)}
            >
              {l.id === "python" ? "Python" : "JS / TS"}
            </Button>
          ))}
        {languages.length === 1 && (
          <Badge variant="outline">
            {lang.id === "python" ? "Python" : "JS / TS"}
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            aria-label="Сбросить к заготовке"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={sandbox.running || isSubmitting}
            onClick={handleRun}
          >
            <Play className="size-4" />
            Запустить
          </Button>
          <Button
            size="sm"
            disabled={sandbox.running || isSubmitting}
            onClick={handleSubmit}
          >
            <Send className="size-4" />
            Сдать
          </Button>
        </div>
      </div>

      <CodeEditor
        language={editorLanguage}
        value={code}
        onChange={(value) =>
          setCodeByLang((prev) => ({ ...prev, [lang.id]: value }))
        }
      />

      {runError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {runError}
        </div>
      )}

      {submitStatus && (
        <div
          className={
            submitStatus === "PASSED"
              ? "rounded-lg border border-green-600/40 bg-green-500/10 p-3 text-sm"
              : "rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm"
          }
        >
          {submitStatus === "PASSED"
            ? "Задача решена! Разбор и эталонное решение открыты ниже условия."
            : "Сдача записана. Разбор открыт ниже условия — но попробуйте ещё раз."}
        </div>
      )}

      {results && (
        <div className="space-y-1 rounded-lg border p-3">
          <p className="mb-2 text-sm font-medium">
            {phase === "run" ? "Открытые тесты" : "Все тесты"}: {passedCount} /{" "}
            {results.length}
          </p>
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {r.passed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
              ) : (
                <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <div>
                <span className="inline-flex items-center gap-1.5">
                  {r.hidden && <EyeOff className="size-3 text-muted-foreground" />}
                  {r.name}
                </span>
                {r.error && (
                  <p className="font-mono text-xs text-destructive">{r.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConsolePanel lines={sandbox.consoleLines} status={sandbox.status} />
    </div>
  );
}
