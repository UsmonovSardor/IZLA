/** Structured data (JSON-LD) — Google rich results uchun. Server komponent. */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify — XSS xavfsiz (ma'lumot obyektdan, string interpolatsiya yo'q)
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
