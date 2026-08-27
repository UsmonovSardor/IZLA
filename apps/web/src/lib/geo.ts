// Tuman nomi ↔ URL slug (programmatik SEO landinglar uchun).

/** "Mirzo Ulug‘bek" → "mirzo-ulugbek" */
export function districtSlug(d: string): string {
  return d
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** slug bo'yicha haqiqiy tuman nomini topadi. */
export function findDistrictBySlug(slug: string, districts: string[]): string | undefined {
  return districts.find((d) => districtSlug(d) === slug);
}
