"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import type { ListingLanguage, RoleType, Province } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const PROVINCES: { value: Province; label: string }[] = [
  { value: "AB", label: "Alberta" }, { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" }, { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland & Labrador" }, { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" }, { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" }, { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" }, { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

const ROLES: RoleType[] = ["RN", "RPN", "LPN", "NP", "CNA", "Other"];
const CONTRACT_LENGTHS = ["4 weeks", "8 weeks", "13 weeks", "26 weeks", "52 weeks+"];

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [language, setLanguage] = useState<ListingLanguage>("English");
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

  const showEn = language === "English" || language === "Bilingual";
  const showFr = language === "French" || language === "Bilingual";

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    setToken(t);
    api.listings.getById(id, t)
      .then((listing) => {
        setLanguage(listing.language);
        setTitleEn(listing.titleEn ?? "");
        setTitleFr(listing.titleFr ?? "");
        setDescEn(listing.descriptionEn ?? "");
        setDescFr(listing.descriptionFr ?? "");
        setRoleTypes(listing.roleTypes ?? []);
        setProvince(listing.province);
        setCommunity(listing.community);
        setContractLength(listing.contractLength ?? "");
        setStartDate(listing.startDate ? listing.startDate.split("T")[0] : "");
        setPayMin(listing.payMin?.toString() ?? "");
        setPayMax(listing.payMax?.toString() ?? "");
        if (listing.language === "French") setContentTab("fr");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, locale, router]);

  useEffect(() => {
    if (language === "French") setContentTab("fr");
    else setContentTab("en");
  }, [language]);

  const toggleRole = (r: RoleType) =>
    setRoleTypes((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (showEn && !titleEn.trim()) e.titleEn = "English title is required.";
    if (showFr && !titleFr.trim()) e.titleFr = "French title is required.";
    if (showEn && !descEn.trim()) e.descEn = "English description is required.";
    if (showFr && !descFr.trim()) e.descFr = "French description is required.";
    if (roleTypes.length === 0) e.roleTypes = "Select at least one role type.";
    if (!province) e.province = "Province is required.";
    if (!community.trim()) e.community = "Community is required.";
    if (!contractLength) e.contractLength = "Contract length is required.";
    if (payMin && parseFloat(payMin) <= 0) e.payMin = "Pay must be greater than 0.";
    if (payMin && payMax && parseFloat(payMax) <= parseFloat(payMin)) e.payMax = "Pay max must be greater than pay min.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.listings.update(id, {
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
      }, token);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link href={`/${locale}/dashboard`}>
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/${locale}/dashboard`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Language */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Posting Language</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["English", "French", "Bilingual"] as ListingLanguage[]).map((lang) => (
              <button key={lang} type="button" onClick={() => setLanguage(lang)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${
                  language === lang ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
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

        {/* Content */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Content</h2>
          {language === "Bilingual" && (
            <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
              {(["en", "fr"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setContentTab(tab)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    contentTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "en" ? "English" : "Français"}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {showEn && (language !== "Bilingual" || contentTab === "en") && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Title (English) *</label>
                  <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={errors.titleEn ? "border-destructive" : ""} />
                  {errors.titleEn && <p className="mt-1 text-xs text-destructive">{errors.titleEn}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Description (English) *</label>
                  <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={6}
                    className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y ${errors.descEn ? "border-destructive" : "border-input"}`}
                  />
                  {errors.descEn && <p className="mt-1 text-xs text-destructive">{errors.descEn}</p>}
                </div>
              </>
            )}
            {showFr && (language !== "Bilingual" || contentTab === "fr") && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Titre (Français) *</label>
                  <Input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} className={errors.titleFr ? "border-destructive" : ""} />
                  {errors.titleFr && <p className="mt-1 text-xs text-destructive">{errors.titleFr}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Description (Français) *</label>
                  <textarea value={descFr} onChange={(e) => setDescFr(e.target.value)} rows={6}
                    className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y ${errors.descFr ? "border-destructive" : "border-input"}`}
                  />
                  {errors.descFr && <p className="mt-1 text-xs text-destructive">{errors.descFr}</p>}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Role Types */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Role Types *</h2>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  roleTypes.includes(r) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {roleTypes.includes(r) && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                {r}
              </button>
            ))}
          </div>
          {errors.roleTypes && <p className="mt-2 text-xs text-destructive">{errors.roleTypes}</p>}
        </section>

        {/* Location */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location *</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Province / Territory *</label>
              <Select value={province} onValueChange={(v) => setProvince((v ?? "") as Province)}>
                <SelectTrigger className={errors.province ? "border-destructive" : ""}><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.province && <p className="mt-1 text-xs text-destructive">{errors.province}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Community *</label>
              <Input value={community} onChange={(e) => setCommunity(e.target.value)} className={errors.community ? "border-destructive" : ""} />
              {errors.community && <p className="mt-1 text-xs text-destructive">{errors.community}</p>}
            </div>
          </div>
        </section>

        {/* Contract Details */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contract Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Contract Length *</label>
              <Select value={contractLength} onValueChange={(v) => setContractLength(v ?? "")}>
                <SelectTrigger className={errors.contractLength ? "border-destructive" : ""}><SelectValue placeholder="Select length" /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_LENGTHS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.contractLength && <p className="mt-1 text-xs text-destructive">{errors.contractLength}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Pay Min ($/hr)</label>
              <Input type="number" min={0} value={payMin} onChange={(e) => setPayMin(e.target.value)} className={errors.payMin ? "border-destructive" : ""} />
              {errors.payMin && <p className="mt-1 text-xs text-destructive">{errors.payMin}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Pay Max ($/hr)</label>
              <Input type="number" min={0} value={payMax} onChange={(e) => setPayMax(e.target.value)} className={errors.payMax ? "border-destructive" : ""} />
              {errors.payMax && <p className="mt-1 text-xs text-destructive">{errors.payMax}</p>}
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
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
          <Link href={`/${locale}/dashboard`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
