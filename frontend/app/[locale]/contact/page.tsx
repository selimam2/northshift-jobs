"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const t = useTranslations("Contact");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // mailto fallback — replace with API endpoint when backend is wired
    const subject = encodeURIComponent(`NorthShift contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:hello@northshift.ca?subject=${subject}&body=${body}`;
    setSent(true);
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-4 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Mail className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("emailLabel")}</p>
          <a
            href="mailto:hello@northshift.ca"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            hello@northshift.ca
          </a>
        </div>
      </div>

      {sent ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="font-medium text-foreground">{t("sentTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("sentBody")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t("name")} *</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t("email")} *</label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{t("message")} *</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder={t("messagePlaceholder")}
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full">
            {sending ? t("sending") : t("send")}
          </Button>
        </form>
      )}
    </div>
  );
}
