import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const t = useTranslations("Privacy");

  const sections = [
    { title: t("s1Title"), body: t("s1Body") },
    { title: t("s2Title"), body: t("s2Body") },
    { title: t("s3Title"), body: t("s3Body") },
    { title: t("s4Title"), body: t("s4Body") },
    { title: t("s5Title"), body: t("s5Body") },
    { title: t("s6Title"), body: t("s6Body") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 mb-4 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("effective")}</p>
        <p className="mt-3 text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="space-y-10">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold text-foreground mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        {t("contact")}{" "}
        <a href="mailto:hello@northshift.ca" className="text-foreground hover:underline">
          hello@northshift.ca
        </a>
      </div>
    </div>
  );
}
