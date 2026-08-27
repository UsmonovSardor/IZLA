'use client';

import { useEffect } from 'react';
import { pushRecent, type RecentVendor } from '@/lib/recently-viewed';

/** Vendor sahifasi ochilganda "yaqinda ko'rilgan"ga yozadi (localStorage). Hech narsa render qilmaydi. */
export function RecordRecentView(props: Omit<RecentVendor, 'at'>) {
  useEffect(() => {
    pushRecent(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.slug]);
  return null;
}
