"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, LogOut, LayoutDashboard, FileText, Users } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("ns_token");
    if (!token) router.replace(`/${locale}/login`);
  }, [locale, router]);

  const handleLogout = () => {
    localStorage.removeItem("ns_token");
    router.push(`/${locale}/login`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("newListing")}
          </Button>
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
        </nav>

        {/* Main content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">{t("noListings")}</p>
                <Button size="sm" className="mt-4 gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("newListing")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
