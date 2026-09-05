"use client";

import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const colors = ["#f97316", "#a855f7", "#22c55e"];
const fallbackIcons = ["Zap", "Layout", "Smartphone"];

const PainPoints = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const cms = data?.pain_points ?? [];
  const points =
    cms.length > 0
      ? cms.map((p, i) => ({
          title: p.title,
          desc: p.description,
          iconName: p.icon_name ?? fallbackIcons[i] ?? "Zap",
          color: colors[i % colors.length],
        }))
      : t.painPoints.points.map((p, i) => ({
          title: p.title,
          desc: p.desc,
          iconName: fallbackIcons[i] ?? "Zap",
          color: colors[i % colors.length],
        }));

  return (
  <section
    className="section-padding"
    style={{
      background: "var(--color-bg)",
      borderTop: "1px solid var(--color-border)",
    }}
  >
    <div
      style={{ width: "78%", margin: "0 auto" }}
      className="max-lg:w-[88%] max-md:w-[92%]"
    >
      {/* Eyebrow */}
      <div className="section-eyebrow">
        02 <span className="eyebrow-sep">/</span> {t.painPoints.eyebrow}
      </div>

      <h2
        className="font-display font-black tracking-[-0.02em] leading-[1.05] mb-3"
        style={{
          fontSize: "clamp(22px, 4vw, 46px)",
          color: "var(--color-white)",
        }}
      >
        {t.painPoints.heading}{" "}
        <span className="gradient-text">{t.painPoints.headingHighlight}</span>
      </h2>
      <p
        className="text-sm font-light mb-14 max-w-lg"
        style={{ color: "var(--color-muted)" }}
      >
        {t.painPoints.sub}
      </p>

      <div
        className="grid md:grid-cols-3 gap-0.5"
        style={{
          background: "var(--color-border)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {points.map((p, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 transition-all duration-300 group"
            style={{ background: "var(--color-bg-2)", padding: "36px 32px" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-2)")
            }
          >
            {/* Number + Icon row */}
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: p.color,
                }}
              >
                <Icon name={p.iconName} size={20} />
              </div>
              <span
                className="font-code text-[11px] tracking-[0.06em]"
                style={{ color: "var(--color-white)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <h3
              className="font-display font-bold leading-[1.3] tracking-[-0.01em]"
              style={{
                fontSize: "clamp(18px, 2vw, 22px)",
                color: "var(--color-white)",
              }}
            >
              {p.title}
            </h3>
            <p
              className="text-sm leading-[1.7] font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {p.desc}
            </p>

            {/* Bottom accent line */}
            <div
              className="h-px mt-auto transition-all duration-300 opacity-0 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to right, ${p.color}, transparent)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default PainPoints;
