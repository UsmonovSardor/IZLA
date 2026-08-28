/**
 * Sahifa o'tish animatsiyasi — sof CSS (JS'siz). Next har navigatsiyada
 * template'ni qayta mount qiladi → `.page-enter` animatsiyasi har o'tishda
 * yangidan ishlaydi (fade + yuqoriga silliq). framer-motion YUKLANMAYDI.
 * `prefers-reduced-motion` globals.css'da hurmat qilinadi.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
