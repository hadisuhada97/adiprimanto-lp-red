"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Briefcase,
  Code2,
  MessageCircle,
  ArrowDown,
} from "lucide-react";

import { useLanguage } from "@/app/lib/language-context";

const WA_URL =
  "https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.";

const About = () => {
  const { t } = useLanguage();
  const stats = t.about.stats;
  const statIcons = [
    <Calendar size={16} key="calendar" />,
    <Briefcase size={16} key="briefcase" />,
    <Code2 size={16} key="code" />,
  ];

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
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-eyebrow">
          01 <span className="eyebrow-sep">/</span> {t.about.eyebrow}
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
            {/* Corner accents */}
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

            {/* Photo */}
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
                src="/adi.webp"
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
              {/* Badge */}
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
                  {t.about.location}
                </span>
              </div>
            </div>
          </div>

          {/* Code deco */}
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
            {t.about.headingLine1} <span className="gradient-text">{t.about.headingHighlight}</span>
          </h2>

          {/* Stats row */}
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
                  {statIcons[i]}
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

          {/* Bio */}
          <div className="flex flex-col gap-3.5">
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {t.about.bio1Prefix}{" "}
              <strong style={{ color: "var(--color-white)", fontWeight: 500 }}>
                {t.about.bioStrong1}
              </strong>{" "}
              {t.about.bio1Middle}{" "}
              <strong style={{ color: "var(--color-white)", fontWeight: 500 }}>
                {t.about.bio1Strong2}
              </strong>{" "}
              {t.about.bio1Suffix}
            </p>
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {t.about.bio2}
            </p>
            <p
              className="text-sm leading-[1.85] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {t.about.bio3}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex gap-4 items-center flex-wrap">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-style"
            >
              {t.about.contactMe} <MessageCircle size={15} />
            </a>
            <a href="#portfolio" className="btn-ghost-style">
              {t.about.viewPortfolio} <ArrowDown size={15} />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};

export default About;
