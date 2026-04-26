"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [token, setToken] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
  }, [locale, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = "Current password is required.";
    if (next.length < 8) e.next = "New password must be at least 8 characters.";
    if (next !== confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.auth.changePassword(current, next, token);
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Change Password</h1>

      <Card>
        <CardContent className="pt-6">
          {success ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-accent" />
              <h2 className="font-semibold text-foreground">Password updated</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your password has been changed successfully.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSuccess(false)}>
                Change again
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Current Password</label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className={errors.current ? "border-destructive" : ""}
                />
                {errors.current && <p className="mt-1 text-xs text-destructive">{errors.current}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className={errors.next ? "border-destructive" : ""}
                />
                {errors.next
                  ? <p className="mt-1 text-xs text-destructive">{errors.next}</p>
                  : <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters</p>
                }
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={errors.confirm ? "border-destructive" : ""}
                />
                {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>}
              </div>

              {submitError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <Button type="submit" disabled={submitting} className="mt-1">
                {submitting ? "Updating…" : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
