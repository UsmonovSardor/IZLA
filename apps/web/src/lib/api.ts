import { authFetch } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Ochiq GET. `revalidate` (soniya) berilsa — Next ISR keshi (katalog uchun: tez
 * TTFB, masshtab). Berilmasa — no-store (har doim yangi; foydalanuvchiga bog'liq
 * yoki tez o'zgaruvchi ma'lumot uchun).
 */
async function get<T>(path: string, revalidate?: number): Promise<T> {
  const res = await fetch(
    `${BASE}${path}`,
    revalidate != null ? { next: { revalidate } } : { cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// Avtorizatsiyali so'rov — authFetch (Bearer xotiradan + 401'da jim refresh).
async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `API ${path} → ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* ignore */ }
    const e = new Error(msg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.json() as Promise<T>;
}

/** Ochiq (avtorizatsiyasiz) POST — JSON. */
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

/** So'rov satriga `lang` ni to'g'ri ulaydi (? yoki & bilan). */
function withLang(qs: string, lang?: string): string {
  if (!lang) return qs;
  return qs.includes('?') ? `${qs}&lang=${lang}` : `${qs}?lang=${lang}`;
}

export const api = {
  // --- Ommaviy katalog (ISR keshlangan — kam o'zgaradi, tez TTFB) ---
  categories: (lang?: string) => get<Category[]>(withLang('/categories', lang), 300),
  vendors: (qs = '', lang?: string) => get<Vendor[]>(withLang(`/vendors${qs}`, lang), 60),
  vendor: (slug: string, lang?: string) => get<VendorDetail>(withLang(`/vendors/${slug}`, lang), 120),
  facets: (qs = '', lang?: string) => get<Facets>(withLang(`/vendors/facets${qs}`, lang), 120),
  districts: () => get<{ district: string; count: number }[]>('/vendors/districts', 600),
  assistantStatus: () => get<{ enabled: boolean }>('/assistant/status', 300),
  assistantChat: (messages: ChatTurn[], lang?: string) =>
    post<AssistantReply>('/assistant/chat', { messages, lang }),
  properties: (qs = '') => get<Property[]>(`/properties${qs}`, 120),
  property: (id: string) => get<PropertyDetail>(`/properties/${id}`, 120),
  // Slotlar tez o'zgaradi (bron bo'ladi) — har doim yangi.
  availability: (serviceId: string, date: string) =>
    get<Availability>(`/bookings/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}`),
  createBooking: (body: { serviceId: string; slotStart: string; note?: string }) =>
    authed<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  myBookings: () => authed<Booking[]>('/bookings/me'),
  cancelBooking: (id: string) => authed<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  createPayment: (body: { bookingId: string; provider: 'PAYME' | 'CLICK' }) =>
    authed<PaymentInvoice>('/payments', { method: 'POST', body: JSON.stringify(body) }),
  paymentStatus: (id: string) => authed<Payment>(`/payments/${id}`),

  // --- Izla Ish (vakansiyalar, ochiq) ---
  jobs: (qs = '') => get<JobsResult>(`/jobs${qs}`, 60),
  jobFacets: () => get<JobFacets>('/jobs/facets', 120),
  job: (id: string) => get<JobDetail>(`/jobs/${id}`, 60),

  // --- Izla Ish (ariza + rezyume, avtorizatsiyali) ---
  applyJob: (id: string, coverNote?: string) =>
    authed<ApplyResult>(`/jobs/${id}/apply`, { method: 'POST', body: JSON.stringify({ coverNote }) }),
  jobApplicationStatus: (id: string) => authed<ApplicationStatus>(`/jobs/${id}/application`),
  myApplications: () => authed<MyApplication[]>('/jobs/me/applications'),
  savedJobIds: () => authed<string[]>('/jobs/me/saved/ids'),
  savedJobs: () => authed<SavedJob[]>('/jobs/me/saved'),
  toggleSavedJob: (id: string) => authed<{ saved: boolean }>(`/jobs/${id}/save/toggle`, { method: 'POST' }),
  resumeMe: () => authed<Resume | null>('/resume/me'),
  saveResume: (body: ResumeInput) => authed<Resume>('/resume', { method: 'PUT', body: JSON.stringify(body) }),

  // --- Ish beruvchi kabineti + mini-ATS ---
  employerCompanies: () => authed<EmployerCompany[]>('/employer/companies'),
  employerCreateCompany: (body: EmployerCompanyInput) =>
    authed<EmployerCompany>('/employer/companies', { method: 'POST', body: JSON.stringify(body) }),
  employerCompany: (id: string) => authed<EmployerCompany>(`/employer/companies/${id}`),
  employerUpdateCompany: (id: string, body: Partial<EmployerCompanyInput>) =>
    authed<EmployerCompany>(`/employer/companies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  employerStats: (id: string) => authed<EmployerStats>(`/employer/companies/${id}/stats`),
  employerJobs: (id: string) => authed<EmployerJob[]>(`/employer/companies/${id}/jobs`),
  employerCreateJob: (companyId: string, body: EmployerJobInput) =>
    authed<EmployerJob>(`/employer/companies/${companyId}/jobs`, { method: 'POST', body: JSON.stringify(body) }),
  employerUpdateJob: (id: string, body: Partial<EmployerJobInput>) =>
    authed<EmployerJob>(`/employer/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  employerArchiveJob: (id: string) => authed<EmployerJob>(`/employer/jobs/${id}`, { method: 'DELETE' }),
  employerJobApplications: (id: string) => authed<AtsApplication[]>(`/employer/jobs/${id}/applications`),
  employerUpdateApplication: (id: string, status: ApplicationStatusValue) =>
    authed<{ id: string; status: ApplicationStatusValue }>(`/employer/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // --- Sadoqat tangalari ---
  coins: () => authed<CoinsSummary>('/coins'),

  // --- Bildirishnomalar ---
  notifications: () => authed<AppNotification[]>('/notifications'),
  notificationsUnread: () => authed<{ count: number }>('/notifications/unread-count'),
  notificationsReadAll: () => authed<{ ok: true }>('/notifications/read-all', { method: 'POST' }),
  notificationRead: (id: string) => authed<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST' }),

  // --- Sharhlar ---
  reviewMine: (vendorId: string) => authed<{ review: MyReview | null }>(`/reviews/mine/${vendorId}`),
  createReview: (body: { vendorId: string; rating: number; text?: string }) =>
    authed<ReviewResult>('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // --- Sevimlilar ---
  // --- Taklif tizimi ---
  referralMe: () => authed<ReferralInfo>('/referrals/me'),
  claimReferral: (code: string) => authed<ReferralClaim>('/referrals/claim', { method: 'POST', body: JSON.stringify({ code }) }),

  favoriteIds: () => authed<string[]>('/favorites/ids'),
  toggleFavorite: (vendorId: string) =>
    authed<{ favorited: boolean }>('/favorites/toggle', { method: 'POST', body: JSON.stringify({ vendorId }) }),
  favorites: (lang?: string) => authed<Vendor[]>(withLang('/favorites', lang)),

  // --- Kabinet (vendor egasi) ---
  kabinetVendors: () => authed<KabinetVendor[]>('/kabinet/vendors'),
  kabinetVendor: (id: string) => authed<KabinetVendorDetail>(`/kabinet/vendors/${id}`),
  kabinetUpdateVendor: (id: string, body: Partial<KabinetVendorProfile>) =>
    authed<KabinetVendorDetail>(`/kabinet/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  kabinetStats: (id: string) => authed<KabinetStats>(`/kabinet/vendors/${id}/stats`),
  kabinetBookings: (id: string) => authed<KabinetBooking[]>(`/kabinet/vendors/${id}/bookings`),
  kabinetCreateService: (id: string, body: KabinetServiceInput) =>
    authed<KabinetService>(`/kabinet/vendors/${id}/services`, { method: 'POST', body: JSON.stringify(body) }),
  kabinetUpdateService: (id: string, body: Partial<KabinetServiceInput>) =>
    authed<KabinetService>(`/kabinet/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  kabinetDeleteService: (id: string) =>
    authed<KabinetService>(`/kabinet/services/${id}`, { method: 'DELETE' }),
  kabinetUpdateBooking: (id: string, status: string) =>
    authed<{ id: string; status: string }>(`/kabinet/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  registerVendor: (body: RegisterVendorInput) =>
    authed<{ id: string; slug: string; status: string }>('/kabinet/register', { method: 'POST', body: JSON.stringify(body) }),

  // --- Tariflar (platforma take-rate) ---
  plans: () => get<PlanConfig[]>('/plans', 600),
  kabinetEarnings: (id: string) => authed<VendorEarnings>(`/kabinet/vendors/${id}/earnings`),
  kabinetSelectPlan: (id: string, plan: VendorPlanId) =>
    authed<{ id: string; plan: VendorPlanId; planExpiresAt: string | null }>(`/kabinet/vendors/${id}/plan`, { method: 'POST', body: JSON.stringify({ plan }) }),

  // --- Sug'urta (embedded insurance) ---
  insuranceProducts: (qs = '') => get<InsuranceProduct[]>(`/insurance/products${qs}`, 120),
  insuranceFacets: (qs = '') => get<InsuranceFacets>(`/insurance/facets${qs}`, 120),
  insuranceProduct: (slug: string) => get<InsuranceProductDetail>(`/insurance/product/${slug}`, 120),
  insuranceQuote: (productId: string, params: Record<string, unknown>) =>
    post<InsuranceQuote>('/insurance/quote', { productId, params }),
  insuranceBuy: (body: { productId: string; params: Record<string, unknown>; termMonths?: number }) =>
    authed<InsurancePolicy>('/insurance/buy', { method: 'POST', body: JSON.stringify(body) }),
  myPolicies: () => authed<MyPolicy[]>('/insurance/mine'),

  // --- Ipoteka (embedded lending) ---
  mortgagePrograms: (qs = '') => get<MortgageProgram[]>(`/mortgage/programs${qs}`, 120),
  mortgageFacets: (qs = '') => get<MortgageFacets>(`/mortgage/facets${qs}`, 120),
  mortgageProgram: (slug: string) => get<MortgageProgramDetail>(`/mortgage/program/${slug}`, 120),
  mortgageCalc: (body: MortgageCalcInput) => post<MortgageCalcResult>('/mortgage/calc', body),
  applyMortgage: (body: MortgageApplyInput) =>
    authed<MortgageLead>('/mortgage/apply', { method: 'POST', body: JSON.stringify(body) }),
  myMortgageLeads: () => authed<MyMortgageLead[]>('/mortgage/mine'),

  // --- Nasiya / BNPL ---
  nasiyaProviders: () => get<NasiyaProvider[]>('/nasiya/providers', 300),
  nasiyaQuote: (amount: number, months: number, providerId?: string) =>
    post<NasiyaQuoteRow[]>('/nasiya/quote', { amount, months, providerId }),
  applyNasiya: (body: NasiyaApplyInput) =>
    authed<NasiyaLead>('/nasiya/apply', { method: 'POST', body: JSON.stringify(body) }),
  myNasiyaLeads: () => authed<MyNasiyaLead[]>('/nasiya/mine'),

  base: BASE,
};

// --- Nasiya tiplari ---
export interface NasiyaProvider {
  id: string; name: string; slug: string; logoUrl?: string | null; color?: string | null;
  rating: number; verified: boolean; terms: Record<string, number>; months: number[];
  minAmount: number | null; maxAmount: number | null; features: string[]; popular: boolean;
}
export interface NasiyaQuoteRow {
  provider: { id: string; name: string; slug: string; logoUrl?: string | null; color?: string | null; rating: number; popular: boolean; features: string[]; months: number[] };
  months: number; amount: number; monthlyPayment: number; totalPayment: number; overpayment: number; markupPct: number; available: boolean;
}
export interface NasiyaApplyInput {
  providerId: string; amount: number; months: number; vendorId?: string; serviceId?: string; name: string; phone: string;
}
export interface NasiyaLead {
  id: string; status: string; months: number; monthlyPayment: number; totalPayment: number; createdAt: string;
}
export interface MyNasiyaLead {
  id: string; status: string; amount: number; months: number; monthlyPayment: number; totalPayment: number; createdAt: string;
  provider: { name: string; slug: string; logoUrl?: string | null; color?: string | null };
}

// --- Ipoteka tiplari ---
export interface BankBrief {
  name: string; slug: string; logoUrl?: string | null; rating: number; verified: boolean; color?: string | null;
}
export interface MortgageProgram {
  id: string; name: string; slug: string; summary?: string | null;
  annualRate: number; maxTermMonths: number; minDownPct: number; maxAmount: number | null;
  propertyTypes: string[]; features: string[]; monthlyFrom: number;
  rating: number; popular: boolean; subsidized: boolean; bank: BankBrief;
}
export interface MortgageCalcResult {
  price: number; downPayment: number; loanAmount: number; monthlyPayment: number;
  totalPayment: number; overpayment: number; termMonths: number; annualRate: number;
  breakdown: BreakdownRow[];
  program: { id: string; name: string; slug: string; bank: { name: string; slug: string } } | null;
  minDownPct: number; maxTermMonths: number;
}
export interface MortgageProgramDetail extends MortgageProgram {
  preview: MortgageCalcResult;
}
export interface MortgageFacets {
  total: number; subsidized: number;
  banks: { slug: string; name: string; logoUrl?: string | null; count: number }[];
  rateRange: { min: number; max: number } | null;
}
export interface MortgageCalcInput {
  programId?: string; price: number; downPct?: number; downAmount?: number; termMonths: number; annualRate?: number;
}
export interface MortgageApplyInput extends MortgageCalcInput {
  propertyId?: string; complexId?: string; name: string; phone: string;
}
export interface MortgageLead {
  id: string; status: string; amount: number; monthlyPayment: number; termMonths: number; createdAt: string;
}
export interface MyMortgageLead {
  id: string; status: string; amount: number; propertyPrice: number; downPayment: number;
  monthlyPayment: number; termMonths: number; createdAt: string;
  program: { name: string; slug: string; annualRate: number; bank: { name: string; slug: string; logoUrl?: string | null; color?: string | null } } | null;
}

// --- Sug'urta tiplari ---
export type InsuranceTypeId = 'OSAGO' | 'KASKO' | 'TRAVEL' | 'PROPERTY' | 'ACCIDENT' | 'HEALTH';
export interface InsurerBrief {
  name: string; slug: string; logoUrl?: string | null; rating: number; verified: boolean; color?: string | null;
}
export interface InsuranceProduct {
  id: string; type: InsuranceTypeId; name: string; slug: string; summary?: string | null;
  priceFrom: number; coverageFrom: number; features: string[]; termsMonths: number[];
  rating: number; popular: boolean; insurer: InsurerBrief;
}
export interface BreakdownRow { label: string; factor?: number; value?: number; note?: string }
export interface InsuranceQuote {
  productId: string; type: InsuranceTypeId; name: string; premium: number; insuredSum: number;
  commission: number; breakdown: BreakdownRow[]; insurer?: { name: string; slug: string };
}
export interface FormField {
  name: string; kind: 'select' | 'number' | 'bool'; options?: string[];
  min?: number; max?: number; step?: number; default: unknown;
}
export interface InsuranceProductDetail extends InsuranceProduct {
  form: FormField[]; defaults: Record<string, unknown>;
  preview: { premium: number; insuredSum: number; breakdown: BreakdownRow[]; commission: number };
}
export interface InsuranceFacetType { type: InsuranceTypeId; count: number }
export interface InsuranceFacetInsurer { slug: string; name: string; logoUrl?: string | null; count: number }
export interface InsuranceFacets {
  total: number; types: InsuranceFacetType[]; insurers: InsuranceFacetInsurer[];
  priceRange: { min: number; max: number } | null;
}
export interface InsurancePolicy {
  id: string; policyNumber?: string | null; premium: number; insuredSum: number;
  status: string; termMonths: number; endsAt?: string | null;
}
export interface MyPolicy {
  id: string; type: InsuranceTypeId; status: string; premium: number; insuredSum: number;
  breakdown: BreakdownRow[]; params: Record<string, unknown>; termMonths: number;
  policyNumber?: string | null; startsAt?: string | null; endsAt?: string | null; createdAt: string;
  product: { name: string; slug: string; insurer: { name: string; slug: string; logoUrl?: string | null; color?: string | null } };
}

export type JobEmployment = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type JobExperience = 'NONE' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';
export interface JobCompany {
  id?: string; name: string; slug: string; logo?: string | null; verified: boolean;
  district?: string | null; cover?: string | null; about?: string | null;
  industry?: string | null; size?: string | null; website?: string | null;
}
export interface Job {
  id: string; title: string; description: string; employment: JobEmployment; remote: boolean;
  region?: string | null; experience: JobExperience; salaryMin?: number | null; salaryMax?: number | null;
  currency: string; skills: string[]; category?: string | null; featured: boolean; views: number;
  createdAt: string; company?: JobCompany;
}
export interface JobDetail extends Job { applicants: number; company: JobCompany }
export interface SavedJob extends Job { savedAt: string }
export interface ReferralInfo { code: string; invitedCount: number; coinsEarned: number; referrerReward: number; joinReward: number }
export interface ReferralClaim { ok: boolean; reason?: 'already' | 'self' | 'invalid'; joinReward?: number }
export interface JobsResult { total: number; page: number; limit: number; items: Job[] }
export interface JobFacets {
  total: number; employment: Record<string, number>; experience: Record<string, number>;
  categories: { name: string; count: number }[];
}

export type ApplicationStatusValue = 'NEW' | 'VIEWED' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
export interface ApplyResult { id: string; status: ApplicationStatusValue; createdAt: string; hasResume: boolean }
export interface ApplicationStatus {
  applied: boolean;
  application: { id: string; status: ApplicationStatusValue; createdAt: string } | null;
}
export interface MyApplication {
  id: string; status: ApplicationStatusValue; coverNote: string | null; createdAt: string;
  job: {
    id: string; title: string; employment: JobEmployment; remote: boolean; region: string | null;
    salaryMin: number | null; salaryMax: number | null; currency: string; status: string;
    company: { name: string; slug: string; logo: string | null; verified: boolean };
  };
}
export interface ResumeExperience { title: string; company: string; from?: string; to?: string; desc?: string }
export interface ResumeEducation { degree: string; school: string; year?: string }
export interface ResumeInput {
  headline: string; summary?: string; skills?: string[]; experienceYears?: number;
  phone?: string; email?: string; experience?: ResumeExperience[]; education?: ResumeEducation[];
}
export interface Resume extends ResumeInput {
  id: string; userId: string; skills: string[]; experienceYears: number;
  experience: ResumeExperience[]; education: ResumeEducation[];
  fileUrl?: string | null; createdAt: string; updatedAt: string;
}

export interface EmployerCompanyInput {
  name: string; industry?: string; size?: string; about?: string;
  district?: string; website?: string; logo?: string; cover?: string;
}
export interface EmployerCompany {
  id: string; slug: string; name: string; verified: boolean; jobCount?: number;
  logo: string | null; cover: string | null; industry: string | null;
  size: string | null; about: string | null; district: string | null; website: string | null;
}
export interface EmployerJobInput {
  title: string; description: string; employment?: JobEmployment; remote?: boolean;
  region?: string; experience?: JobExperience; salaryMin?: number; salaryMax?: number;
  currency?: string; skills?: string[]; category?: string; status?: JobStatusValue;
}
export type JobStatusValue = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export interface EmployerJob {
  id: string; title: string; description: string; employment: JobEmployment; remote: boolean;
  region: string | null; experience: JobExperience; salaryMin: number | null; salaryMax: number | null;
  currency: string; skills: string[]; category: string | null; status: JobStatusValue;
  featured: boolean; views: number; createdAt: string; applicants: number;
}
export interface EmployerStats {
  jobsTotal: number; jobsActive: number; jobsByStatus: Record<string, number>;
  applicationsTotal: number; applicationsByStatus: Record<string, number>;
  applicationsNew: number; hired: number; views: number;
}
export interface AtsResume {
  headline: string; summary: string | null; skills: string[]; experienceYears: number;
  phone: string | null; email: string | null;
  experience: ResumeExperience[]; education: ResumeEducation[];
}
export interface AtsApplication {
  id: string; status: ApplicationStatusValue; coverNote: string | null; aiScore: number | null; createdAt: string;
  applicant: { name: string | null; phone: string | null; email: string | null; avatarUrl: string | null };
  resume: AtsResume | null;
}

export interface KabinetVendor {
  id: string; slug: string; name: string; status: string; verified: boolean;
  plan: VendorPlanId; planExpiresAt?: string | null;
  rating: number; reviewCount: number; photos: string[];
  category?: { slug: string; name: string; icon?: string };
  counts: { services: number; bookings: number; reviews: number };
}
export interface PlanConfig {
  id: VendorPlanId; priceMonthly: number; commissionRate: number; photoLimit: number;
  rankBoost: number; featured: boolean; analytics: boolean; featureKeys: string[];
}
export interface VendorEarnings {
  plan: VendorPlanId; commissionRate: number; paidCount: number;
  revenue: number; commission: number; net: number; config: PlanConfig;
}
export interface RegisterVendorInput {
  name: string; categoryId: string; phone?: string; district?: string; address?: string; description?: string;
}
export interface KabinetServiceInput { name: string; price: number; durationMin: number; active?: boolean }
export interface KabinetService { id: string; name: string; price: string; durationMin: number; active: boolean }
export interface KabinetVendorProfile {
  name: string; description: string | null; phone: string | null; address: string | null;
  district: string | null; hours: Record<string, string>; socials: Record<string, string>;
}
export interface KabinetVendorDetail extends KabinetVendorProfile {
  id: string; slug: string; status: string; verified: boolean; rating: number; reviewCount: number;
  photos: string[]; category?: { slug: string; name: string; icon?: string };
  services: KabinetService[];
}
export interface KabinetStats {
  totalBookings: number; bookingsByStatus: Record<string, number>; servicesCount: number;
  rating: number; reviewCount: number; paidCount: number; revenue: string;
}
export interface KabinetBooking {
  id: string; status: string; slotStart: string; slotEnd: string; note?: string;
  service?: { name: string; price: string; durationMin: number };
  user?: { name?: string; phone?: string; avatarUrl?: string | null };
  staff?: { name: string } | null;
  payment?: { status: string; amount: string } | null;
}

export interface CoinLedgerEntry { id: string; delta: number; reason: string; balance: number; createdAt: string }
export interface CoinsSummary { balance: number; ledger: CoinLedgerEntry[] }
export interface AppNotification {
  id: string; type: string; title: string; body: string; href: string; read: boolean; createdAt: string;
}
export interface MyReview { id: string; rating: number; text: string | null; createdAt: string }
export interface ReviewResult {
  id: string; rating: number; text: string | null; createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

export interface Category { id: string; slug: string; name: string; icon?: string; _count?: { vendors: number } }
export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface AssistantReply {
  reply: string;
  vendors: Vendor[];
  filters: Record<string, string | number | boolean> | null;
  searchUrl: string | null;
}
export interface FacetCategory { slug: string; name: string; icon?: string; count: number }
export interface PriceRange { min: number; max: number }
export interface Facets { total: number; categories: FacetCategory[]; priceRange?: PriceRange | null }
export type VendorPlanId = 'FREE' | 'PRO' | 'PREMIUM';
export interface Vendor {
  id: string; slug: string; name: string; description?: string; district?: string;
  lat: number; lng: number; address?: string | null; phone?: string | null;
  rating: number; reviewCount: number; photos: string[]; verified: boolean; plan?: VendorPlanId;
  distanceKm?: number | null; category?: { slug: string; name: string; icon?: string };
}
/** Ijtimoiy tarmoq havolalari (`Vendor.socials` JSON). */
export interface VendorSocials {
  instagram?: string; telegram?: string; facebook?: string; youtube?: string; website?: string;
}
/** Kategoriyaga xos boy kontent (`Vendor.attributes` JSON). Barcha maydonlar ixtiyoriy. */
export interface VendorAttributes {
  tagline?: string;
  established?: number;
  experienceYears?: number;
  /** Statistika counterlari (hero ostidagi raqamlar). value raqam yoki "12+" ko'rinishida. */
  counters?: { value: string; label: string }[];
  /** Jamoa/shifokorlar — ko'rsatish uchun (bron uchun `staff` alohida). */
  team?: { name: string; role?: string; photo?: string; exp?: string }[];
  /** Qo'shimcha galereya rasmlari (`photos`dan tashqari). */
  gallery?: string[];
  /** Imkoniyatlar/qulayliklar teglari. */
  amenities?: string[];
  guarantee?: string;
  emergency?: boolean;
  insurance?: string[];
  priceNote?: string;
}
export interface VendorDetail extends Vendor {
  phone?: string; address?: string; hours?: Record<string, string>;
  socials?: VendorSocials;
  attributes?: VendorAttributes;
  services: { id: string; name: string; price: string; durationMin: number }[];
  staff: { id: string; name: string; avatarUrl?: string | null; role?: string | null }[];
  reviews: {
    id: string; rating: number; text?: string; createdAt: string;
    photos?: string[]; criteria?: Record<string, number>;
    bookingId?: string | null;
    user?: { name?: string; avatarUrl?: string | null };
  }[];
}
export interface Slot { start: string; end: string; available: boolean }
export interface Availability {
  serviceId: string; serviceName: string; vendorId: string; vendorName: string;
  staffId?: string | null; date: string; durationMin: number; slots: Slot[];
}
export interface Booking {
  id: string; status: string; slotStart: string; slotEnd: string; note?: string; createdAt?: string;
  vendor?: { name: string; slug: string; address?: string; phone?: string };
  service?: { name: string; price: string; durationMin: number };
  staff?: { name: string } | null;
  payment?: Payment | null;
}
export type PaymentProviderId = 'PAYME' | 'CLICK';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export interface Payment {
  id: string; status: PaymentStatus; amount: string; provider: string; paidAt?: string | null;
  bookingId?: string | null; currency?: string; createdAt?: string;
}
export interface PaymentInvoice extends Payment {
  checkoutUrl: string;
}
export interface Property {
  id: string; type: string; title: string; price: string; pricePerM2?: string;
  areaM2: number; rooms: number; district?: string; photos: string[]; status: string;
  complex?: { name: string; readinessPercent: number; status: string } | null;
}
export interface PropertyDetail extends Property {
  description?: string; floor?: number; totalFloors?: number;
  complex?: {
    name: string; readinessPercent: number; status: string;
    developer?: { name: string; verified: boolean; rating: number };
    constructionUpdates?: { id: string; date: string; readinessPercent: number; note?: string }[];
  } | null;
}
