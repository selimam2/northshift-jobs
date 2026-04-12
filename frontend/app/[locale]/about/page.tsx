import { useTranslations } from "next-intl";
import { MapPin, Heart, Users, Globe } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4 text-primary font-semibold">
          <MapPin className="h-5 w-5" />
          <span>NorthShift Jobs</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{t("intro")}</p>
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("missionTitle")}</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{t("missionBody")}</p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("whyTitle")}</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{t("whyBody")}</p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t("whoTitle")}</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{t("whoBody")}</p>
        </section>
      </div>
    </div>
  );
}
