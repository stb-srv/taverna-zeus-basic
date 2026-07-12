import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOsmEmbedUrl } from "@/lib/geocode";

const address = { street: "Marienplatz 8", zip: "80331", city: "München", country: "Deutschland" };

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue({ ok: true, json: async () => [], ...response });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildOsmEmbedUrl", () => {
  it("builds an OSM embed URL with marker and bbox around the coordinates", async () => {
    const fetchMock = mockFetch({ json: async () => [{ lat: "48.137788", lon: "11.575344" }] });

    const url = await buildOsmEmbedUrl(address);

    expect(url).toContain("https://www.openstreetmap.org/export/embed.html?bbox=");
    expect(url).toContain("marker=48.137788,11.575344");
    expect(url).toContain("layer=mapnik");
    // bbox = lon ± 0.006 / lat ± 0.0025
    expect(url).toContain("bbox=11.569344,48.135288,11.581344,48.140288");
    // The address is sent as one comma-separated query.
    const requested = String(fetchMock.mock.calls[0][0]);
    expect(requested).toContain(encodeURIComponent("Marienplatz 8, 80331 München, Deutschland"));
  });

  it("skips empty address parts when building the query", async () => {
    const fetchMock = mockFetch({ json: async () => [{ lat: "1", lon: "2" }] });

    await buildOsmEmbedUrl({ street: null, zip: null, city: "Berlin", country: null });

    expect(String(fetchMock.mock.calls[0][0])).toContain(`q=${encodeURIComponent("Berlin")}`);
  });

  it("returns null without fetching when the address is empty", async () => {
    const fetchMock = mockFetch({});
    expect(await buildOsmEmbedUrl({ street: null, zip: null, city: null, country: null })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on an HTTP error", async () => {
    mockFetch({ ok: false });
    expect(await buildOsmEmbedUrl(address)).toBeNull();
  });

  it("returns null when nothing is found", async () => {
    mockFetch({ json: async () => [] });
    expect(await buildOsmEmbedUrl(address)).toBeNull();
  });

  it("returns null when the request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await buildOsmEmbedUrl(address)).toBeNull();
  });
});
