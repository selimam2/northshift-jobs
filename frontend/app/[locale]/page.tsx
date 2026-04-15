import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Search, Send, Bell } from "lucide-react";

export default async function HomePage() {
  const locale = await getLocale();
  return <HomePageClient locale={locale} />;
}

function HomePageClient({ locale }: { locale: string }) {
  const t = useTranslations("Home");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background px-4 py-24 sm:px-6 sm:py-32">
        {/* Decorative background rings */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full border border-primary/10" />
          <div className="absolute h-[400px] w-[400px] rounded-full border border-primary/15" />
          <div className="absolute h-[200px] w-[200px] rounded-full border border-primary/20" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="h-3 w-3" />
            Canada-wide
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={`/${locale}/jobs`}>
              <Button size="lg" className="gap-2 px-8">
                {t("heroCta")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/login`}>
              <Button size="lg" variant="outline" className="px-8">
                {t("postCta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 text-center">
          <div className="text-2xl font-bold text-primary">13</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("statsProvinces")}</div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("howTitle")}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Search className="h-6 w-6 text-primary" />,
                title: t("howStep1Title"),
                desc: t("howStep1Desc"),
              },
              {
                icon: <Send className="h-6 w-6 text-primary" />,
                title: t("howStep2Title"),
                desc: t("howStep2Desc"),
              },
              {
                icon: <Bell className="h-6 w-6 text-primary" />,
                title: t("howStep3Title"),
                desc: t("howStep3Desc"),
              },
            ].map((step, i) => (
              <Card key={i} className="relative overflow-hidden">
                <div className="absolute right-4 top-4 text-5xl font-black text-primary/5">
                  {i + 1}
                </div>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/10 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("employerTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {t("employerDesc")}
          </p>
          <Link href={`/${locale}/login`} className="mt-8 inline-block">
            <Button size="lg" className="gap-2 px-8">
              {t("employerCta")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
