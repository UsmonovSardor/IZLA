'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/** H1 aksentida kategoriya nomlarini aylantirib ko'rsatadi (fade/slide). */
export function RotatingWord({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const list = words.length ? words : ['—'];

  useEffect(() => {
    if (reduce || list.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % list.length), 2200);
    return () => clearInterval(id);
  }, [reduce, list.length]);

  const word = list[i % list.length];

  if (reduce) {
    return <span className="text-gradient">{word}</span>;
  }

  return (
    <span className="relative inline-grid align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          initial={{ y: '0.6em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.6em', opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-gradient col-start-1 row-start-1 whitespace-nowrap"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
