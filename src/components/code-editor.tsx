"use client";

import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

export type CodeEditorLanguage = "javascript" | "typescript" | "python";

export function CodeEditor({
  language,
  value,
  onChange,
  height = "420px",
}: {
  language: CodeEditorLanguage;
  value: string;
  onChange: (value: string) => void;
  height?: string;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="overflow-hidden rounded-lg border">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        loading={<Skeleton style={{ height }} className="w-full" />}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
