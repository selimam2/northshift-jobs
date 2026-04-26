"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus, LogOut, LayoutDashboard, FileText, Users, CreditCard,
  AlertTriangle, Lock, Settings, Pencil, X, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { MyListing } from "@/lib/types";

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

const PROVINCE_LABELS: Record<string, string> = {
  AB: "AB", BC: "BC", MB: "MB", NB: "NB", NL: "NL", NS: "NS",
  NT: "NT", NU: "NU", ON: "ON", PE: "PE", QC: "QC", SK: "SK", YT: "YT",
};

function listingStatusBadge(status: string) {
  switch (status) {
    case "Active": return <Badge variant="default" className="bg-green-600 text-white text-xs">Active</Badge>;
    case "PendingApproval": return <Badge variant="secondary" className="text-xs">Pending Review</Badge>;
    case "Closed": return <Badge variant="outline" className="text-xs text-muted-foreground">Closed</Badge>;
    case "Draft": return <Badge variant="outline" className="text-xs">Draft</Badge>;
    default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.stripe.getBilling(t).then(setBilling).catch(() => null);
    api.listings.listMine(t)
      .then(setListings)
      .catch(() => null)
      .finally(() => setListingsLoading(false));
  }, [locale, router]);

  const handleLogout = () => {
    localStorage.removeItem("ns_token");
    router.push(`/${locale}/login`);
  };

  const handleManageBilling = async () => {
    if (!token) return;
    setPortalLoading(true);
    try {
      const { url } = await api.stripe.createPortal(token);
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  const handleClose = async (id: string, title: string) => {
    if (!window.confirm(`Close "${title}"? It will no longer be visible to nurses.`)) return;
    setClosingId(id);
    try {
      await api.listings.close(id, token);
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "Closed" } : l));
    } catch {
      alert("Failed to close listing. Please try again.");
    } finally {
      setClosingId(null);
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

  const isSubscribed = billing?.status === "Active" || billing?.status === "Trialing";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {billing?.status === "PastDue" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("pastDueBanner")}
          <button onClick={handleManageBilling} className="ml-auto font-medium underline underline-offset-2">
            {t("manageBilling")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <div className="flex items-center gap-3">
          {isSubscribed ? (
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
        {/* Sidebar */}
        <nav className="space-y-1">
          <Link
            href={`/${locale}/dashboard`}
            className="flex w-full items-center gap-2.5 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
          >
            <FileText className="h-4 w-4" />
            {t("listings")}
          </Link>
          <Link
            href={`/${locale}/dashboard/applications`}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("applications")}
          </Link>
          <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {t("team")}
          </button>

          <Separator className="my-3" />
          <Link
            href={`/${locale}/dashboard/settings`}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

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
                      {t("trialEndsOn", { date: new Date(billing.expiresAt).toLocaleDateString() })}
                    </p>
                  )}
                  {billing.expiresAt && billing.status === "Active" && (
                    <p className="text-xs text-muted-foreground">
                      {t("renewsOn", { date: new Date(billing.expiresAt).toLocaleDateString() })}
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
                {isSubscribed && (
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="mt-1.5 w-full rounded-md px-3 py-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors text-center"
                  >
                    Cancel plan
                  </button>
                )}
              </div>
            </>
          )}

          {!billing && (
            <>
              <Separator className="my-3" />
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-2">No active plan</p>
                <Link href={`/${locale}/pricing`}>
                  <Button size="sm" variant="outline" className="w-full text-xs">{t("upgradePlan")}</Button>
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Main content */}
        <div className="lg:col-span-3">
          {!isSubscribed ? (
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {billing?.status === "Cancelled" || billing?.status === "None"
                      ? "Subscribe to start posting"
                      : "Subscription past due"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    {billing?.status === "PastDue"
                      ? "Your last payment failed. Update your billing info to restore access."
                      : "Choose a plan to post contract nursing roles. 14-day free trial included."}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {billing?.status === "PastDue" ? (
                      <Button size="lg" onClick={handleManageBilling} disabled={portalLoading}>
                        {portalLoading ? "Opening…" : "Update Payment Info"}
                      </Button>
                    ) : (
                      <Link href={`/${locale}/pricing`}><Button size="lg">Choose a Plan</Button></Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : listingsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const title = listing.titleEn ?? listing.titleFr ?? "Untitled";
                return (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm truncate">{title}</span>
                        {listingStatusBadge(listing.status)}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {listing.community}, {PROVINCE_LABELS[listing.province]} · {listing.contractLength}
                      </p>
                    </div>

                    <Link
                      href={`/${locale}/dashboard/applications?listingId=${listing.id}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      {listing.applicationCount} app{listing.applicationCount !== 1 ? "s" : ""}
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/${locale}/dashboard/listings/${listing.id}/edit`}>
                        <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </Link>
                      {listing.status !== "Closed" && (
                        <button
                          onClick={() => handleClose(listing.id, title)}
                          disabled={closingId === listing.id}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          {closingId === listing.id ? "Closing…" : "Close"}
                        </button>
                      )}
                      <Link href={`/${locale}/dashboard/applications?listingId=${listing.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
