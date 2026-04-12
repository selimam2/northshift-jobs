"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function Nav() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const otherLocale = locale === "en" ? "fr" : "en";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <span className="tracking-tight">NorthShift</span>
        </Link>

        {/* Nav — always visible, abbreviated on mobile */}
        <nav className="flex items-center gap-1">
          <Link
            href={`/${locale}/jobs`}
            className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            <span className="sm:hidden">Jobs</span>
            <span className="hidden sm:inline">{t("findJobs")}</span>
          </Link>
          <Link
            href={`/${locale}/alerts`}
            className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t("alerts")}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            <span className="sm:hidden">Login</span>
            <span className="hidden sm:inline">{t("login")}</span>
          </Link>
          <Link
            href={`/${otherLocale}`}
            className="rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <Link href={`/${locale}/login`} className="ml-1">
            <Button size="sm">
              <span className="sm:hidden">Post</span>
              <span className="hidden sm:inline">{t("postJob")}</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
