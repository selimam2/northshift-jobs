"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, LayoutDashboard, FileText, Users, CreditCard, AlertTriangle, Lock } from "lucide-react";
import { api } from "@/lib/api";

type BillingInfo = {
  tier: string;
  status: string;
  isAnnual: boolean;
  expiresAt: string | null;
};

const TIER_LABELS: Record<string, string> = {
  Small: "Starter",
  Medium: "Growth",
  Large: "Enterprise",
};

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ns_token");
    if (!token) {
      router.replace(`/${locale}/login`);
      return;
    }
    api.stripe.getBilling(token).then(setBilling).catch(() => null);
  }, [locale, router]);

  const handleLogout = () => {
    localStorage.removeItem("ns_token");
    router.push(`/${locale}/login`);
  };

  const handleManageBilling = async () => {
    const token = localStorage.getItem("ns_token");
    if (!token) return;
    setPortalLoading(true);
    try {
      const { url } = await api.stripe.createPortal(token);
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  const statusBadgeVariant = (status: string) => {
    if (status === "Active") return "default";
    if (status === "Trialing") return "secondary";
    if (status === "PastDue") return "destructive";
    return "outline";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Active: t("statusActive"),
      Trialing: t("statusTrialing"),
      PastDue: t("statusPastDue"),
      Cancelled: t("statusCancelled"),
    };
    return map[status] ?? status;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Past due banner */}
      {billing?.status === "PastDue" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("pastDueBanner")}
          <button
            onClick={handleManageBilling}
            className="ml-auto font-medium underline underline-offset-2"
          >
            {t("manageBilling")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <div className="flex items-center gap-3">
          {billing?.status === "Active" || billing?.status === "Trialing" ? (
            <Link href={`/${locale}/dashboard/listings/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t("newListing")}
              </Button>
            </Link>
          ) : (
            <Link href={`/${locale}/pricing`}>
              <Button size="sm" className="gap-1.5">
                <Lock className="h-4 w-4" />
                Subscribe to Post
              </Button>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar nav */}
        <nav className="space-y-1">
          {[
            { label: t("listings"), icon: <FileText className="h-4 w-4" />, active: true },
            { label: t("applications"), icon: <LayoutDashboard className="h-4 w-4" />, active: false },
            { label: t("team"), icon: <Users className="h-4 w-4" />, active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Billing section in sidebar */}
          {billing && (
            <>
              <Separator className="my-3" />
              <div className="px-3 py-2">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("billing")}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">
                      {TIER_LABELS[billing.tier] ?? billing.tier}
                    </span>
                    <Badge variant={statusBadgeVariant(billing.status) as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                      {statusLabel(billing.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {billing.isAnnual ? t("annual") : t("monthly")}
                  </p>
                  {billing.expiresAt && billing.status === "Trialing" && (
                    <p className="text-xs text-muted-foreground">
                      {t("trialEndsOn", {
                        date: new Date(billing.expiresAt).toLocaleDateString(),
                      })}
                    </p>
                  )}
                  {billing.expiresAt && billing.status === "Active" && (
                    <p className="text-xs text-muted-foreground">
                      {t("renewsOn", {
                        date: new Date(billing.expiresAt).toLocaleDateString(),
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-center"
                >
                  {portalLoading ? "Opening…" : t("manageBilling")}
                </button>
              </div>
            </>
          )}

          {!billing && (
            <>
              <Separator className="my-3" />
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-2">No active plan</p>
                <Link href={`/${locale}/pricing`}>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    {t("upgradePlan")}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Main content */}
        <div className="lg:col-span-3">
          {billing && billing.status !== "Active" && billing.status !== "Trialing" ? (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {billing.status === "None" || billing.status === "Cancelled"
                      ? "Subscribe to start posting"
                      : "Subscription past due"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    {billing.status === "PastDue"
                      ? "Your last payment failed. Update your billing info to restore access to posting."
                      : "Choose a plan to post contract nursing roles. 14-day free trial — card required, cancel anytime."}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {billing.status === "PastDue" ? (
                      <Button size="lg" onClick={handleManageBilling} disabled={portalLoading}>
                        {portalLoading ? "Opening…" : "Update Payment Info"}
                      </Button>
                    ) : (
                      <Link href={`/${locale}/pricing`}>
                        <Button size="lg">Choose a Plan</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">{t("noListings")}</p>
                  <Link href={`/${locale}/dashboard/listings/new`}>
                    <Button size="sm" className="mt-4 gap-1.5">
                      <Plus className="h-4 w-4" />
                      {t("newListing")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
