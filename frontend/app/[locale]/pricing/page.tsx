import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLANS: {
  key: string;
  listings: number | null;
  recruiters: number | null;
  featured: boolean;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
}[] = [
  {
    key: "small",
    listings: 3,
    recruiters: 1,
    featured: false,
    priceMonthly: 99,
    priceAnnual: 79,
  },
  {
    key: "medium",
    listings: 10,
    recruiters: 3,
    featured: false,
    priceMonthly: 249,
    priceAnnual: 199,
    popular: true,
  },
  {
    key: "large",
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
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
              <span className="text-4xl font-bold text-foreground">${plan.priceMonthly}</span>
              <span className="ml-1 text-sm text-muted-foreground">{t("perMonth")}</span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("annual", { price: plan.priceAnnual })}
              </p>
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

            <Link href={`/${locale}/login`}>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {t("getStarted")}
              </Button>
            </Link>
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
