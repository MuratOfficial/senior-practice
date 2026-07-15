import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

/**
 * Серверный markdown-рендер: GFM (таблицы) + подсветка кода.
 * Кодовые блоки всегда тёмные (тема github-dark-dimmed, см. globals.css).
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-pre:bg-[#22272e] prose-pre:text-[#adbac7]",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-table:overflow-x-auto",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
