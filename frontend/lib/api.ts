import type {
  Listing,
  ListingFilter,
  PagedResult,
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
    list(filter: ListingFilter = {}): Promise<PagedResult<Listing>> {
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
      return apiFetch(`/api/listings${qs ? `?${qs}` : ""}`);
    },

    get(slug: string): Promise<Listing> {
      return apiFetch(`/api/listings/${slug}`);
    },
  },

  applications: {
    submit(data: SubmitApplicationRequest): Promise<{ id: string }> {
      return apiFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  alerts: {
    subscribe(data: SubscribeRequest): Promise<{ token: string }> {
      return apiFetch("/api/alerts/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  auth: {
    login(email: string, password: string): Promise<{ token: string }> {
      return apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
  },
};
