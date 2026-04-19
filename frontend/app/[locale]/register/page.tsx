"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle } from "lucide-react";

function RegisterForm() {
  const locale = useLocale();
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If already logged in, go to dashboard
  useEffect(() => {
    const token = localStorage.getItem("ns_token");
    if (token) router.replace(`/${locale}/dashboard`);
  }, [locale, router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!orgName.trim() || orgName.trim().length < 2) e.orgName = "Organisation name is required.";
    if (!name.trim() || name.trim().length < 2) e.name = "Your name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const { token } = await api.auth.register({ orgName, name, email, password });
      localStorage.setItem("ns_token", token);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.toLowerCase().includes("already registered") || msg.includes("409") || msg.toLowerCase().includes("conflict")) {
        router.push(`/${locale}/login?email=${encodeURIComponent(email)}&notice=exists`);
        return;
      }
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Organisation Name *</label>
        <Input
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Northern Health Authority"
          className={errors.orgName ? "border-destructive" : ""}
        />
        {errors.orgName && <p className="mt-1 text-xs text-destructive">{errors.orgName}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Your Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Work Email *</label>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@yourorg.ca"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Password *</label>
        <Input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password
          ? <p className="mt-1 text-xs text-destructive">{errors.password}</p>
          : <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters</p>
        }
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting} size="lg" className="mt-1">
        {submitting ? "Creating account…" : "Create Account"}
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
