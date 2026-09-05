"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { Icon } from "@/app/lib/icons";

const avatars = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1719603785926-84d214438120?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542178243-bc20204b769f?q=80&w=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1700126761911-84f19978e8bb?q=80&w=80&auto=format&fit=crop",
];

const fallbackBrands = [
  { name: "TripLinq", iconName: "MapPinned", className: "font-display font-semibold tracking-widest uppercase" },
  { name: "Tea Sense", iconName: "Coffee", className: "font-display italic font-medium tracking-tight" },
  { name: "Quik Shine", iconName: "Zap", className: "font-display font-black italic uppercase tracking-tight" },
  { name: "HoodVerse", iconName: "Ghost", className: "font-display font-extrabold tracking-tight" },
  { name: "Nakalang Electronics", iconName: "Activity", className: "font-display font-bold tracking-tight" },
];

const HappyClients = () => {
  const { t } = useLanguage();
  const { data } = useLanding();
  const cms = data?.clients ?? [];
  const brands =
    cms.length > 0
      ? cms.map((c) => ({
          name: c.name,
          iconName: c.icon_name ?? "Activity",
          className: c.font_class ?? "font-display font-bold tracking-tight",
        }))
      : fallbackBrands;
  const marqueeBrands = [...brands, ...brands];

  return (
  <section
    className="relative overflow-hidden"
    style={{
      background: "var(--color-bg-2)",
      borderTop: "1px solid var(--color-border)",
      borderBottom: "1px solid var(--color-border)",
    }}
  >
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-[78%] max-lg:w-[88%] max-md:w-[92%] flex items-center gap-10 py-7 max-lg:flex-col max-lg:items-start max-lg:gap-5"
    >
      {/* Rating + avatars */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex -space-x-2.5">
          {avatars.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`Happy client ${i + 1}`}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: "2px solid var(--color-bg-2)" }}
            />
          ))}
        </div>
        <div>
          <div className="flex items-center gap-0.5 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
            ))}
          </div>
          <p
            className="font-display font-semibold text-sm whitespace-nowrap"
            style={{ color: "var(--color-white)" }}
          >
            {t.happyClients.label}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="hidden lg:block w-px h-10 shrink-0"
        style={{ background: "var(--color-border-2)" }}
      />
      <div
        className="lg:hidden w-full h-px"
        style={{ background: "var(--color-border-2)" }}
      />

      {/* Brand logos marquee */}
      <div
        className="flex-1 min-w-0 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="marquee-track" style={{ animationDuration: "5s" }}>
          {marqueeBrands.map(({ name, iconName, className }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-9 whitespace-nowrap transition-colors duration-300"
              style={{ color: "var(--color-muted)" }}
            >
              <Icon name={iconName} size={18} />
              <span className={`${className} text-base`}>{name}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  </section>
  );
};

export default HappyClients;
