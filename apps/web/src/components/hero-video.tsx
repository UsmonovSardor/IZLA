/** Hero jonli video (izla.mp4) — shisha ramka + aurora yog'du, avto-play loop muted. */
export function HeroVideo() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Orqa aurora yog'du */}
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[36px] bg-gradient-to-br from-brand/25 via-violet/10 to-teal/25 blur-2xl"
        aria-hidden
      />
      <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.05] shadow-[0_40px_90px_-25px_rgba(0,0,0,.65)]">
        <video
          className="block aspect-video h-full w-full object-cover"
          src="/izla.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
    </div>
  );
}
