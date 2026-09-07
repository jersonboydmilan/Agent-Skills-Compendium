"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Primary navigation. Split out as a client component purely so the current
 * section can be marked — without it a visitor has no idea where they are.
 */
export function NavLinks({ items, variant }: { items: NavItem[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname() ?? "/";

  if (variant === "mobile") {
    return (
      <>
        {items.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 pb-0.5 font-mono text-[0.75rem] tracking-[0.04em] ${
                current
                  ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                  : "border-transparent text-[var(--color-ink-muted)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {items.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`border-b-2 pb-0.5 font-mono text-[0.75rem] tracking-[0.04em] transition-colors ${
              current
                ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
