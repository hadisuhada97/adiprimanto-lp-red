"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Star,
  MessageSquare,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/lib/language-context";

const testimonials = [
  {
    name: "Asih Angger",
    role: "Photographer",
    project: "Website Portfolio Jasa Fotografi",
    image: "/testimoni/asih.jpeg",
    feedback:
      "Makasih banyak yaa mas adi udah bantu buatin website nya rapi dan sesuai request.. Udah sabar banget juga..makin berkah dan sukses yaa mas adi.. 🤲🏻 aamiin",
    rating: 5,
    accentColor: "var(--color-primary)",
  },
  {
    name: "Dr. Ade Salman Alfarisi",
    role: "Co-Founder & Principal Consultant, DKN Digital",
    project: "Website Company Profile",
    image: "/testimoni/dkn.jpeg",
    feedback:
      "Kami sangat mengapresiasi kerja sama dengan mas Adi Primanto dan team. Selama proses pengerjaan, mereka menunjukkan respons yang baik, komunikasi yang jelas, serta kemampuan teknis yang memadai dalam memahami kebutuhan kami. Website berhasil diselesaikan dengan cukup rapi dan sesuai arahan, termasuk beberapa revisi yang ditangani dengan profesional. Secara keseluruhan, pengalaman bekerja sama berjalan lancar dan memuaskan, sehingga layak dipertimbangkan untuk proyek pengembangan web berikutnya.",
    rating: 5,
    accentColor: "var(--color-primary-2)",
  },
  {
    name: "Rezky Perdana Ramadhansyah",
    role: "CEO & Founder, Sentraoto",
    project: "Website Jual Beli Kendaraan",
    image: "/testimoni/sentra.jpeg",
    feedback:
      "Website nya oke, Responsif. Request revisian nya juga ga pelit. Pengerjaan lumayan cepat beberapa hal yg harusnya add cost tapi ini free",
    rating: 5,
    accentColor: "#3ecfb2",
  },
];

