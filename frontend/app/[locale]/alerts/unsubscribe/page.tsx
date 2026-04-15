"use client";

import { useState, useEffect, Suspense } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function UnsubscribeContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    setStatus("loading");
    api.alerts.unsubscribe(token)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Unsubscribing…</p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <p className="font-medium text-foreground">You're unsubscribed</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You won't receive any more job alert emails from NorthShift.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={`/${locale}/alerts`}>
            <Button variant="outline" className="w-full">Re-subscribe</Button>
          </Link>
          <Link href={`/${locale}/jobs`}>
            <Button variant="ghost" className="w-full">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
      <p className="font-medium text-foreground">Link invalid or already used</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This unsubscribe link has already been used or is no longer valid.
      </p>
      <Link href={`/${locale}/jobs`}>
        <Button variant="outline" className="mt-6 w-full">Browse Jobs</Button>
      </Link>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl">NorthShift Jobs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Job Alert Preferences
          </h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }>
            <UnsubscribeContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
