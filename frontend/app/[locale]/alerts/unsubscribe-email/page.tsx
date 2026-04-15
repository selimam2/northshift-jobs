"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2 } from "lucide-react";

export default function UnsubscribeEmailPage() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.alerts.sendUnsubscribeLink(email);
    } finally {
      setDone(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl">NorthShift Jobs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Unsubscribe from Job Alerts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send you an unsubscribe link.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {done ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="font-medium text-foreground">Check your email</p>
              <p className="mt-2 text-sm text-muted-foreground">
                If that address is subscribed, you'll receive an unsubscribe link shortly.
              </p>
              <Link href={`/${locale}/jobs`}>
                <Button variant="outline" className="mt-6 w-full">Browse Jobs</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email address
                </label>
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? "Sending…" : "Send Unsubscribe Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