const Testimonial = () => {
  const { t } = useLanguage();
  const testimonialsWithProject = testimonials.map((item, i) => ({
    ...item,
    project: t.testimonial.projects[i],
  }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === testimonialsWithProject.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonialsWithProject.length - 1 : prev - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomed) {
        if (e.key === "Escape") setIsZoomed(false);
      } else {
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === "ArrowRight") nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomed]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const current = testimonialsWithProject[activeIndex];

  return (
    <section
      id="testimoni"
      className="section-padding relative overflow-hidden"
      style={{
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {/* Decorative Glows */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: "var(--color-primary-glow)" }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: "var(--color-primary-2)" }}
      />

      <div
        style={{ width: "78%", margin: "0 auto" }}
        className="max-lg:w-[88%] max-md:w-[92%] relative z-10"
      >
        {/* Eyebrow */}
        <div className="section-eyebrow">
          06 <span className="eyebrow-sep">/</span> {t.testimonial.eyebrow}
        </div>

        {/* Section Header */}
        <div className="mb-12">
          <h2
            className="font-display font-black tracking-[-0.02em] leading-[1.05] mb-4"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              color: "var(--color-white)",
            }}
          >
            {t.testimonial.heading} <span className="gradient-text">{t.testimonial.headingHighlight}</span>
          </h2>
          <p
            className="text-sm font-light max-w-lg leading-[1.8]"
            style={{ color: "var(--color-muted)" }}
          >
            {t.testimonial.sub}
          </p>
        </div>

        {/* Main Grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-20 items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* LEFT — Testimonial Content */}
          <div className="flex flex-col justify-between h-full py-2 min-h-[360px] md:min-h-[400px] lg:min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col gap-6"
              >
                {/* Quote Icon & Rating */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.15)",
                      color: current.accentColor,
                    }}
                  >
                    <MessageSquare size={22} />
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: current.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill="currentColor"
                        className="text-amber-400"
                        style={{
                          filter: "drop-shadow(0 0 6px rgba(245,158,11,0.4))",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Feedback Text */}
                <blockquote
                  className="font-display italic font-medium text-base md:text-lg leading-[1.6] text-white"
                  style={{ textQuote: "none" } as any}
                >
                  &ldquo;{current.feedback}&rdquo;
                </blockquote>

                {/* Client Info */}
                <div className="flex flex-col gap-1 mt-2">
                  <div className="font-display font-bold text-lg text-white flex items-center gap-2">
                    {current.name}
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: current.accentColor }}
                    />
                  </div>
                  <div className="text-xs font-light text-slate-400 flex flex-wrap gap-x-2 gap-y-1 items-center">
                    <span>{current.role}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className="font-code text-[10px] tracking-[0.04em] px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-primary-subtle)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        color: "var(--color-primary-2)",
                      }}
                    >
                      {current.project}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation & Dots */}
            <div className="flex items-center gap-6 mt-8 lg:mt-12">
              {/* Navigation Arrows */}
              <div className="flex gap-3">
                <button
                  onClick={prevSlide}
                  className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-2)",
                    color: "var(--color-light)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-white)";
                    e.currentTarget.style.color = "var(--color-white)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border-2)";
                    e.currentTarget.style.color = "var(--color-light)";
                  }}
                  aria-label={t.testimonial.prevSlide}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-2)",
                    color: "var(--color-light)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-white)";
                    e.currentTarget.style.color = "var(--color-white)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border-2)";
                    e.currentTarget.style.color = "var(--color-light)";
                  }}
                  aria-label={t.testimonial.nextSlide}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {testimonialsWithProject.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: activeIndex === i ? "24px" : "8px",
                      background:
                        activeIndex === i
                          ? "var(--color-primary-2)"
                          : "var(--color-border-2)",
                      cursor: "pointer",
                    }}
                    aria-label={`${t.testimonial.openSlide} ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Phone Mockup Screenshot Slider */}
          <div className="flex justify-center items-center">
            <div className="relative w-64 md:w-72 aspect-[9/19] flex justify-center items-center">
              {/* Glow background behind phone */}
              <div
                className="absolute inset-4 rounded-[40px] filter blur-[40px] opacity-40 transition-all duration-500"
                style={{ background: current.accentColor }}
              />

              {/* Phone Container */}
              <div
                className="relative w-full h-full rounded-[42px] p-2.5 transition-colors duration-500 flex flex-col justify-between overflow-hidden"
                style={{
                  background: "#16161a",
                  border: "4px solid #282830",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                }}
              >
                {/* Phone Speaker & Notch bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-[#282830] rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1 bg-black rounded-full mb-1" />
                </div>

                {/* Inner Screen */}
                <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-black border border-[#222228]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative w-full h-full cursor-pointer group/screen"
                      onClick={() => setIsZoomed(true)}
                    >
                      <Image
                        src={current.image}
                        alt={`Screenshot percakapan testimoni ${current.name}`}
                        fill
                        sizes="(max-width: 768px) 256px, 288px"
                        className="object-cover object-top filter brightness-[0.85] transition-all duration-300 group-hover/screen:scale-102 group-hover/screen:brightness-[0.95]"
                        priority={activeIndex === 0}
                      />

                      {/* Screen Glass Glow/Reflection Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                      {/* Zoom Overlay on Hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/screen:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white scale-90 group-hover/screen:scale-100 transition-transform duration-300">
                          <ZoomIn size={22} />
                        </div>
                        <span className="text-white text-xs font-medium tracking-wide">
                          {t.testimonial.zoomImage}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50 cursor-pointer"
              aria-label={t.testimonial.closeImage}
            >
              <X size={24} />
            </button>

            {/* Lightbox Frame */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative max-w-full max-h-[85vh] aspect-[740/1600] w-[400px] max-md:w-[320px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Stop propagation so clicking on the image doesn't close it
            >
              <Image
                src={current.image}
                alt={`Screenshot testimoni ${current.name} dalam ukuran penuh`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </motion.div>

            {/* Bottom Caption */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-slate-300 text-xs font-light text-center">
              Screenshot Chat Asli &bull; {current.name} ({current.role})
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Testimonial;
