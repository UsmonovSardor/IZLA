'use client';
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { VendorIcon } from './vendor-icon';

export interface WorkStep { icon: string; title: string; text: string }

/** "Qanday ishlaydi" — rasm + bosqichli accordion. */
export function HowItWork({
  heading, subheading, steps, image, accent,
}: {
  heading: string; subheading?: string; steps: WorkStep[]; image: string; accent: string;
}) {
  const [open, setOpen] = useState(0);
  return (
    <section className="grid items-center gap-8 lg:grid-cols-2">
      <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ring-1 ring-line lg:order-1">
        <Image src={image} alt="" fill className="object-cover" sizes="(max-width:1024px) 100vw, 45vw" />
      </div>

      <div className="order-1 lg:order-2">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>

        <div className="mt-6 space-y-3">
          {steps.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: isOpen ? accent : accent + '15', color: isOpen ? '#fff' : accent }}
                  >
                    <VendorIcon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="flex-1 font-display font-semibold text-navy">{s.title}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <p className="px-4 pb-4 pl-[68px] text-sm text-muted">{s.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
