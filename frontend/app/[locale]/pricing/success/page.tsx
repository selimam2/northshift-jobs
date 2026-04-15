import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocale } from "next-intl/server";

export default async function PricingSuccessPage() {
  const locale = await getLocale();

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">You're all set!</h1>
        <p className="mt-4 text-muted-foreground">
          Your 14-day free trial has started. No charge until your trial ends.
          You'll receive a confirmation email from Stripe.
        </p>
        <Link href={`/${locale}/dashboard`} className="mt-8 inline-block">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
