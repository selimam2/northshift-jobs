"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Nav() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const otherLocale = locale === "en" ? "fr" : "en";
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-lg tracking-tight">NorthShift</span>
          <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
            Jobs
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href={`/${locale}/jobs`}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("findJobs")}
          </Link>
          <Link
            href={`/${locale}/alerts`}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("alerts")}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("login")}
          </Link>

          {/* Locale toggle */}
          <Link
            href={`/${otherLocale}`}
            className="ml-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {otherLocale.toUpperCase()}
          </Link>

          <Link href={`/${locale}/jobs`}>
            <Button size="sm" className="ml-2">
              {t("postJob")}
            </Button>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href={`/${locale}/jobs`}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {t("findJobs")}
            </Link>
            <Link
              href={`/${locale}/alerts`}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {t("alerts")}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {t("login")}
            </Link>
            <Link
              href={`/${otherLocale}`}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {otherLocale === "fr" ? "Français" : "English"}
            </Link>
            <Link href={`/${locale}/jobs`} onClick={() => setOpen(false)}>
              <Button size="sm" className="mt-1 w-full">
                {t("postJob")}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
