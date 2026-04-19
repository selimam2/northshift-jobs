"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle } from "lucide-react";

const TIER_LABELS: Record<string, string> = {
  Small: "Starter — $99/mo",
  Medium: "Growth — $249/mo",
  Large: "Enterprise — $599/mo",
};

function RegisterForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tier = searchParams.get("tier") ?? "";
  const annual = searchParams.get("annual") === "true";

  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, go straight to checkout or dashboard
  useEffect(() => {
    const token = localStorage.getItem("ns_token");
    if (!token) return;
    if (tier) {
      api.stripe.createCheckout(tier, annual, token)
        .then(({ url }) => { window.location.href = url; })
        .catch(() => router.replace(`/${locale}/dashboard`));
    } else {
      router.replace(`/${locale}/dashboard`);
    }
  }, [tier, annual, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      const { token } = await api.auth.register({ orgName, name, email, password });
      localStorage.setItem("ns_token", token);

      if (tier) {
        const { url } = await api.stripe.createCheckout(tier, annual, token);
        window.location.href = url;
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {tier && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Selected plan: <span className="font-semibold">{TIER_LABELS[tier] ?? tier}</span>
          {annual && <span className="ml-1 text-xs text-primary">(annual)</span>}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Organisation Name *</label>
        <Input
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Northern Health Authority"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Your Name *</label>
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Work Email *</label>
        <Input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@yourorg.ca"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Password *</label>
        <Input
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting} size="lg" className="mt-1">
        {submitting
          ? (tier ? "Creating account…" : "Creating account…")
          : (tier ? "Create Account & Continue to Checkout" : "Create Account")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xl">NorthShift Jobs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Post contract nursing roles and manage applicants.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>}>
              <RegisterForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          14-day free trial · Card required · Cancel anytime
        </p>
      </div>
    </div>
  );
}
