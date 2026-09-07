"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  slug: string;
  yaml: string;
  json: string;
}

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportActions({ slug, yaml, json }: Props) {
  const [copied, setCopied] = useState<"yaml" | "json" | null>(null);
  const [shown, setShown] = useState<"yaml" | "json" | null>(null);
  const [blocked, setBlocked] = useState(false);

  const copy = async (format: "yaml" | "json") => {
    const text = format === "yaml" ? yaml : json;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      window.setTimeout(() => setCopied(null), 1800);
      track({ name: "skill_copy", slug, format });
    } catch {
      // Clipboard unavailable (insecure context, or the user denied it). Reveal the
      // raw text so the definition is still obtainable by hand.
      setShown(format);
      setBlocked(true);
      window.setTimeout(() => setBlocked(false), 6000);
    }
  };

  const save = (format: "yaml" | "json") => {
    download(
      `${slug}.${format}`,
      format === "yaml" ? yaml : json,
      format === "yaml" ? "text/yaml" : "application/json",
    );
    track({ name: "skill_download", slug, format });
  };

  const button =
    "border border-[var(--color-rule)] px-2.5 py-1.5 font-mono text-[0.6875rem] tracking-[0.06em] transition-colors hover:border-[var(--color-ink)]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => copy("yaml")}>
          {copied === "yaml" ? "COPIED" : "COPY YAML"}
        </button>
        <button type="button" className={button} onClick={() => copy("json")}>
          {copied === "json" ? "COPIED" : "COPY JSON"}
        </button>
        <button type="button" className={button} onClick={() => save("yaml")}>
          ↓ .YAML
        </button>
        <button type="button" className={button} onClick={() => save("json")}>
          ↓ .JSON
        </button>
        <button
          type="button"
          className={button}
          onClick={() => setShown((s) => (s ? null : "yaml"))}
          aria-expanded={shown !== null}
          aria-controls="raw-definition"
        >
          {shown ? `HIDE ${shown.toUpperCase()}` : "VIEW RAW"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? `${copied.toUpperCase()} definition copied to the clipboard.` : ""}
      </p>
      {blocked ? (
        <p className="text-[0.875rem] text-[var(--color-ink-muted)]">
          Your browser would not give this page the clipboard. The definition is shown below —
          select it there, or use the download buttons.
        </p>
      ) : null}
      {shown ? (
        <pre
          id="raw-definition"
          className="max-h-[28rem] overflow-auto border border-[var(--color-rule)] bg-[var(--color-raised)] p-4 font-mono text-[0.75rem] leading-relaxed"
        >
          <code>{shown === "yaml" ? yaml : json}</code>
        </pre>
      ) : null}
    </div>
  );
}
