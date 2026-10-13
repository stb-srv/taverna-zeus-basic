import { describe, expect, it } from "vitest";
import { jsonForScript } from "@/lib/json-ld";

describe("jsonForScript", () => {
  it("escapes '<' so a closing script tag inside a value cannot break out", () => {
    const out = jsonForScript({ reviewBody: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).not.toContain("</script>");
  });

  it("stays valid JSON that parses back to the original data", () => {
    const data = { name: "Taverna <Zeus> & Co", review: "</script> x" };
    expect(JSON.parse(jsonForScript(data))).toEqual(data);
  });

  it("leaves data without '<' unchanged", () => {
    expect(jsonForScript({ a: 1, b: "x" })).toBe('{"a":1,"b":"x"}');
  });
});
