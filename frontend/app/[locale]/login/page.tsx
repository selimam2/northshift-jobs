"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle, Info } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const t = useTranslations("Login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefillEmail = searchParams.get("email") ?? "";
  const notice = searchParams.get("notice");

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { token } = await api.auth.login(email, password);
      localStorage.setItem("ns_token", token);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {notice === "exists" && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            An account with that email already exists. Log in below.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("email")}
            </label>
            <Input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.ca"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {t("password")}
              </label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} size="lg" className="mt-1">
            {submitting ? "…" : t("submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/register`}
            className="text-primary hover:underline"
          >
            {t("contactSales")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const t = useTranslations("Login");
  const locale = useLocale();

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl">NorthShift Jobs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Suspense fallback={<div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Looking for nursing jobs?{" "}
            <Link href={`/${locale}/jobs`} className="text-primary hover:underline">
              Browse positions
            </Link>{" "}
            — no account needed to apply.
          </p>
        </div>
      </div>
    </div>
  );
}
