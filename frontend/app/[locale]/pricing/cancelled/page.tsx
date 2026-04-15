import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocale } from "next-intl/server";

export default async function PricingCancelledPage() {
  const locale = await getLocale();

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <XCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="text-3xl font-bold text-foreground">Checkout cancelled</h1>
        <p className="mt-4 text-muted-foreground">
          No worries — you haven't been charged. Head back to pricing whenever you're ready.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href={`/${locale}/pricing`}>
            <Button size="lg">Back to Pricing</Button>
          </Link>
          <Link href={`/${locale}/dashboard`}>
            <Button size="lg" variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
