"use client";

import Image from "next/image";
import { ArrowUpRight, Github } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchProjects,
  fetchProjectCategories,
  type ApiProject,
  type PublicCategory,
} from "@/app/lib/api/public";
import { useLanguage } from "@/app/lib/language-context";

const INITIAL_COUNT = 9;
const LOAD_STEP = 6;
const ALL = "all";

const Portfolio = () => {
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>(ALL);
  const [visible, setVisible] = useState(INITIAL_COUNT);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchProjects(language), fetchProjectCategories(language)])
      .then(([projectList, categoryList]) => {
        if (cancelled) return;
        setProjects(projectList);
        setCategories(categoryList);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
        setCategories([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const filtered = useMemo(
    () =>
      active === ALL
        ? projects
        : projects.filter((p) => p.category?.slug === active),
    [projects, active]
  );
  const shown = filtered.slice(0, visible);

  useEffect(() => setVisible(INITIAL_COUNT), [active]);

  const tabs = useMemo(
    () => [
      { slug: ALL, name: t.portfolio.filterAll, count: projects.length },
      ...categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        count: projects.filter((p) => p.category?.slug === c.slug).length,
      })),
    ],
    [categories, projects, t.portfolio.filterAll]
  );

  return (
    <section
      id="portfolio"
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="section-eyebrow">
              04 <span className="eyebrow-sep">/</span> {t.portfolio.eyebrow}
            </div>
            <h2
              className="font-display font-black tracking-[-0.02em] leading-[1.05] mt-3 mb-3"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                color: "var(--color-white)",
              }}
              data-testid="portfolio-heading"
            >
              {t.portfolio.heading}
            </h2>
            <p
              className="text-sm font-light"
              style={{ color: "var(--color-muted)" }}
            >
              {t.portfolio.sub}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        {!loading && (
          <div className="flex flex-wrap gap-2 mb-10" data-testid="portfolio-filters">
            {tabs.map((f) => {
              const isActive = active === f.slug;
              return (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => setActive(f.slug)}
                  data-testid={`portfolio-filter-${f.slug}`}
                  className="inline-flex items-center gap-2 font-display font-semibold text-xs tracking-[0.02em] rounded-lg transition-all duration-300"
                  style={{
                    padding: "9px 18px",
                    background: isActive
                      ? "var(--color-primary)"
                      : "var(--color-bg-3)",
                    border: `1px solid ${
                      isActive ? "var(--color-primary)" : "var(--color-border)"
                    }`,
                    color: isActive ? "var(--color-bg)" : "var(--color-muted)",
                    boxShadow: isActive
                      ? "0 0 20px var(--color-primary-glow)"
                      : "none",
                  }}
                >
                  {f.name}
                  <span
                    className="inline-flex items-center justify-center rounded-full font-bold"
                    style={{
                      minWidth: "20px",
                      height: "20px",
                      padding: "0 6px",
                      fontSize: "10px",
                      background: isActive
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(255,255,255,0.12)",
                    }}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div
            className="grid md:grid-cols-3"
            style={{
              gap: "2px",
              background: "var(--color-border)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col"
                style={{ background: "var(--color-bg)" }}
              >
                {/* Image skeleton */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: "16/10",
                    background: "var(--color-surface)",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                      animation: "shimmer 1.8s ease-in-out infinite",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>

                {/* Info skeleton */}
                <div
                  className="flex flex-col gap-3"
                  style={{
                    padding: "20px 20px 24px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  {/* Title */}
                  <div
                    className="rounded-md"
                    style={{
                      height: "15px",
                      width: "65%",
                      background: "var(--color-surface)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                        animation: "shimmer 1.8s ease-in-out infinite",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  </div>
                  {/* Description */}
                  <div
                    className="rounded-md"
                    style={{
                      height: "12px",
                      width: "85%",
                      background: "var(--color-surface)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                        animation: "shimmer 1.8s ease-in-out infinite 0.15s",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  </div>
                  {/* Tags */}
                  <div className="flex gap-1.5 mt-1">
                    {[40, 55, 45].map((w, j) => (
                      <div
                        key={j}
                        className="rounded-full"
                        style={{
                          height: "20px",
                          width: `${w}px`,
                          background: "var(--color-surface)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                            animation: `shimmer 1.8s ease-in-out infinite ${j * 0.1}s`,
                            backgroundSize: "200% 100%",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid md:grid-cols-3"
            style={{
              gap: "2px",
              background: "var(--color-border)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
            data-testid="portfolio-grid"
          >
            {shown.map((p) => {
              const category = p.category?.name ?? t.portfolio.filterOther;
              const coverUrl = p.cover?.url ?? null;
              return (
                <div
                  key={p.id}
                  className="flex flex-col transition-all duration-300 group"
                  style={{ background: "var(--color-bg)" }}
                  data-testid={`portfolio-card-${p.slug}`}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-bg-3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--color-bg)")
                  }
                >
                  {/* Image */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "16/10",
                      background: "var(--color-surface)",
                    }}
                  >
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={p.cover?.alt_text || p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-500"
                        style={{ filter: "brightness(0.9)" }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-bg-3) 0%, var(--color-surface) 100%)",
                        }}
                      >
                        <span
                          className="font-display font-black tracking-[-0.02em] group-hover:scale-[1.06] transition-transform duration-500"
                          style={{
                            fontSize: "40px",
                            color: p.category?.color_hex || "var(--color-primary-2)",
                            opacity: 0.85,
                          }}
                        >
                          {p.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay: Code / Live links */}
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ zIndex: 3 }}
                    >
                      {p.github_url && (
                        <a
                          href={p.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`portfolio-github-${p.slug}`}
                          className="inline-flex items-center gap-1.5 font-display font-semibold text-xs rounded-lg transition-all duration-300"
                          style={{
                            padding: "10px 18px",
                            background: "rgba(22, 22, 26, 0.92)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid var(--color-border-2)",
                            color: "var(--color-white)",
                          }}
                        >
                          <Github size={14} /> {t.portfolio.code}
                        </a>
                      )}
                      {p.demo_url && (
                        <a
                          href={p.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`portfolio-demo-${p.slug}`}
                          className="inline-flex items-center gap-1.5 font-display font-semibold text-xs rounded-lg transition-all duration-300"
                          style={{
                            padding: "10px 18px",
                            background: "var(--color-primary)",
                            border: "1px solid var(--color-primary)",
                            color: "var(--color-bg)",
                            boxShadow: "0 0 20px var(--color-primary-glow)",
                          }}
                        >
                          <ArrowUpRight size={14} /> {t.portfolio.live}
                        </a>
                      )}
                    </div>

                    {/* Category badge */}
                    <div
                      className="absolute top-3 left-3 font-code text-[10px] tracking-[0.06em] z-10"
                      style={{
                        padding: "4px 10px",
                        background: "rgba(12, 12, 14, 0.85)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--color-border-2)",
                        borderRadius: "100px",
                        color: "var(--color-primary-2)",
                      }}
                    >
                      {category}
                    </div>
                  </div>

                  {/* Info */}
                  <div
                    className="flex flex-col gap-2 flex-1"
                    style={{
                      padding: "20px 20px 24px",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    <h3
                      className="font-display font-bold leading-[1.3] tracking-[-0.01em]"
                      style={{ fontSize: "15px", color: "var(--color-white)" }}
                    >
                      {p.title}
                    </h3>
                    <p
                      className="text-xs leading-[1.6] font-light"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.technologies.map((tech) => (
                        <span
                          key={tech.id}
                          className="font-code text-[10px] tracking-[0.04em] px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "var(--color-primary-subtle)",
                            border: "1px solid rgba(239, 68, 68, 0.15)",
                            color: "var(--color-primary-2)",
                          }}
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {!loading && visible < filtered.length && (
          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={() => setVisible((v) => v + LOAD_STEP)}
              className="btn-ghost-style"
              data-testid="portfolio-load-more"
            >
              {t.portfolio.loadMore}
              <span
                className="font-code"
                style={{ fontSize: "11px", color: "var(--color-primary)" }}
              >
                +{filtered.length - visible}
              </span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            className="text-center"
            style={{ padding: "80px 0", color: "var(--color-muted)" }}
            data-testid="portfolio-empty"
          >
            <p className="text-sm">{t.portfolio.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
