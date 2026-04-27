"use client";

import { useState, useEffect, Suspense } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

function AcceptInviteForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) router.replace(`/${locale}/login`);
  }, [token, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.auth.acceptInvite(token, password);
      localStorage.setItem("ns_token", res.token);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
        <p className="font-medium text-foreground">You're all set!</p>
        <p className="mt-2 text-sm text-muted-foreground">Your account is ready. Head to the dashboard to get started.</p>
        <Button className="mt-6 w-full" onClick={() => router.push(`/${locale}/dashboard`)}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
        <Input
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm password</label>
        <Input
          required
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" disabled={submitting || !token} size="lg">
        {submitting ? "Setting up…" : "Create Account"}
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl">NorthShift Jobs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set up your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a password to activate your recruiter account.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>}>
              <AcceptInviteForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Link expired?{" "}
          <Link href="mailto:hello@northshift.ca" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
