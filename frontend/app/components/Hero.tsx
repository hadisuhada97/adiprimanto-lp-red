"use client";

import Image from "next/image";
import {
  MessageCircle,
  Download,
  Github,
  Linkedin,
  Instagram,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const WA_URL =
  "https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.";

const metricPositions = [
  "top-0 right-0 -translate-y-1/2 translate-x-4",
  "bottom-0 right-0 translate-y-1/2 translate-x-4",
  "bottom-0 left-0 translate-y-1/2 -translate-x-4",
];

const fallbackMetrics = [
  { iconName: "Zap", label: "Page Speed", value: "98+", color: "#eab308" },
  { iconName: "TrendingUp", label: "Conversion", value: "↑ 32%", color: "#22c55e" },
  { iconName: "Search", label: "SEO Score", value: "A", color: "#EF4444" },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay },
});

const Hero = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const hero = data?.hero?.hero ?? null;
  const c = hero?.content ?? null;
  const cmsMetrics = data?.hero?.metrics ?? [];

  const metrics = (
    cmsMetrics.length > 0
      ? cmsMetrics.map((m, i) => ({
          iconName: m.icon_name ?? fallbackMetrics[i]?.iconName ?? "Zap",
          label: m.label,
          value: m.value,
          color: m.color_hex ?? fallbackMetrics[i]?.color ?? "#EF4444",
        }))
      : fallbackMetrics
  ).map((m, i) => ({ ...m, pos: metricPositions[i] ?? metricPositions[0] }));

  const badge = c?.badge || t.hero.badge;
  const role = c?.role || t.hero.role;
  const headlineLine1 = c?.headline_line_1 || t.hero.headlineLine1;
  const highlightLines = c?.headline_highlight
    ? [c.headline_highlight]
    : t.hero.headlineHighlight;
  const headlineStroke = c?.headline_stroke || t.hero.headlineStroke;
  const downloadLabel = c?.secondary_cta_label || t.hero.downloadCV;
  const consultLabel = c?.primary_cta_label || t.hero.consultFree;
  const downloadUrl = hero?.secondary_cta_url || "/CV_New_ADI_PRIMANTO.pdf";
  const consultUrl = hero?.primary_cta_url || WA_URL;

  return (
  <>
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute -top-40 -right-32 w-200 h-200 rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 65%)",
          animation: "glow-float-1 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-40 -left-20 w-150 h-150 rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)",
          animation: "glow-float-2 15s ease-in-out infinite",
        }}
      />

      {/* ─── LAYOUT ─── */}
      <div
        className="relative z-10 mx-auto w-[78%] max-lg:w-[88%] max-md:w-[92%] grid items-center py-32 max-lg:py-24 max-md:py-16 gap-x-14 max-lg:flex max-lg:flex-col max-lg:gap-12 max-md:gap-8"
        style={{ gridTemplateColumns: "60px 1fr 380px" }}
      >
        {/* Socials column — desktop only */}
        <div className="hidden lg:flex flex-col items-center gap-6">
          {[
            {
              label: "GitHub",
              icon: Github,
              href: "https://github.com/adiprimanto",
            },
            {
              label: "LinkedIn",
              icon: Linkedin,
              href: "https://www.linkedin.com/in/adi-primanto/",
            },
            {
              label: "Instagram",
              icon: Instagram,
              href: "https://www.instagram.com/adiprimanto",
            },
          ].map(({ label, icon: SocialIcon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="transition-all duration-300 hover:-translate-y-1"
              style={{ color: "var(--color-muted)", textDecoration: "none" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-muted)")
              }
            >
              <SocialIcon size={16} />
            </a>
          ))}
          <div
            className="hidden lg:block w-px h-14 mt-2"
            style={{
              background:
                "linear-gradient(to bottom, rgba(239,68,68,0.5), transparent)",
            }}
          />
        </div>

        {/* ─── CENTER: content ─── */}
        <div className="flex flex-col" style={{ minWidth: 0 }}>
          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="mb-7 flex items-center gap-3 w-fit"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                border: "1px solid var(--color-border-2)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: "#3ecfb2",
                  boxShadow: "0 0 10px #3ecfb2",
                  animation: "pulse-dot 2s ease infinite",
                }}
              />
              <span
                className="font-display font-semibold text-[10px] tracking-widest uppercase"
                style={{ color: "var(--color-light)" }}
              >
                {badge}
              </span>
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.div
            {...fadeUp(0.08)}
            className="flex items-center gap-3 mb-5"
          >
            <span
              className="w-6 h-px block"
              style={{
                background:
                  "linear-gradient(to right, var(--color-primary), var(--color-primary-2))",
              }}
            />
            <span
              className="font-display font-medium text-xs tracking-[0.14em] uppercase"
              style={{ color: "var(--color-muted)" }}
            >
              {role}
            </span>
          </motion.div>

          {/* ─── BIG HEADLINE ─── */}
          <motion.div {...fadeUp(0.14)} className="mb-7">
            <h1
              className="font-display font-black leading-none tracking-[-0.03em] uppercase"
              style={{
                fontSize: "clamp(26px, 4vw + 0.5rem, 44px)",
                color: "var(--color-white)",
              }}
            >
              {headlineLine1}
              <br />
              <span className="relative">
                <span
                  className="relative z-10"
                  style={{
                    background: "linear-gradient(135deg, #EF4444, #F59E0B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {highlightLines.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </span>
              </span>
              <br />
              <span
                style={{
                  WebkitTextStroke: "var(--hero-stroke-width, 2px) var(--color-stroke)",
                  color: "var(--hero-stroke-fill, transparent)",
                  display: "inline-block",
                }}
              >
                {headlineStroke}
              </span>
            </h1>
          </motion.div>

          {/* Role */}
          <motion.div
            {...fadeUp(0.22)}
            className="flex items-center gap-x-2 gap-y-0.5 mb-6 font-code flex-wrap"
            style={{ fontSize: "13px", color: "var(--color-light)" }}
          >
            <span
              style={{
                color: "var(--color-primary)",
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              {"</>"}
            </span>
            <span>Adi Primanto</span>
            <span style={{ color: "var(--color-muted)" }}>·</span>
            <span>Software Engineer</span>
            <span style={{ color: "var(--color-muted)" }}>·</span>
            <span>Yogyakarta</span>
          </motion.div>

          {/* Description */}
          <motion.p
            {...fadeUp(0.28)}
            className="text-sm leading-[1.85] font-light max-w-sm mb-4"
            style={{ color: "var(--color-muted)" }}
          >
            {c?.description_prefix || t.hero.descriptionPrefix}{" "}
            <strong style={{ color: "var(--color-white)", fontWeight: 500 }}>
              {c?.description_strong || t.hero.descriptionStrong}
            </strong>{" "}
            {c?.description_suffix || t.hero.descriptionSuffix}
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.35)}
            className="flex flex-wrap gap-3 items-center mb-8"
          >
            <a href={downloadUrl} download className="btn-ghost-style">
              {downloadLabel} <Download size={14} />
            </a>
            <a
              href={consultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-style"
            >
              {consultLabel} <MessageCircle size={14} />
            </a>
          </motion.div>

          {/* Mobile socials — hidden on desktop */}
          <motion.div
            {...fadeUp(0.4)}
            className="flex lg:hidden items-center gap-5 mb-8"
          >
            {[
              {
                label: "GitHub",
                icon: Github,
                href: "https://github.com/adiprimanto",
              },
              {
                label: "LinkedIn",
                icon: Linkedin,
                href: "https://www.linkedin.com/in/adi-primanto/",
              },
              {
                label: "Instagram",
                icon: Instagram,
                href: "https://www.instagram.com/adiprimanto",
              },
            ].map(({ label, icon: SocialIcon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition-all duration-300 hover:-translate-y-1"
                style={{ color: "var(--color-muted)", textDecoration: "none" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-muted)")
                }
              >
                <SocialIcon size={18} />
              </a>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            {...fadeUp(0.42)}
            className="flex items-center gap-4 pt-7"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <p
              className="text-xs font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {c?.trusted_prefix || t.hero.trustedPrefix}{" "}
              <strong style={{ color: "var(--color-white)", fontWeight: 500 }}>
                {c?.trusted_strong || t.hero.trustedStrong}
              </strong>{" "}
              {c?.trusted_suffix || t.hero.trustedSuffix}
            </p>
          </motion.div>
        </div>

        {/* ─── RIGHT: Screenshot ─── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative hidden lg:flex items-center justify-center"
        >
          {/* Rotating rings */}
          <div
            className="absolute w-115 h-115 rounded-full pointer-events-none"
            style={{
              border: "1px solid rgba(239,68,68,0.1)",
              animation: "spin-ring 22s linear infinite",
            }}
          >
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 12px var(--color-primary)",
              }}
            />
          </div>
          <div
            className="absolute w-90 h-90 rounded-full pointer-events-none"
            style={{
              border: "1px solid rgba(245,158,11,0.07)",
              animation: "spin-ring 16s linear infinite reverse",
            }}
          />

          {/* Project screenshot */}
          <div
            className="relative w-85 rounded-2xl overflow-hidden group z-10"
            style={{
              border: "1px solid var(--color-border-2)",
              background: "var(--color-surface)",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{
                background: "var(--color-bg-3)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <div
                className="ml-3 flex-1 rounded px-3 py-1 font-code text-[9px] tracking-[0.04em]"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-muted)",
                }}
              >
                asihangger.com
              </div>
            </div>
            <Image
              src="/project-screenshot.png"
              alt="Featured Project — Asih Angger Fotografi"
              width={340}
              height={260}
              priority
              className="w-full h-auto group-hover:scale-[1.04] transition-transform duration-700"
              style={{ filter: "brightness(0.88)", display: "block" }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0c0c0e]/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Metric badges */}
          {metrics.map(({ iconName, label, value, color, pos }) => (
            <div
              key={label}
              className={`absolute ${pos} flex items-center gap-2 px-3 py-2 rounded-xl z-20`}
              style={{
                background: "rgba(12,12,14,0.92)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${color}22`,
                boxShadow: `0 0 20px ${color}18`,
              }}
            >
              <span style={{ color }}>
                <Icon name={iconName} size={14} />
              </span>
              <div>
                <p
                  className="font-code text-[9px] tracking-[0.06em] uppercase"
                  style={{ color: "var(--color-muted)" }}
                >
                  {label}
                </p>
                <p className="font-display font-bold text-xs" style={{ color }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  </>
  );
};

export default Hero;
