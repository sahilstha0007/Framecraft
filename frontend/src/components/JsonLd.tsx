/**
 * Renders JSON-LD structured data as a server-rendered <script> tag so search
 * engines see it in the initial HTML. `</script>`-safe serialization prevents
 * breakout from a malicious string field.
 */
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
