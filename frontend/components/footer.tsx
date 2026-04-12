"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { MapPin } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const locale = useLocale();

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>NorthShift Jobs</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("tagline")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("applyNote")}</p>
          </div>

          {/* For Nurses */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("forNurses")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/${locale}/jobs`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("browse")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/alerts`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("alerts")}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("forEmployers")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("postJob")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("company")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
