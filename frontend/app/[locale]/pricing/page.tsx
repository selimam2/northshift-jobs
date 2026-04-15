"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

const PLANS: {
  key: string;
  tier: string;
  listings: number | null;
  recruiters: number | null;
  featured: boolean;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
}[] = [
  {
    key: "small",
    tier: "Small",
    listings: 3,
    recruiters: 1,
    featured: false,
    priceMonthly: 99,
    priceAnnual: 79,
  },
  {
    key: "medium",
    tier: "Medium",
    listings: 10,
    recruiters: 3,
    featured: false,
    priceMonthly: 249,
    priceAnnual: 199,
    popular: true,
  },
  {
    key: "large",
    tier: "Large",
    listings: null,
    recruiters: null,
    featured: true,
    priceMonthly: 599,
    priceAnnual: 479,
  },
];

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const locale = useLocale();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleGetStarted(tier: string) {
    const token = localStorage.getItem("ns_token");
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    setLoading(tier);
    try {
      const { url } = await api.stripe.createCheckout(tier, isAnnual, token);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              !isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual <span className="ml-1 text-xs text-primary font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-xl border bg-card p-6 flex flex-col ${
              plan.popular ? "border-primary shadow-lg" : "border-border"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
                {t("popular")}
              </Badge>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{t(`${plan.key}Name`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`${plan.key}Desc`)}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">
                ${isAnnual ? plan.priceAnnual : plan.priceMonthly}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">{t("perMonth")}</span>
              {isAnnual && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Billed ${plan.priceAnnual * 12}/year
                </p>
              )}
            </div>

            <ul className="mb-8 space-y-2.5 flex-1">
              <Feature
                text={
                  plan.listings === null
                    ? t("unlimitedListings")
                    : t("listings", { count: plan.listings })
                }
              />
              <Feature
                text={
                  plan.recruiters === null
                    ? t("unlimitedRecruiters")
                    : t("recruiters", { count: plan.recruiters })
                }
              />
              {plan.featured && <Feature text={t("featuredSlots")} />}
              <Feature text={t("applicantEmails")} />
              <Feature text={t("bilingualSupport")} />
            </ul>

            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              disabled={loading === plan.tier}
              onClick={() => handleGetStarted(plan.tier)}
            >
              {loading === plan.tier ? "Redirecting…" : t("getStarted")}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">{t("trialNote")}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      {text}
    </li>
  );
}
