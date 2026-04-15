"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email);
    } finally {
      // Always show success — never reveal whether the email exists
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
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {done ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="font-medium text-foreground">Check your email</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  If that address is registered, you'll receive a reset link within a minute. Check your spam folder too.
                </p>
                <Link href={`/${locale}/login`}>
                  <Button variant="outline" className="mt-6 w-full">Back to Login</Button>
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
                    placeholder="you@organization.ca"
                  />
                </div>
                <Button type="submit" disabled={submitting} size="lg">
                  {submitting ? "Sending…" : "Send Reset Link"}
                </Button>
                <Link href={`/${locale}/login`} className="text-center text-sm text-muted-foreground hover:text-foreground">
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
