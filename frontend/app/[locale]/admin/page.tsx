"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Building2, FileText, LogOut, Clock } from "lucide-react";

type PendingListing = {
  id: string;
  slug: string;
  titleEn: string | null;
  titleFr: string | null;
  roleTypes: string[];
  province: string;
  community: string;
  createdAt: string;
  orgName: string;
  postedBy: string;
};

type Org = {
  id: string;
  name: string;
  tier: string;
  subscriptionStatus: string;
  isAnnual: boolean;
  createdAt: string;
  userCount: number;
  activeListings: number;
};

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? null;
  } catch {
    return null;
  }
}

const TIER_LABELS: Record<string, string> = { Small: "Starter", Medium: "Growth", Large: "Enterprise" };
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Active: "default", Trialing: "secondary", PastDue: "destructive", Cancelled: "outline", None: "outline",
};

export default function AdminPage() {
  const router = useRouter();
  const locale = useLocale();

  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"listings" | "orgs">("listings");
  const [pending, setPending] = useState<PendingListing[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("ns_token") ?? "";
    if (!t) { router.replace(`/${locale}/login`); return; }
    const role = decodeRole(t);
    if (role !== "Admin") { router.replace(`/${locale}/dashboard`); return; }
    setToken(t);
  }, [locale, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.admin.getPendingListings(token),
      api.admin.getOrgs(token),
    ]).then(([p, o]) => {
      setPending(p);
      setOrgs(o);
    }).finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + "-approve");
    try {
      await api.admin.approveListing(id, token);
      setPending((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "-reject");
    try {
      await api.admin.rejectListing(id, token);
      setPending((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ns_token");
    router.push(`/${locale}/login`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>

      <Separator className="my-6" />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {([
          { key: "listings", label: "Pending Listings", icon: <FileText className="h-4 w-4" /> },
          { key: "orgs", label: "Organisations", icon: <Building2 className="h-4 w-4" /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === "listings" && pending.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : tab === "listings" ? (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No listings pending approval</p>
            </div>
          ) : (
            pending.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {listing.titleEn ?? listing.titleFr ?? "Untitled"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {listing.orgName} · posted by {listing.postedBy}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline">{listing.province}</Badge>
                      {listing.community && <Badge variant="outline">{listing.community}</Badge>}
                      {listing.roleTypes.map((r) => (
                        <Badge key={r} variant="secondary">{r}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={actionLoading !== null}
                      onClick={() => handleReject(listing.id)}
                    >
                      {actionLoading === listing.id + "-reject" ? "…" : <><XCircle className="h-4 w-4" /> Reject</>}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={actionLoading !== null}
                      onClick={() => handleApprove(listing.id)}
                    >
                      {actionLoading === listing.id + "-approve" ? "…" : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organisation</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Users</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Active Listings</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TIER_LABELS[org.tier] ?? org.tier}
                    {org.isAnnual && <span className="ml-1 text-xs">(annual)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[org.subscriptionStatus] ?? "outline"}>
                      {org.subscriptionStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{org.userCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.activeListings}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orgs.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No organisations yet</p>
          )}
        </div>
      )}
    </div>
  );
}
