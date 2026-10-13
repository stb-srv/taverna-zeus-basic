import { describe, expect, it } from "vitest";
import { isBlockedHost } from "@/lib/ssrf";

describe("isBlockedHost", () => {
  it.each([
    "localhost",
    "api.localhost",
    "service.internal",
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "[::1]",
    "::1",
    "[fd00::1]",
    "[fe80::1]",
    "[::ffff:127.0.0.1]",
    "[::ffff:169.254.169.254]",
  ])("blocks %s", (host) => {
    expect(isBlockedHost(host)).toBe(true);
  });

  it.each([
    "example.com",
    "fdsomething.example.com",
    "fe80.example.com",
    "cdn.supabase.co",
    "8.8.8.8",
    "172.32.0.1",
    "172.15.0.1",
    "[2001:4860:4860::8888]",
  ])("allows %s", (host) => {
    expect(isBlockedHost(host)).toBe(false);
  });
});
