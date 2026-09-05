"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const fallbackCategories = [
  {
    category: "Frontend Core",
    eyebrow: "01",
    skills: [
      { title: "HTML5", iconName: "SiHtml5", color: "#E34F26" },
      { title: "CSS3", iconName: "SiCss", color: "#1572B6" },
      { title: "JavaScript", iconName: "SiJavascript", color: "#F7DF1E" },
      { title: "TypeScript", iconName: "SiTypescript", color: "#3178C6" },
      { title: "jQuery", iconName: "SiJquery", color: "#0769AD" },
      { title: "Bootstrap", iconName: "SiBootstrap", color: "#7952B3" },
      { title: "Tailwind", iconName: "SiTailwindcss", color: "#06B6D4" },
      { title: "WordPress", iconName: "SiWordpress", color: "#21759B" },
    ],
  },
  {
    category: "Frameworks",
    eyebrow: "02",
    skills: [
      { title: "React JS", iconName: "SiReact", color: "#61DAFB" },
      { title: "Next JS", iconName: "SiNextdotjs", color: "#ffffff" },
      { title: "Vue JS", iconName: "SiVuedotjs", color: "#42B883" },
      { title: "Nuxt JS", iconName: "SiNuxt", color: "#00DC82" },
    ],
  },
  {
    category: "Mobile Development",
    eyebrow: "03",
    skills: [
      { title: "React Native", iconName: "SiReact", color: "#61DAFB" },
      { title: "Flutter", iconName: "SiFlutter", color: "#54C5F8" },
    ],
  },
  {
    category: "Backend & Tools",
    eyebrow: "04",
    skills: [
      { title: "Node JS", iconName: "SiNodedotjs", color: "#339933" },
      { title: "PHP", iconName: "SiPhp", color: "#777BB4" },
      { title: "Laravel", iconName: "SiLaravel", color: "#FF2D20" },
      { title: "MySQL", iconName: "SiMysql", color: "#4479A1" },
      { title: "Python", iconName: "SiPython", color: "#3776AB" },
      { title: "Git", iconName: "SiGit", color: "#F05032" },
    ],
  },
];

const TechStack = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const cms = data?.skills ?? [];

  const skillCategories =
    cms.length > 0
      ? cms.map((cat, i) => ({
          category: cat.name,
          eyebrow: cat.eyebrow ?? String(i + 1).padStart(2, "0"),
          skills: cat.skills.map((s) => ({
            title: s.name,
            iconName: s.icon_name ?? "Circle",
            color: s.color_hex ?? "#ffffff",
          })),
        }))
      : fallbackCategories;

  const marqueeSource =
    skillCategories.flatMap((c) => c.skills.map((s) => s.title));
  const marqueeItems = [...marqueeSource, ...marqueeSource];

  return (
  <>
    <section
      id="techstack"
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-eyebrow">
            03 <span className="eyebrow-sep">/</span> {t.techStack.eyebrow}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <h2
              className="font-display font-black tracking-[-0.02em] leading-[1.05] mt-3"
              style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                color: "var(--color-white)",
              }}
            >
              {t.techStack.headingLine1} <span className="gradient-text">{t.techStack.headingHighlight}</span>
            </h2>
            <p
              className="text-sm font-light max-w-xs md:text-right"
              style={{ color: "var(--color-muted)" }}
            >
              {t.techStack.sub}
            </p>
          </div>
        </motion.div>

        {/* Category grid */}
        <div className="flex flex-col gap-3">
          {skillCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.eyebrow + catIdx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: catIdx * 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
              }}
            >
              {/* Category header */}
              <div
                className="flex items-center gap-4 px-6 py-4"
                style={{
                  background: "var(--color-bg-3)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span
                  className="font-code text-[10px] tracking-[0.12em]"
                  style={{ color: "var(--color-primary)" }}
                >
                  {cat.eyebrow}
                </span>
                <span
                  className="w-px h-3"
                  style={{ background: "var(--color-border-2)" }}
                />
                <span
                  className="font-display font-semibold text-xs tracking-widest uppercase"
                  style={{ color: "var(--color-light)" }}
                >
                  {cat.category}
                </span>
                <span
                  className="ml-auto font-code text-[10px]"
                  style={{ color: "var(--color-muted)" }}
                >
                  {cat.skills.length} {t.techStack.skillsLabel}
                </span>
              </div>

              {/* Skills row */}
              <div className="flex flex-wrap gap-2 p-5">
                {cat.skills.map((skill, skillIdx) => (
                  <motion.div
                    key={skill.title + skillIdx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: catIdx * 0.06 + skillIdx * 0.04,
                    }}
                    className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default transition-all duration-300"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${skill.color}40`;
                      e.currentTarget.style.background = `${skill.color}0d`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.background = "var(--color-surface)";
                    }}
                  >
                    <Icon
                      name={skill.iconName}
                      size={16}
                      style={{
                        color: skill.color,
                        filter: `drop-shadow(0 0 6px ${skill.color}60)`,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="font-display font-semibold text-xs whitespace-nowrap transition-colors duration-300"
                      style={{ color: "var(--color-light)" }}
                    >
                      {skill.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Marquee */}
    <div
      className="overflow-hidden py-4"
      style={{
        background: "var(--color-bg-3)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="marquee-track">
        {marqueeItems.map((tech, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-10 px-10 font-display font-semibold text-xs tracking-[0.12em] uppercase whitespace-nowrap"
            style={{ color: "var(--color-muted)" }}
          >
            {tech}
            <span style={{ color: "var(--color-primary)", fontSize: "7px" }}>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  </>
  );
};

export default TechStack;
