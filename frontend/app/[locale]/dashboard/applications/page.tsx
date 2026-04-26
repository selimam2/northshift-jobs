"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ApplicationSummary, ApplicationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  New: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200" },
  Reviewed: { label: "Reviewed", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  Shortlisted: { label: "Shortlisted", className: "bg-purple-100 text-purple-700 border-purple-200" },
  Hired: { label: "Hired", className: "bg-green-100 text-green-700 border-green-200" },
  Rejected: { label: "Rejected", className: "bg-muted text-muted-foreground border-border" },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function ApplicationsList() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? undefined;

  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.applications.getAll(t, listingId)
      .then(setApps)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [locale, router, listingId]);

  const listingTitle = apps[0]
    ? (apps[0].listingTitleEn ?? apps[0].listingTitleFr ?? "Listing")
    : listingId ? "Listing" : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Applications</h1>
          {listingTitle && (
            <p className="mt-1 text-sm text-muted-foreground">Filtered to: {listingTitle}</p>
          )}
        </div>
        {listingId && (
          <Link
            href={`/${locale}/dashboard/applications`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-lg border border-border py-16 text-center">
          <p className="text-muted-foreground">No applications yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Applicant</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide sm:table-cell">Listing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide md:table-cell">Available</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide lg:table-cell">Submitted</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apps.map((app) => (
                <tr
                  key={app.id}
                  className="cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => router.push(`/${locale}/dashboard/applications/${app.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{app.applicantName}</div>
                    <div className="text-xs text-muted-foreground">{app.applicantEmail}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {app.listingTitleEn ?? app.listingTitleFr ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {new Date(app.availabilityDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(app.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-3 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>}>
      <ApplicationsList />
    </Suspense>
  );
}
