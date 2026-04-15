"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ListingLanguage, RoleType, Province } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

const PROVINCES: { value: Province; label: string }[] = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland & Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

const ROLES: RoleType[] = ["RN", "RPN", "LPN", "NP", "CNA", "Other"];
const CONTRACT_LENGTHS = ["4 weeks", "8 weeks", "13 weeks", "26 weeks", "52 weeks+"];

type BillingStatus = "loading" | "unsubscribed" | "ok";

export default function NewListingPage() {
  const router = useRouter();
  const locale = useLocale();

  const [token, setToken] = useState("");
  const [billingStatus, setBillingStatus] = useState<BillingStatus>("loading");

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.stripe.getBilling(t)
      .then((b) => {
        const active = b.status === "Active" || b.status === "Trialing";
        setBillingStatus(active ? "ok" : "unsubscribed");
      })
      .catch(() => setBillingStatus("unsubscribed"));
  }, [locale, router]);

  // Language selection drives which content fields appear
  const [language, setLanguage] = useState<ListingLanguage>("English");
  const showEn = language === "English" || language === "Bilingual";
  const showFr = language === "French" || language === "Bilingual";

  const [titleEn, setTitleEn] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descFr, setDescFr] = useState("");
  const [contentTab, setContentTab] = useState<"en" | "fr">("en");

  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [province, setProvince] = useState<Province | "">("");
  const [community, setCommunity] = useState("");
  const [contractLength, setContractLength] = useState("");
  const [startDate, setStartDate] = useState("");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [housing, setHousing] = useState(false);
  const [travel, setTravel] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (r: RoleType) =>
    setRoleTypes((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  useEffect(() => {
    if (language === "French") setContentTab("fr");
    else setContentTab("en");
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!province || !contractLength || roleTypes.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await api.listings.create(
        {
          language,
          titleEn: showEn ? titleEn : undefined,
          titleFr: showFr ? titleFr : undefined,
          descriptionEn: showEn ? descEn : undefined,
          descriptionFr: showFr ? descFr : undefined,
          roleTypes,
          province: province as Province,
          community,
          contractLength,
          startDate: startDate || undefined,
          payMin: payMin ? parseFloat(payMin) : undefined,
          payMax: payMax ? parseFloat(payMax) : undefined,
          housingProvided: housing,
          travelCovered: travel,
        },
        token,
      );
      router.push(`/${locale}/dashboard?created=${result.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Subscription gate ──────────────────────────────────────────────────────
  if (billingStatus === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (billingStatus === "unsubscribed") {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Subscription required</h1>
          <p className="mt-3 text-muted-foreground">
            You need an active plan to post listings. Start your 14-day free trial — card required, cancel anytime.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/${locale}/pricing`}>
              <Button size="lg" className="w-full sm:w-auto">Choose a Plan</Button>
            </Link>
            <Link href={`/${locale}/dashboard`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form (subscribed) ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">
        New Listing
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Language ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Posting Language
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(["English", "French", "Bilingual"] as ListingLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${
                  language === lang
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <div className="font-semibold">{lang}</div>
                <div className="mt-0.5 text-xs font-normal opacity-70">
                  {lang === "English" && "English only"}
                  {lang === "French" && "Français seulement"}
                  {lang === "Bilingual" && "EN + FR"}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Content ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Content
          </h2>

          {language === "Bilingual" && (
            <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
              {(["en", "fr"] as const).map((tab) => {
                const hasContent = tab === "en"
                  ? titleEn.trim() || descEn.trim()
                  : titleFr.trim() || descFr.trim();
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setContentTab(tab)}
                    className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      contentTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "en" ? "English" : "Français"}
                    {hasContent && (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            {showEn && (language !== "Bilingual" || contentTab === "en") && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Title (English) *</label>
                  <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. Registered Nurse — Emergency Care" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Description (English) *</label>
                  <textarea
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                    placeholder="Describe the role, requirements, and what makes this opportunity special…"
                  />
                </div>
              </>
            )}
            {showFr && (language !== "Bilingual" || contentTab === "fr") && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Titre (Français) *</label>
                  <Input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="ex. Infirmière autorisée — Soins d'urgence" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Description (Français) *</label>
                  <textarea
                    value={descFr}
                    onChange={(e) => setDescFr(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                    placeholder="Décrivez le poste, les exigences et ce qui rend cette opportunité spéciale…"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Role types ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Role Types *</h2>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRole(r)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  roleTypes.includes(r)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {roleTypes.includes(r) && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                {r}
              </button>
            ))}
          </div>
        </section>

        {/* ── Location ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location *</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Province / Territory</label>
              <Select value={province} onValueChange={(v) => setProvince((v ?? "") as Province)}>
                <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Community</label>
              <Input value={community} onChange={(e) => setCommunity(e.target.value)} placeholder="e.g. Fort Nelson" />
            </div>
          </div>
        </section>

        {/* ── Contract details ───────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contract Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Contract Length *</label>
              <Select value={contractLength} onValueChange={(v) => setContractLength(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select length" /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_LENGTHS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Pay Min ($/hr)</label>
              <Input type="number" min={0} value={payMin} onChange={(e) => setPayMin(e.target.value)} placeholder="45" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Pay Max ($/hr)</label>
              <Input type="number" min={0} value={payMax} onChange={(e) => setPayMax(e.target.value)} placeholder="60" />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input type="checkbox" className="accent-primary" checked={housing} onChange={(e) => setHousing(e.target.checked)} />
              Housing provided
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input type="checkbox" className="accent-primary" checked={travel} onChange={(e) => setTravel(e.target.checked)} />
              Travel covered
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none sm:px-10">
            {submitting ? "Submitting…" : "Submit for Review"}
          </Button>
          <Link href={`/${locale}/dashboard`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          New listings are reviewed before going live. You'll receive an email confirmation when approved.
        </p>
      </form>
    </div>
  );
}
