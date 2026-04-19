"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import type { Listing, Province } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Globe,
  CheckCircle2,
  Paperclip,
} from "lucide-react";

const PROVINCES: Province[] = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT",
];

const PROVINCE_LABELS: Record<Province, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland & Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("JobDetail");
  const locale = useLocale();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [licenceProvince, setLicenceProvince] = useState<Province | "">("");
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    api.listings
      .get(slug)
      .then(setListing)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (!availabilityDate) e.availabilityDate = "Availability date is required.";
    else if (new Date(availabilityDate) < new Date(new Date().toDateString())) e.availabilityDate = "Date must be today or in the future.";
    if (!licenceProvince) e.licenceProvince = "Province of licence is required.";
    if (!resumeFile) e.resume = t("resumeRequired");
    else {
      const ext = resumeFile.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "doc", "docx"].includes(ext ?? "")) e.resume = "Only PDF, DOC, or DOCX files are accepted.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { uploadUrl, s3Key } = await api.applications.getUploadUrl(resumeFile!.name);
      await api.applications.uploadResume(uploadUrl, resumeFile!);

      await api.applications.submit(listing.id, {
        applicantName: name,
        applicantEmail: email,
        availabilityDate: new Date(availabilityDate).toISOString(),
        licences: [
          {
            province: licenceProvince as Province,
            licenceNumber: licenceNumber || undefined,
            expiry: licenceExpiry || undefined,
          },
        ],
        coverMessage: coverMessage || undefined,
        consentToAlerts: consent,
        resumeS3Key: s3Key,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-4 h-8 w-2/3" />
        <Skeleton className="mb-3 h-5 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted-foreground">Job not found.</p>
        <Link href={`/${locale}/jobs`} className="mt-4 inline-block">
          <Button variant="outline">{t("backToJobs")}</Button>
        </Link>
      </div>
    );
  }

  const title = (locale === "fr" ? listing.titleFr ?? listing.titleEn : listing.titleEn ?? listing.titleFr) ?? "";
  const description = (locale === "fr" ? listing.descriptionFr ?? listing.descriptionEn : listing.descriptionEn ?? listing.descriptionFr) ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Back */}
      <Link
        href={`/${locale}/jobs`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToJobs")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Job detail */}
        <div className="lg:col-span-2">
          {/* Role badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            {listing.roleTypes.map((r) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
            <Badge variant="outline">{listing.language}</Badge>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {listing.community}, {PROVINCE_LABELS[listing.province]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listing.payMin && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-accent" />
                {listing.payMax
                  ? `$${listing.payMin}–$${listing.payMax}/hr`
                  : `$${listing.payMin}+/hr`}
              </div>
            )}
            {listing.contractLength && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-accent" />
                {listing.contractLength}
              </div>
            )}
            {listing.startDate && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-accent" />
                {new Date(listing.startDate).toLocaleDateString(
                  locale === "fr" ? "fr-CA" : "en-CA",
                  { year: "numeric", month: "short", day: "numeric" },
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-accent" />
              {listing.language}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
            {description}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Posted by {listing.orgName}
          </p>
        </div>

        {/* Application form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              {submitted ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-accent" />
                  <h3 className="font-semibold text-foreground">{t("successTitle")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t("successMsg")}</p>
                </div>
              ) : (
                <>
                  <h2 className="font-semibold text-foreground">{t("applyTitle")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t("applyNote")}</p>

                  <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("fullName")} *
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("email")} *
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Availability Date *
                      </label>
                      <Input
                        type="date"
                        value={availabilityDate}
                        onChange={(e) => setAvailabilityDate(e.target.value)}
                        className={errors.availabilityDate ? "border-destructive" : ""}
                      />
                      {errors.availabilityDate && <p className="mt-1 text-xs text-destructive">{errors.availabilityDate}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("province")} *
                      </label>
                      <Select
                        value={licenceProvince}
                        onValueChange={(v) => setLicenceProvince((v ?? "") as Province)}
                      >
                        <SelectTrigger className={errors.licenceProvince ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {PROVINCE_LABELS[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.licenceProvince && <p className="mt-1 text-xs text-destructive">{errors.licenceProvince}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          {t("licenceNumber")}
                        </label>
                        <Input
                          value={licenceNumber}
                          onChange={(e) => setLicenceNumber(e.target.value)}
                          placeholder="RN-12345"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          {t("licenceExpiry")}
                        </label>
                        <Input
                          type="date"
                          value={licenceExpiry}
                          onChange={(e) => setLicenceExpiry(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("coverLetter")}
                      </label>
                      <textarea
                        value={coverMessage}
                        onChange={(e) => setCoverMessage(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        placeholder="Brief intro…"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t("resume")} *
                      </label>
                      <label className={`flex cursor-pointer items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors ${errors.resume ? "border-destructive" : "border-input"}`}>
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {resumeFile ? resumeFile.name : t("resume")}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {errors.resume
                        ? <p className="mt-1 text-xs text-destructive">{errors.resume}</p>
                        : <p className="mt-1 text-xs text-muted-foreground">{t("resumeNote")}</p>
                      }
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-primary"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t("consentLabel")}
                      </span>
                    </label>

                    {submitError && (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {submitError}
                      </div>
                    )}

                    <Button type="submit" disabled={submitting} className="mt-1 w-full">
                      {submitting ? t("submitting") : t("submitBtn")}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
