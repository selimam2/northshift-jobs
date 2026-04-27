import type {
  Listing,
  ListingFilter,
  PagedResult,
  CreateListingRequest,
  UpdateListingRequest,
  SubmitApplicationRequest,
  SubscribeRequest,
  MyListing,
  ApplicationSummary,
  ApplicationDetail,
  ApplicationStatus,
  TeamResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
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

    listMine(token: string): Promise<MyListing[]> {
      return apiFetch("/api/listings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    getById(id: string, token: string): Promise<Listing> {
      return apiFetch(`/api/listings/mine/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    update(id: string, data: UpdateListingRequest, token: string): Promise<void> {
      return apiFetch(`/api/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    close(id: string, token: string): Promise<void> {
      return apiFetch(`/api/listings/${id}`, {
        method: "DELETE",
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

    getAll(token: string, listingId?: string): Promise<ApplicationSummary[]> {
      const qs = listingId ? `?listingId=${listingId}` : "";
      return apiFetch(`/api/applications${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    getById(id: string, token: string): Promise<ApplicationDetail> {
      return apiFetch(`/api/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    updateStatus(id: string, status: ApplicationStatus, token: string): Promise<void> {
      return apiFetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    getResumeUrl(id: string, token: string): Promise<{ url: string }> {
      return apiFetch(`/api/applications/${id}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    addNote(id: string, body: string, token: string): Promise<void> {
      return apiFetch(`/api/applications/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body }),
        headers: { Authorization: `Bearer ${token}` },
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

    changePassword(currentPassword: string, newPassword: string, token: string): Promise<{ message: string }> {
      return apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    acceptInvite(inviteToken: string, password: string): Promise<{ token: string }> {
      return apiFetch("/api/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({ inviteToken, password }),
      });
    },
  },

  team: {
    getTeam(token: string): Promise<TeamResponse> {
      return apiFetch("/api/team", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    invite(data: { name: string; email: string; permissions: number }, token: string): Promise<{ message: string }> {
      return apiFetch("/api/auth/invite", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    updatePermissions(id: string, permissions: number, token: string): Promise<{ message: string }> {
      return apiFetch(`/api/team/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
        headers: { Authorization: `Bearer ${token}` },
      });
    },

    removeMember(id: string, token: string): Promise<{ message: string }> {
      return apiFetch(`/api/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
