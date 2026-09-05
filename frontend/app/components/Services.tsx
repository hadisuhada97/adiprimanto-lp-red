"use client";

import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const WA_URL =
  "https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.";

const fallbackServiceIcons = ["Rocket", "Globe", "Zap", "ShieldCheck", "Bot", "Smartphone", "ShieldCheck"];
const fallbackStatIcons = ["Clock", "Gauge", "HeartHandshake"];

const Services = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const cmsServices = data?.services?.services ?? [];
  const cmsStats = data?.services?.stats ?? [];
  const services =
    cmsServices.length > 0
      ? cmsServices.map((s, i) => ({
          title: s.title,
          desc: s.description,
          tags: s.tags ?? [],
          num: String(i + 1).padStart(2, "0"),
          iconName: s.icon_name ?? fallbackServiceIcons[i] ?? "Rocket",
        }))
      : t.services.list.map((s, i) => ({
          title: s.title,
          desc: s.desc,
          tags: s.tags,
          num: String(i + 1).padStart(2, "0"),
          iconName: fallbackServiceIcons[i] ?? "Rocket",
        }));
  const stats =
    cmsStats.length > 0
      ? cmsStats.map((s, i) => ({
          value: s.value,
          unit: s.unit,
          label: s.label,
          iconName: s.icon_name ?? fallbackStatIcons[i] ?? "Clock",
        }))
      : t.services.stats.map((s, i) => ({
          value: s.value,
          unit: s.unit,
          label: s.label,
          iconName: fallbackStatIcons[i] ?? "Clock",
        }));

  return (
  <section
    id="services"
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
      <div className="section-eyebrow">
        03 <span className="eyebrow-sep">/</span> {t.services.eyebrow}
      </div>

      <div className="grid lg:grid-cols-2 gap-20 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-10 lg:sticky lg:top-28">
          <div className="flex flex-col gap-5">
            <h2
              className="font-display font-black tracking-[-0.02em] leading-[1.05]"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                color: "var(--color-white)",
              }}
            >
              {t.services.headingLine1} <br />
              <span className="gradient-text">{t.services.headingHighlight}</span>
            </h2>
            <p
              className="text-sm font-light leading-[1.85] max-w-sm"
              style={{ color: "var(--color-muted)" }}
            >
              {t.services.sub}
            </p>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-1 overflow-hidden"
            style={{
              gap: "1px",
              background: "var(--color-border)",
              border: "1px solid var(--color-border)",
              borderRadius: "14px",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-5 transition-colors duration-200"
                style={{ background: "var(--color-bg)", padding: "20px 24px" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-bg-3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--color-bg)")
                }
              >
                <div
                  className="shrink-0"
                  style={{
                    color: "var(--color-primary)",
                    filter: "drop-shadow(0 0 5px rgba(239,68,68,0.4))",
                  }}
                >
                  <Icon name={s.iconName} size={18} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-display font-black leading-none gradient-text"
                      style={{ fontSize: "22px" }}
                    >
                      {s.value}
                    </span>
                    <span
                      className="font-code text-[10px] tracking-[0.06em] uppercase"
                      style={{ color: "var(--color-primary-2)" }}
                    >
                      {s.unit}
                    </span>
                  </div>
                  <span
                    className="text-xs font-light leading-[1.5]"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary-style w-fit"
          >
            {t.services.cta} <ArrowRight size={15} />
          </a>
        </div>

        {/* RIGHT — Service cards */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            gap: "2px",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            background: "var(--color-border)",
          }}
        >
          {services.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-5 transition-all duration-200 group"
              style={{ background: "var(--color-bg)", padding: "24px 28px" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-bg-3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-bg)")
              }
            >
              {/* Number */}
              <span
                className="font-code text-[11px] tracking-[0.06em] mt-0.5 shrink-0"
                style={{ color: "var(--color-primary)" }}
              >
                {s.num}
              </span>

              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className="font-display font-bold tracking-[-0.01em]"
                    style={{ fontSize: "15px", color: "var(--color-white)" }}
                  >
                    {s.title}
                  </h3>
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Icon name={s.iconName} size={17} />
                  </div>
                </div>
                <p
                  className="text-xs leading-[1.75] font-light"
                  style={{ color: "var(--color-muted)" }}
                >
                  {s.desc}
                </p>
                <div className="flex gap-1.5 flex-wrap mt-0.5">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-code text-[10px] tracking-[0.04em] px-2.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-primary-subtle)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        color: "var(--color-primary-2)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
  );
};

export default Services;
