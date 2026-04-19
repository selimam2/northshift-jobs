import type {
  Listing,
  ListingFilter,
  PagedResult,
  CreateListingRequest,
  SubmitApplicationRequest,
  SubscribeRequest,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listings: {
    async list(filter: ListingFilter = {}): Promise<PagedResult<Listing>> {
      const params = new URLSearchParams();
      if (filter.provinces?.length)
        filter.provinces.forEach((p) => params.append("provinces", p));
      if (filter.roleTypes?.length)
        filter.roleTypes.forEach((r) => params.append("roleTypes", r));
      if (filter.languages?.length)
        filter.languages.forEach((l) => params.append("languages", l));
      if (filter.contractLengths?.length)
        filter.contractLengths.forEach((c) =>
          params.append("contractLengths", c),
        );
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
      const qs = params.toString();
      const raw = await apiFetch<{ total: number; page: number; pageSize: number; listings: Listing[] }>(
        `/api/listings${qs ? `?${qs}` : ""}`,
      );
      return { items: raw.listings, totalCount: raw.total, page: raw.page, pageSize: raw.pageSize };
    },

    get(slug: string): Promise<Listing> {
      return apiFetch(`/api/listings/${slug}`);
    },

    create(data: CreateListingRequest, token: string): Promise<{ id: string; slug: string }> {
      return apiFetch("/api/listings", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  applications: {
    async getUploadUrl(filename: string): Promise<{ uploadUrl: string; s3Key: string }> {
      return apiFetch(`/api/applications/presigned-upload?filename=${encodeURIComponent(filename)}`);
    },

    async uploadResume(uploadUrl: string, file: File): Promise<void> {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!res.ok) throw new Error("Resume upload failed");
    },

    submit(listingId: string, data: Omit<SubmitApplicationRequest, "listingId">): Promise<{ id: string }> {
      return apiFetch(`/api/applications/${listingId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  alerts: {
    subscribe(data: SubscribeRequest): Promise<{ message: string }> {
      return apiFetch("/api/alerts/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    unsubscribe(token: string): Promise<{ message: string }> {
      return apiFetch(`/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
    },

    sendUnsubscribeLink(email: string): Promise<{ message: string }> {
      return apiFetch("/api/alerts/send-unsubscribe-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  },

  auth: {
    register(data: {
      orgName: string;
      name: string;
      email: string;
      password: string;
    }): Promise<{ token: string }> {
      return apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    login(email: string, password: string): Promise<{ token: string }> {
      return apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    forgotPassword(email: string): Promise<{ message: string }> {
      return apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
      return apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
    },
  },

  admin: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPendingListings(token: string): Promise<any[]> {
      return apiFetch("/api/admin/listings/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getOrgs(token: string): Promise<any[]> {
      return apiFetch("/api/admin/orgs", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    approveListing(id: string, token: string): Promise<{ message: string }> {
      return apiFetch(`/api/admin/listings/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    rejectListing(id: string, token: string): Promise<{ message: string }> {
      return apiFetch(`/api/admin/listings/${id}/reject`, {
        method: "POST",
        body: JSON.stringify("No reason provided"),
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },

  stripe: {
    getBilling(token: string): Promise<{ tier: string; status: string; isAnnual: boolean; expiresAt: string | null }> {
      return apiFetch("/api/stripe/billing", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    createCheckout(tier: string, isAnnual: boolean, token: string): Promise<{ url: string }> {
      return apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ tier, isAnnual }),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    createPortal(token: string): Promise<{ url: string }> {
      return apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
};
