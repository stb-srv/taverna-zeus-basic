/**
 * Serialises data for an inline `<script type="application/ld+json">`.
 * `JSON.stringify` alone does not escape `<`, so a string such as
 * `</script><script>…` from user- or Google-supplied text (e.g. a review body)
 * would end the script block early. Escaping `<` as `<` keeps the JSON
 * valid and removes that break-out.
 */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
