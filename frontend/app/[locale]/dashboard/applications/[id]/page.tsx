"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import type { ApplicationDetail, ApplicationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, FileText } from "lucide-react";

const STATUS_OPTIONS: ApplicationStatus[] = ["New", "Reviewed", "Shortlisted", "Hired", "Rejected"];

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  New: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200" },
  Reviewed: { label: "Reviewed", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  Shortlisted: { label: "Shortlisted", className: "bg-purple-100 text-purple-700 border-purple-200" },
  Hired: { label: "Hired", className: "bg-green-100 text-green-700 border-green-200" },
  Rejected: { label: "Rejected", className: "bg-muted text-muted-foreground border-border" },
};

const PROVINCE_LABELS: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland & Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.applications.getById(id, t)
      .then(setApp)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, locale, router]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!app || newStatus === app.status) return;
    setStatusUpdating(true);
    try {
      await api.applications.updateStatus(id, newStatus, token);
      setApp((prev) => prev ? {
        ...prev,
        status: newStatus,
        statusLogs: [
          ...prev.statusLogs,
          { fromStatus: prev.status, toStatus: newStatus, changedAt: new Date().toISOString(), changedBy: "You" },
        ],
      } : prev);
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDownloadResume = async () => {
    setResumeLoading(true);
    try {
      const { url } = await api.applications.getResumeUrl(id, token);
      window.open(url, "_blank");
    } catch {
      alert("Could not load resume. Please try again.");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setNoteSubmitting(true);
    try {
      await api.applications.addNote(id, noteBody, token);
      setApp((prev) => prev ? {
        ...prev,
        notes: [
          ...prev.notes,
          { id: crypto.randomUUID(), body: noteBody, createdAt: new Date().toISOString(), writtenBy: "You" },
        ],
      } : prev);
      setNoteBody("");
    } catch {
      alert("Failed to save note. Please try again.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground">Application not found.</p>
        <Link href={`/${locale}/dashboard/applications`}>
          <Button variant="outline" className="mt-4">Back to Applications</Button>
        </Link>
      </div>
    );
  }

  const listingTitle = app.listingTitleEn ?? app.listingTitleFr ?? "Listing";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard/applications`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Applications
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{app.applicantName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listingTitle}</p>
        </div>

        {/* Status selector */}
        <div className="shrink-0">
          <select
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            disabled={statusUpdating}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Applicant info */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Applicant</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="mt-0.5 text-foreground">
                  <a href={`mailto:${app.applicantEmail}`} className="hover:underline">{app.applicantEmail}</a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Available From</dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(app.availabilityDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Applied</dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(app.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
            </dl>

            {app.licences.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Licences</h3>
                <div className="space-y-2">
                  {app.licences.map((lic, i) => (
                    <div key={i} className="flex flex-wrap gap-4 text-sm">
                      <span className="text-foreground font-medium">{PROVINCE_LABELS[lic.province] ?? lic.province}</span>
                      {lic.licenceNumber && <span className="text-muted-foreground">#{lic.licenceNumber}</span>}
                      {lic.expiry && (
                        <span className="text-muted-foreground">
                          Exp. {new Date(lic.expiry).toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {app.coverMessage && (
              <>
                <Separator className="my-4" />
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Message</h3>
                <p className="text-sm text-foreground whitespace-pre-line">{app.coverMessage}</p>
              </>
            )}

            <Separator className="my-4" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadResume}
              disabled={resumeLoading}
              className="gap-2"
            >
              {resumeLoading ? (
                "Loading…"
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Resume
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
            {app.notes.length > 0 ? (
              <div className="mb-4 space-y-3">
                {app.notes.map((note) => (
                  <div key={note.id} className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-foreground">{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.writtenBy} · {new Date(note.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-muted-foreground">No notes yet.</p>
            )}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <Button type="submit" size="sm" disabled={noteSubmitting || !noteBody.trim()} className="self-end">
                {noteSubmitting ? "…" : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status history */}
        {app.statusLogs.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
              <div className="space-y-2">
                {app.statusLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{log.changedBy}</span>
                    <span>moved from</span>
                    <span className="font-medium">{log.fromStatus}</span>
                    <span>→</span>
                    <span className="font-medium">{log.toStatus}</span>
                    <span className="ml-auto">
                      {new Date(log.changedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
