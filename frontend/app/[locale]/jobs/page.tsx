"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Listing, Province, RoleType, ListingLanguage } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, DollarSign, Calendar, Clock } from "lucide-react";

const PROVINCES: Province[] = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT",
];

const PROVINCE_LABELS: Record<Province, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland & Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

const ROLES: RoleType[] = ["RN","RPN","LPN","NP","CNA","Other"];
const LANGUAGES: ListingLanguage[] = ["English","French","Bilingual"];
const CONTRACT_LENGTHS = ["4 weeks","8 weeks","13 weeks","26 weeks","52 weeks+"];

export default function JobsPage() {
  const t = useTranslations("Jobs");
  const locale = useLocale();

  const [province, setProvince] = useState("");
  const [role, setRole] = useState("");
  const [language, setLanguage] = useState("");
  const [contractLength, setContractLength] = useState("");

  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchListings = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const result = await api.listings.list({
          provinces: province ? [province as Province] : undefined,
          roleTypes: role ? [role as RoleType] : undefined,
          languages: language ? [language as ListingLanguage] : undefined,
          contractLengths: contractLength ? [contractLength] : undefined,
          page: pageNum,
          pageSize: 12,
        });
        setListings((prev) => (append ? [...prev, ...result.items] : result.items));
        setTotalCount(result.totalCount);
      } catch {
        // silently fail — could show error state in production
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [province, role, language, contractLength],
  );

  useEffect(() => {
    setPage(1);
    fetchListings(1);
  }, [fetchListings]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchListings(next, true);
  };

  const hasMore = listings.length < totalCount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={province} onValueChange={(v) => setProvince(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder={t("allProvinces")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allProvinces")}</SelectItem>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>{PROVINCE_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder={t("allRoles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allRoles")}</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={language} onValueChange={(v) => setLanguage(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder={t("allLanguages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allLanguages")}</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={contractLength} onValueChange={(v) => setContractLength(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder={t("allLengths")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allLengths")}</SelectItem>
            {CONTRACT_LENGTHS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="mb-4 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "position" : "positions"} found
        </p>
      )}

      {/* Listings grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t("noResults")}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} t={t} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  locale,
  t,
}: {
  listing: Listing;
  locale: string;
  t: ReturnType<typeof useTranslations<"Jobs">>;
}) {
  const title = (locale === "fr" ? listing.titleFr ?? listing.titleEn : listing.titleEn ?? listing.titleFr) ?? "";

  const payLabel =
    listing.payMin && listing.payMax
      ? `$${listing.payMin}–$${listing.payMax}/hr`
      : listing.payMin
        ? `$${listing.payMin}+/hr`
        : null;

  return (
    <Link href={`/${locale}/jobs/${listing.slug}`}>
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-card/80 cursor-pointer">
        {listing.featured && (
          <div className="rounded-t-lg bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-primary-foreground">
            Featured
          </div>
        )}
        <CardContent className="flex h-full flex-col pt-5">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {listing.roleTypes.map((r) => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {r}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {listing.language}
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground leading-snug">{title}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {listing.community}, {listing.province}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            {payLabel && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {payLabel}
              </span>
            )}
            {listing.contractLength && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {listing.contractLength}
              </span>
            )}
            {listing.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(listing.startDate).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          <div className="mt-3 text-xs text-muted-foreground">{listing.orgName}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
