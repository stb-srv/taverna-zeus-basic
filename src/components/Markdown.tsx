import { Fragment, type ReactNode } from "react";

/** Renders inline **bold** segments within a line. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Minimal, dependency-free Markdown for CMS page content.
 * Supports `##`/`###` headings, `**bold**`, and paragraphs with soft line breaks.
 */
export default function Markdown({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className="prose-content max-w-none">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("### ")) {
          return <h3 key={i}>{inline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={i}>{inline(trimmed.slice(3))}</h2>;
        }
        const lines = trimmed.split("\n");
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {inline(line)}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
