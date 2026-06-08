// Renders a JSON-LD <script> tag. Server component — emits into the initial HTML
// so crawlers see the structured data without running JS.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
