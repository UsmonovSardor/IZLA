import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Phone, Instagram, Send, Facebook, Youtube, Globe, ShieldCheck } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { api, type VendorDetail } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BookingWidget } from '@/components/booking-widget';
import { JsonLd } from '@/components/json-ld';
import { abs, breadcrumbJsonLd, vendorJsonLd } from '@/lib/seo';
import { sectionConfig } from '@/lib/vendor-sections';
import { VendorHero } from '@/components/vendor/vendor-hero';
import { StatCounters } from '@/components/vendor/stat-counters';
import { ServiceMenu } from '@/components/vendor/service-menu';
import { WhyChoose } from '@/components/vendor/why-choose';
import { TeamGrid, type TeamMember } from '@/components/vendor/team-grid';
import { HowItWork } from '@/components/vendor/how-it-work';
import { Testimonials } from '@/components/vendor/testimonials';
import { Gallery } from '@/components/vendor/gallery';
import { LocationMap } from '@/components/vendor/location-map';
import type { Metadata } from 'next';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const FALLBACK = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80&auto=format&fit=crop';
const loadVendor = cache((slug: string, locale: string) => api.vendor(slug, locale));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const v = await loadVendor(slug, locale);
    const title = v.district ? `${v.name} — ${v.district}` : v.name;
    const description = (v.attributes?.tagline || v.description || `${v.name} — Izla.uz'da reyting, xizmatlar va narxlar. Online navbatsiz bron qiling.`).slice(0, 165);
    const img = v.photos?.[0];
    return {
      title,
      description,
      alternates: { canonical: `/vendor/${slug}` },
      openGraph: { type: 'website', title, description, url: abs(`/vendor/${slug}`), ...(img ? { images: [img] } : {}) },
      twitter: { card: 'summary_large_image', title, description, ...(img ? { images: [img] } : {}) },
    };
  } catch {
    return { title: 'Topilmadi', robots: { index: false } };
  }
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('vendorPage');
  let v: VendorDetail;
  try {
    v = await loadVendor(slug, locale);
  } catch {
    notFound();
  }

  const cfg = sectionConfig(v.category?.slug);
  const has = (id: string) => cfg.sections.includes(id as never);
  const a = v.attributes ?? {};
  const accent = cfg.accent;

  // ── Rasmlar ────────────────────────────────────────────────────────────────
  const gallery = uniq([...(v.photos ?? []), ...(a.gallery ?? [])]);
  const heroImg = gallery[0] ?? FALLBACK;
  const whyImg = gallery[1] ?? heroImg;
  const howImg = gallery[2] ?? gallery[0] ?? FALLBACK;

  // ── Jamoa (attributes.team → staff fallback) ────────────────────────────────
  const team: TeamMember[] = (a.team?.length
    ? a.team
    : v.staff.map((s) => ({ name: s.name, role: s.role ?? undefined, photo: s.avatarUrl ?? undefined }))
  ).slice(0, 8);

  // ── Counterlar (attributes.counters → hosil qilingan) ───────────────────────
  const nowYear = new Date().getFullYear();
  const expYears = a.experienceYears ?? (a.established ? nowYear - a.established : undefined);
  const counters = a.counters?.length
    ? a.counters
    : [
        { value: v.rating.toFixed(1), label: t('counters.rating') },
        { value: `${v.reviewCount}+`, label: t('counters.reviews') },
        { value: `${team.length || v.staff.length || 3}`, label: t('counters.doctors') },
        ...(expYears ? [{ value: `${expYears}+`, label: t('counters.experience') }] : []),
      ].slice(0, 4);

  // ── Highlights & steps (konfiguratsiya + i18n) ──────────────────────────────
  const highlights = cfg.highlights.map((h) => ({
    icon: h.icon,
    title: t(`cat.${cfg.i18nKey}.highlights.${h.key}.t`),
    text: t(`cat.${cfg.i18nKey}.highlights.${h.key}.d`),
  }));
  const steps = cfg.steps.map((s) => ({
    icon: s.icon,
    title: t(`cat.${cfg.i18nKey}.steps.${s.key}.t`),
    text: t(`cat.${cfg.i18nKey}.steps.${s.key}.d`),
  }));

  const crumbs = [{ name: 'Bosh sahifa', path: '/' }];
  if (v.category) crumbs.push({ name: v.category.name, path: `/qidiruv?category=${v.category.slug}` });
  crumbs.push({ name: v.name, path: `/vendor/${v.slug}` });

  const socials = v.socials ?? {};
  const socialItems: { href: string; Icon: typeof Instagram }[] = [];
  if (socials.instagram) socialItems.push({ href: socials.instagram, Icon: Instagram });
  if (socials.telegram) socialItems.push({ href: socials.telegram, Icon: Send });
  if (socials.facebook) socialItems.push({ href: socials.facebook, Icon: Facebook });
  if (socials.youtube) socialItems.push({ href: socials.youtube, Icon: Youtube });
  if (socials.website) socialItems.push({ href: socials.website, Icon: Globe });

  const hours = v.hours ?? {};

  return (
    <div className="space-y-14">
      <JsonLd data={[vendorJsonLd(v), breadcrumbJsonLd(crumbs)]} />

      <VendorHero
        name={v.name}
        tagline={a.tagline || v.description}
        categoryName={v.category?.name}
        categoryIcon={v.category?.icon}
        district={v.district}
        rating={v.rating}
        reviewCount={v.reviewCount}
        verified={v.verified}
        image={heroImg}
        phone={v.phone}
        established={a.established}
        accent={accent}
        labels={{
          book: t('hero.book'), call: t('hero.call'), basedOn: t('hero.basedOn'),
          established: t('hero.established'), verified: t('hero.verified'),
        }}
      />

      {has('counters') && <StatCounters counters={counters} accent={accent} />}

      {/* Asosiy: xizmatlar + about | sticky bron */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {has('services') && (
            <ServiceMenu
              heading={t(cfg.servicesLabelKey)}
              subheading={t('sections.servicesSub')}
              services={v.services}
              accent={accent}
              minutesLabel={t('minutes')}
              fromLabel={t('services.from')}
              freeLabel={t('services.free')}
            />
          )}

          {(v.description || a.amenities?.length) && (
            <section>
              <h2 className="font-display text-2xl font-bold text-navy">{t('sections.aboutTitle')}</h2>
              {v.description && <p className="mt-3 leading-relaxed text-ink">{v.description}</p>}
              {a.amenities?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.amenities.map((am, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink">
                      <ShieldCheck className="h-4 w-4" style={{ color: accent }} />{am}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
          )}
        </div>

        {/* Sticky bron + aloqa */}
        <aside id="booking" className="h-fit space-y-4 lg:sticky lg:top-20 scroll-mt-24">
          {v.services.length > 0 ? (
            <BookingWidget services={v.services} vendorName={v.name} />
          ) : (
            <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
              <Button className="w-full" disabled>{t('noBooking')}</Button>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate2">{t('sections.contactTitle')}</h3>
              {v.phone && (
                <a href={`tel:${v.phone}`} className="mt-2 flex items-center gap-2 text-sm font-medium text-ink hover:text-[color:var(--a)]" style={{ ['--a' as string]: accent }}>
                  <Phone className="h-4 w-4" style={{ color: accent }} />{v.phone}
                </a>
              )}
              {(v.address || v.district) && (
                <div className="mt-2 flex items-start gap-2 text-sm text-slate2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />{v.address || v.district}
                </div>
              )}
            </div>

            {(hours.mon_fri || hours.sat || hours.sun) && (
              <div className="border-t border-line pt-4">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate2">
                  <Clock className="h-3.5 w-3.5" />{t('sections.hoursTitle')}
                </h3>
                <dl className="mt-2 space-y-1 text-sm">
                  {hours.mon_fri && <Row k={t('hours.monFri')} v={hours.mon_fri} />}
                  {hours.sat && <Row k={t('hours.sat')} v={hours.sat === 'off' ? t('hours.closed') : hours.sat} />}
                  {hours.sun && <Row k={t('hours.sun')} v={hours.sun === 'off' ? t('hours.closed') : hours.sun} />}
                </dl>
              </div>
            )}

            {socialItems.length > 0 && (
              <div className="flex gap-2 border-t border-line pt-4">
                {socialItems.map(({ href, Icon }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate2 transition hover:border-transparent hover:bg-[color:var(--a)] hover:text-white"
                    style={{ ['--a' as string]: accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {has('whyChoose') && (
        <WhyChoose
          heading={t(`cat.${cfg.i18nKey}.whyTitle`)}
          subheading={t('sections.whyChooseSub')}
          items={highlights}
          image={whyImg}
          accent={accent}
        />
      )}

      {has('team') && team.length > 0 && (
        <TeamGrid
          heading={t(cfg.teamLabelKey)}
          subheading={t('sections.teamSub')}
          members={team}
          accent={accent}
          expLabel={t('team.exp')}
        />
      )}

      {has('howItWork') && (
        <HowItWork
          heading={t(`cat.${cfg.i18nKey}.howTitle`)}
          subheading={t('sections.howSub')}
          steps={steps}
          image={howImg}
          accent={accent}
        />
      )}

      {has('gallery') && gallery.length > 1 && (
        <Gallery heading={t('sections.galleryTitle')} subheading={t('sections.gallerySub')} photos={gallery} accent={accent} />
      )}

      {has('reviews') && v.reviews.length > 0 && (
        <Testimonials
          heading={t('sections.reviewsTitle')}
          subheading={t('sections.reviewsSub')}
          reviews={v.reviews}
          accent={accent}
          anonLabel={t('reviews.anon')}
          ratingLabel={t('reviews.rating')}
        />
      )}

      {has('map') && (
        <LocationMap
          vendor={v}
          heading={t('sections.mapTitle')}
          subheading={v.district || t('sections.contactTitle')}
          accent={accent}
          detailsWord={t('sections.details')}
          reviewsWord={t('reviews.word')}
          directionsWord={t('sections.directions')}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate2">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}
