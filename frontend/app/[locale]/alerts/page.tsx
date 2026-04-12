"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Province, RoleType, ListingLanguage, LanguagePreference } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Bell } from "lucide-react";

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

const ROLES: RoleType[] = ["RN","RPN","LPN","NP","CNA","Other"];
const LANGUAGES: ListingLanguage[] = ["English","French","Bilingual"];

function MultiCheckbox<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (item: T) => {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            value.includes(opt.value)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const t = useTranslations("Alerts");

  const [email, setEmail] = useState("");
  const [langPref, setLangPref] = useState<LanguagePreference>("English");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [languages, setLanguages] = useState<ListingLanguage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.alerts.subscribe({
        email,
        languagePref: langPref,
        preferences: {
          provinces: provinces.length ? provinces : undefined,
          roleTypes: roles.length ? roles : undefined,
          languages: languages.length ? languages : undefined,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">{t("successTitle")}</h2>
              <p className="mt-2 text-muted-foreground">{t("successMsg")}</p>
              <p className="mt-4 text-xs text-muted-foreground">{t("unsubscribeNote")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("email")} *
                </label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nurse@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("languagePref")} *
                </label>
                <Select
                  value={langPref}
                  onValueChange={(v) => setLangPref((v ?? "English") as LanguagePreference)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="French">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("provinces")}
                </label>
                <MultiCheckbox
                  options={PROVINCES}
                  value={provinces}
                  onChange={setProvinces}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("roles")}
                </label>
                <MultiCheckbox
                  options={ROLES.map((r) => ({ value: r, label: r }))}
                  value={roles}
                  onChange={setRoles}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {t("languages")}
                </label>
                <MultiCheckbox
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  value={languages}
                  onChange={setLanguages}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? "…" : t("subscribe")}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("unsubscribeNote")}
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
