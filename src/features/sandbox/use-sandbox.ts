"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RunOutcome,
  RunRequest,
  SandboxEvent,
  SandboxLanguage,
  SandboxTest,
} from "./types";

export interface ConsoleLine {
  level: "log" | "warn" | "error" | "info";
  text: string;
}

const MAX_CONSOLE_LINES = 500;

/**
 * Управляет скрытым sandboxed iframe (/sandbox/runner.html) и даёт
 * promise-API запуска кода. Console-вывод и статус — реактивные состояния.
 */
export function useSandbox() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(
    null
  );
  const pendingRef = useRef<Map<string, (outcome: RunOutcome) => void>>(
    new Map()
  );
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let resolveReady!: () => void;
    const promise = new Promise<void>((r) => {
      resolveReady = r;
    });
    readyRef.current = { promise, resolve: resolveReady };

    const iframe = document.createElement("iframe");
    iframe.src = "/sandbox/runner.html";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const pending = pendingRef.current;

    function onMessage(ev: MessageEvent) {
      if (ev.source !== iframe.contentWindow) return;
      const msg = ev.data as SandboxEvent;
      if (!msg || typeof msg !== "object" || !("kind" in msg)) return;

      switch (msg.kind) {
        case "sp-ready":
          resolveReady();
          break;
        case "sp-console":
          setConsoleLines((lines) =>
            [...lines, { level: msg.level, text: msg.text }].slice(
              -MAX_CONSOLE_LINES
            )
          );
          break;
        case "sp-status":
          setStatus(msg.text);
          break;
        case "sp-result": {
          setStatus(null);
          const resolve = pending.get(msg.id);
          if (resolve) {
            pending.delete(msg.id);
            resolve(
              msg.ok
                ? { ok: true, tests: msg.tests, durationMs: msg.durationMs }
                : { ok: false, error: msg.error }
            );
          }
          break;
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      iframe.remove();
      iframeRef.current = null;
      for (const resolve of pending.values()) {
        resolve({ ok: false, error: "Песочница закрыта" });
      }
      pending.clear();
    };
  }, []);

  const run = useCallback(
    async (
      language: SandboxLanguage,
      code: string,
      tests: SandboxTest[],
      timeoutMs: number
    ): Promise<RunOutcome> => {
      const iframe = iframeRef.current;
      const ready = readyRef.current;
      if (!iframe?.contentWindow || !ready) {
        return { ok: false, error: "Песочница не инициализирована" };
      }
      await ready.promise;

      const id = crypto.randomUUID();
      const request: RunRequest = {
        kind: "sp-run",
        id,
        language,
        code,
        tests,
        timeoutMs,
      };

      setRunning(true);
      try {
        return await new Promise<RunOutcome>((resolve) => {
          pendingRef.current.set(id, resolve);
          // страховка на случай гибели iframe: чуть больше таймаута воркера
          setTimeout(() => {
            if (pendingRef.current.delete(id)) {
              resolve({ ok: false, error: "Песочница не ответила" });
            }
          }, timeoutMs + 5_000);
          iframe.contentWindow!.postMessage(request, "*");
        });
      } finally {
        setRunning(false);
      }
    },
    []
  );

  const clearConsole = useCallback(() => setConsoleLines([]), []);

  return { run, running, status, consoleLines, clearConsole };
}
