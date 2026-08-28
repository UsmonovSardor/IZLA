import { Car, ShieldCheck, Plane, Home, HeartPulse, Stethoscope, type LucideIcon } from 'lucide-react';
import type { InsuranceTypeId } from './api';

/** Sug'urta turi → ikon + aksent rang (UI). */
export const TYPE_ICON: Record<InsuranceTypeId, LucideIcon> = {
  OSAGO: Car,
  KASKO: ShieldCheck,
  TRAVEL: Plane,
  PROPERTY: Home,
  ACCIDENT: HeartPulse,
  HEALTH: Stethoscope,
};

export const TYPE_ACCENT: Record<InsuranceTypeId, string> = {
  OSAGO: '#2563EB',
  KASKO: '#7C3AED',
  TRAVEL: '#0EA5A4',
  PROPERTY: '#EA580C',
  ACCIDENT: '#DC2626',
  HEALTH: '#059669',
};

export const TYPE_ORDER: InsuranceTypeId[] = ['OSAGO', 'KASKO', 'TRAVEL', 'PROPERTY', 'ACCIDENT', 'HEALTH'];

/** (type, field) → i18n opt-guruh nomi (select variantlari yorliqlari uchun). */
const OPT_GROUP: Record<string, string> = {
  'OSAGO.vehicle': 'vehicle',
  'OSAGO.region': 'region',
  'OSAGO.drivers': 'drivers',
  'OSAGO.experience': 'experience',
  'OSAGO.period': 'period',
  'KASKO.age': 'carage',
  'KASKO.franchise': 'franchise',
  'TRAVEL.region': 'travelregion',
  'TRAVEL.age': 'travelage',
  'TRAVEL.coverage': 'travelcov',
  'PROPERTY.kind': 'kind',
  'ACCIDENT.occupation': 'occupation',
  'HEALTH.plan': 'plan',
  'HEALTH.age': 'healthage',
};

export function optGroup(type: InsuranceTypeId, field: string): string | null {
  return OPT_GROUP[`${type}.${field}`] ?? null;
}

/** (type, field) → maydon yorlig'i i18n kaliti (`fields.<key>`). */
const FIELD_LABEL: Record<string, string> = {
  'KASKO.age': 'carAge',
  'TRAVEL.age': 'travelAge',
  'HEALTH.age': 'healthAge',
};

export function fieldLabelKey(type: InsuranceTypeId, field: string): string {
  return FIELD_LABEL[`${type}.${field}`] ?? field;
}
