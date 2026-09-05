"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, ArrowDown } from "lucide-react";

import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const WA_URL =
  "https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.";

const fallbackStatIcons = ["CalendarDays", "Briefcase", "Code2"];

const About = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const about = data?.about?.about ?? null;
  const c = about?.content ?? null;
  const cmsStats = data?.about?.stats ?? [];

  const stats =
    cmsStats.length > 0
      ? cmsStats.map((s, i) => ({
          value: s.value,
          label: s.label,
          sub: s.sublabel,
          iconName: s.icon_name ?? fallbackStatIcons[i] ?? "Circle",
        }))
      : t.about.stats.map((s, i) => ({
          value: s.value,
          label: s.label,
          sub: s.sub,
          iconName: fallbackStatIcons[i] ?? "Circle",
        }));

  const eyebrow = c?.eyebrow || t.about.eyebrow;
  const location = c?.location || t.about.location;
  const headline = c?.headline || t.about.headingLine1;
  const headlineHighlight = c?.headline_highlight || t.about.headingHighlight;
  const bio1 =
    c?.bio_paragraph_1 ||
    `${t.about.bio1Prefix} ${t.about.bioStrong1} ${t.about.bio1Middle} ${t.about.bio1Strong2} ${t.about.bio1Suffix}`;
  const bio2 = c?.bio_paragraph_2 || t.about.bio2;
  const bio3 = c?.bio_paragraph_3 || t.about.bio3;
  const primaryCtaLabel = c?.primary_cta_label || t.about.contactMe;
  const secondaryCtaLabel = c?.secondary_cta_label || t.about.viewPortfolio;
  const primaryCtaUrl = about?.primary_cta_url || WA_URL;
  const secondaryCtaUrl = about?.secondary_cta_url || "#portfolio";
  const photoUrl = about?.photo?.url || "/adi.webp";

  return (
  <section
    id="about"
    className="section-padding"
    style={{
      background: "var(--color-bg-2)",
      borderTop: "1px solid var(--color-border)",
    }}
  >
    <div
      style={{ width: "78%", margin: "0 auto" }}
      className="max-lg:w-[88%] max-md:w-[92%]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-eyebrow">
          01 <span className="eyebrow-sep">/</span> {eyebrow}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_1.1fr] items-center gap-20 max-lg:gap-14 max-md:gap-10">
        {/* LEFT — Photo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          <div className="relative w-full max-lg:max-w-100 max-lg:mx-auto">
            <div
              className="absolute -top-px -left-px w-7 h-7 z-10 pointer-events-none"
              style={{
                borderTop: "2px solid var(--color-primary)",
                borderLeft: "2px solid var(--color-primary)",
                borderRadius: "2px 0 0 0",
              }}
            />
            <div
              className="absolute -bottom-px -right-px w-7 h-7 z-10 pointer-events-none"
              style={{
                borderBottom: "2px solid var(--color-primary-2)",
                borderRight: "2px solid var(--color-primary-2)",
                borderRadius: "0 0 2px 0",
              }}
            />
            <div
              className="w-full overflow-hidden relative group"
              style={{
                aspectRatio: "4/5",
                borderRadius: "16px",
                border: "1px solid var(--color-border-2)",
                background: "var(--color-surface)",
              }}
            >
              <Image
                src={photoUrl}
                alt="Adi Primanto"
                fill
                sizes="(max-width: 1024px) 400px, 500px"
                className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                style={{
                  filter: "brightness(0.92) contrast(1.05) saturate(0.9)",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 50%, rgba(12,12,14,0.6) 100%)",
                }}
              />
              <div
                className="absolute bottom-5 left-5 flex items-center gap-2 z-10"
                style={{
                  padding: "8px 16px",
                  background: "rgba(22, 22, 26, 0.92)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--color-border-2)",
                  borderRadius: "100px",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: "#3ecfb2",
                    boxShadow: "0 0 8px #3ecfb2",
                    animation: "pulse-dot 2s ease infinite",
                  }}
                />
                <MapPin size={12} style={{ color: "var(--color-light)" }} />
                <span
                  className="font-display font-semibold text-[11px] tracking-[0.08em] uppercase"
                  style={{ color: "var(--color-light)" }}
                >
                  {location}
                </span>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col gap-0.5 font-code text-xs leading-[1.9]"
            style={{
              padding: "14px 18px",
              background: "var(--color-bg-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
            }}
          >
            <span style={{ color: "#4a4a6a" }}>{"// now.js"}</span>
            <span>
              <span style={{ color: "var(--color-primary-2)" }}>currently</span>
              <span style={{ color: "var(--color-muted)" }}>:</span>{" "}
              <span style={{ color: "#c8a97a" }}>
                &quot;fulltime @ startup&quot;
              </span>
            </span>
            <span>
              <span style={{ color: "var(--color-primary-2)" }}>freelance</span>
              <span style={{ color: "var(--color-muted)" }}>:</span>{" "}
              <span style={{ color: "#3ecfb2" }}>&quot;open ✓&quot;</span>
            </span>
            <span>
              <span style={{ color: "var(--color-primary-2)" }}>building</span>
              <span style={{ color: "var(--color-muted)" }}>:</span>{" "}
              <span style={{ color: "#c8a97a" }}>
                &quot;client websites&quot;
              </span>
            </span>
            <span>
              <span style={{ color: "var(--color-primary-2)" }}>timezone</span>
              <span style={{ color: "var(--color-muted)" }}>:</span>{" "}
              <span style={{ color: "#c8a97a" }}>&quot;UTC+7&quot;</span>
            </span>
          </div>
        </motion.div>

        {/* RIGHT — Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-9"
        >
          <h2
            className="font-display font-black tracking-[-0.02em] leading-[1.1] mt-3"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              color: "var(--color-white)",
            }}
          >
            {headline} <span className="gradient-text">{headlineHighlight}</span>
          </h2>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 overflow-hidden"
            style={{
              gap: "1px",
              background: "var(--color-border)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
            }}
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-1 transition-all duration-300 cursor-default"
                style={{
                  background: "var(--color-bg-3)",
                  padding: "20px 18px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-surface)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--color-bg-3)")
                }
              >
                <div
                  className="text-base mb-1.5"
                  style={{
                    color: "var(--color-primary)",
                    filter: "drop-shadow(0 0 6px rgba(239,68,68,0.4))",
                  }}
                >
                  <Icon name={s.iconName} size={16} />
                </div>
                <div className="font-display font-black leading-none gradient-text text-2xl sm:text-[28px]">
                  {s.value}
                </div>
                <div
                  className="font-display text-sm font-semibold"
                  style={{ color: "var(--color-white)" }}
                >
                  {s.label}
                </div>
                <div
                  className="font-code text-[11px] tracking-[0.04em]"
                  style={{ color: "var(--color-muted)" }}
                >
                  {s.sub}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-3.5">
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {bio1}
            </p>
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {bio2}
            </p>
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {bio3}
            </p>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <a
              href={primaryCtaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-style"
            >
              {primaryCtaLabel} <MessageCircle size={15} />
            </a>
            <a href={secondaryCtaUrl} className="btn-ghost-style">
              {secondaryCtaLabel} <ArrowDown size={15} />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};

export default About;
