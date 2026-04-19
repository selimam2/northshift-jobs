const mockFetch = jest.fn();
global.fetch = mockFetch;

import { api } from "../lib/api";

function okResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function errorResponse(status: number, body: string) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.reject(new Error("not json")),
    text: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── api.listings ──────────────────────────────────────────────────────────────

describe("api.listings.list", () => {
  it("calls /api/listings with no query string when no filter supplied", async () => {
    mockFetch.mockReturnValue(
      okResponse({ total: 0, page: 1, pageSize: 20, listings: [] }),
    );

    const result = await api.listings.list();

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toMatch(/\/api\/listings$/);
    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("appends province filter params to the query string", async () => {
    mockFetch.mockReturnValue(
      okResponse({ total: 1, page: 1, pageSize: 20, listings: [] }),
    );

    await api.listings.list({ provinces: ["ON", "AB"] });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("provinces=ON");
    expect(url).toContain("provinces=AB");
  });

  it("appends page and pageSize params", async () => {
    mockFetch.mockReturnValue(
      okResponse({ total: 50, page: 2, pageSize: 10, listings: [] }),
    );

    await api.listings.list({ page: 2, pageSize: 10 });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=10");
  });

  it("maps raw API shape to PagedResult shape", async () => {
    const rawListings = [{ id: "1", slug: "rn-thompson" }];
    mockFetch.mockReturnValue(
      okResponse({ total: 1, page: 1, pageSize: 20, listings: rawListings }),
    );

    const result = await api.listings.list();

    expect(result.totalCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items).toEqual(rawListings);
  });
});

describe("api.listings.get", () => {
  it("calls /api/listings/:slug", async () => {
    const listing = { id: "abc", slug: "rn-thompson-abc123" };
    mockFetch.mockReturnValue(okResponse(listing));

    const result = await api.listings.get("rn-thompson-abc123");

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("/api/listings/rn-thompson-abc123");
    expect(result).toEqual(listing);
  });
});

describe("api.listings.create", () => {
  it("sends POST with Authorization header", async () => {
    mockFetch.mockReturnValue(okResponse({ id: "new-id", slug: "new-slug" }));

    await api.listings.create(
      { titleEn: "RN Position" } as never,
      "my-jwt-token",
    );

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer my-jwt-token");
  });
});

// ── api.auth ──────────────────────────────────────────────────────────────────

describe("api.auth.login", () => {
  it("posts credentials to /api/auth/login", async () => {
    mockFetch.mockReturnValue(okResponse({ token: "jwt-abc" }));

    await api.auth.login("nurse@example.com", "s3cur3pass");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/auth/login");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.email).toBe("nurse@example.com");
    expect(body.password).toBe("s3cur3pass");
  });

  it("throws when the server returns a non-OK status", async () => {
    mockFetch.mockReturnValue(
      errorResponse(401, '{"error":"Invalid credentials"}'),
    );

    await expect(api.auth.login("bad@example.com", "wrong")).rejects.toThrow();
  });
});

describe("api.auth.forgotPassword", () => {
  it("posts email to /api/auth/forgot-password", async () => {
    mockFetch.mockReturnValue(okResponse({ message: "ok" }));

    await api.auth.forgotPassword("nurse@example.com");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/auth/forgot-password");
    expect(JSON.parse(options.body).email).toBe("nurse@example.com");
  });
});

describe("api.auth.resetPassword", () => {
  it("posts token and new password", async () => {
    mockFetch.mockReturnValue(okResponse({ message: "ok" }));

    await api.auth.resetPassword("abc123token", "newpassword");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.token).toBe("abc123token");
    expect(body.newPassword).toBe("newpassword");
  });
});

// ── api.alerts ────────────────────────────────────────────────────────────────

describe("api.alerts.unsubscribe", () => {
  it("encodes special characters in the token query param", async () => {
    mockFetch.mockReturnValue(okResponse({ message: "ok" }));

    await api.alerts.unsubscribe("tok/en+special=chars");

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent("tok/en+special=chars"));
    expect(url).not.toContain("tok/en+special=chars");
  });

  it("uses DELETE method", async () => {
    mockFetch.mockReturnValue(okResponse({ message: "ok" }));

    await api.alerts.unsubscribe("some-token");

    expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
  });
});

describe("api.alerts.subscribe", () => {
  it("posts subscription data to /api/alerts/subscribe", async () => {
    mockFetch.mockReturnValue(okResponse({ message: "Subscribed successfully" }));

    await api.alerts.subscribe({
      email: "nurse@example.com",
      languagePref: "English",
      preferences: {},
    } as never);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/alerts/subscribe");
    expect(options.method).toBe("POST");
  });
});

// ── api.applications ──────────────────────────────────────────────────────────

describe("api.applications.getUploadUrl", () => {
  it("encodes filename in query string", async () => {
    mockFetch.mockReturnValue(
      okResponse({ uploadUrl: "https://s3.example.com/upload", s3Key: "resumes/abc.pdf" }),
    );

    await api.applications.getUploadUrl("my resume (2024).pdf");

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent("my resume (2024).pdf"));
  });
});

// ── error handling ────────────────────────────────────────────────────────────

describe("apiFetch error handling", () => {
  it("throws with server error message when response is not ok", async () => {
    mockFetch.mockReturnValue(errorResponse(403, "Forbidden"));

    await expect(api.listings.get("some-slug")).rejects.toThrow("Forbidden");
  });

  it("includes Content-Type application/json header on all requests", async () => {
    mockFetch.mockReturnValue(okResponse({ token: "t" }));

    await api.auth.login("a@b.com", "pass");

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
  });
});
