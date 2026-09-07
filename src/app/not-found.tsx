import type { Metadata } from "next";
import Link from "next/link";
import { Label } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-24">
      <Label>404</Label>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.02em]">No such capability</h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] text-[var(--color-ink-muted)]">
        The skill, category or layer you asked for is not in the registry. Slugs are stable
        identifiers, so a broken link usually means the entry was never published rather than that it
        moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/skills"
          className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--color-paper)]"
        >
          BROWSE THE REGISTRY
        </Link>
        <Link
          href="/"
          className="border border-[var(--color-rule-strong)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em]"
        >
          HOME
        </Link>
      </div>
    </div>
  );
}
