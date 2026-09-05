"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";
import { useLanding } from "@/app/lib/landing-context";
import { navHref } from "@/app/lib/api/landing";
import { Icon } from "@/app/lib/icons";

const FALLBACK_SOCIALS = [
  { id: "linkedin", platform: "LinkedIn", url: "https://www.linkedin.com/in/adi-primanto/", icon_name: "Linkedin", color_hex: null },
  { id: "instagram", platform: "Instagram", url: "https://www.instagram.com/adiprimanto", icon_name: "Instagram", color_hex: null },
  { id: "tiktok", platform: "TikTok", url: "https://www.tiktok.com/@adi_primanto?lang=id-ID", icon_name: "Music2", color_hex: null },
  { id: "github", platform: "GitHub", url: "https://github.com/adiprimanto", icon_name: "Github", color_hex: null },
];

const Footer = () => {
  const { t } = useLanguage();
  const { data } = useLanding();

  const general = data?.settings?.general;
  const brandName = general?.brand_name ?? "Adi Primanto";
  const tagline = general?.brand_tagline ?? t.footer.tagline;
  const logoUrl = general?.logo_media_id ?? null;

  const cmsFooterLinks = data?.navigation?.footer ?? [];
  const navLinks =
    cmsFooterLinks.length > 0
      ? cmsFooterLinks.map((item) => ({
          key: item.id,
          label: item.label,
          href: navHref(item),
          target: item.target ?? "_self",
        }))
      : t.footer.navLinks.map((link) => ({
          key: link.href,
          label: link.label,
          href: link.href,
          target: "_self",
        }));

  const socials = data?.contact?.social_links?.length
    ? data.contact.social_links
    : FALLBACK_SOCIALS;

  const channels = data?.contact?.channels ?? [];
  const primaryChannel =
    channels.find((channel) => channel.type === "email") ?? channels[0] ?? null;
  const contactHref =
    primaryChannel?.url ?? `mailto:${general?.contact_email ?? "adiprimanto.98@gmail.com"}`;
  const contactLabel =
    primaryChannel?.value ?? general?.contact_email ?? "adiprimanto.98@gmail.com";

  return (
  <footer
    data-testid="footer"
    style={{
      background: "var(--color-bg-2)",
      position: "relative",
      marginTop: 0,
    }}
  >
    {/* Top gradient line */}
    <div
      className="h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.3) 30%, rgba(245,158,11,0.3) 70%, transparent 100%)",
      }}
    />

    {/* Main grid */}
    <div
      style={{
        width: "78%",
        margin: "0 auto",
        borderBottom: "1px solid var(--color-border)",
        padding: "64px 0 48px",
      }}
      className="max-lg:w-[88%] max-md:w-[92%] grid gap-10"
    >
      <div className="grid md:grid-cols-[1.4fr_1fr_1.2fr] gap-10 max-md:grid-cols-1">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <a
            href="#home"
            className="inline-flex items-center gap-2 no-underline w-fit"
            style={{ textDecoration: "none" }}
            data-testid="footer-brand"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brandName}
                width={28}
                height={28}
                className="w-7 h-7 rounded object-contain shrink-0"
                unoptimized
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 0 10px var(--color-primary)",
                  animation: "pulse-dot 2s ease infinite",
                }}
              />
            )}
            <span className="font-display font-black text-lg tracking-[0.06em] uppercase gradient-text">
              {brandName}
            </span>
          </a>
          <span
            className="font-code text-[11px] tracking-widest uppercase"
            style={{ color: "var(--color-primary)" }}
            data-testid="footer-tagline"
          >
            {tagline}
          </span>
        </div>

        {/* Nav */}
        <div className="flex flex-col gap-4">
          <h3
            className="font-display font-bold text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            {t.footer.navigation}
          </h3>
          <ul className="flex flex-col gap-2.5" data-testid="footer-nav-links">
            {navLinks.map((link) => (
              <li key={link.key}>
                <a
                  href={link.href}
                  target={link.target === "_blank" ? "_blank" : undefined}
                  rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-2 text-sm font-light transition-all duration-200"
                  style={{
                    color: "var(--color-muted)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-white)";
                    e.currentTarget.style.paddingLeft = "4px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-muted)";
                    e.currentTarget.style.paddingLeft = "0";
                  }}
                  data-testid={`footer-nav-link-${link.href.replace("#", "")}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Socials + CTA */}
        <div className="flex flex-col gap-4">
          <h3
            className="font-display font-bold text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            {t.footer.socialMedia}
          </h3>
          <ul className="flex flex-col gap-2.5" data-testid="footer-social-links">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-light transition-all duration-200 w-fit"
                  style={{
                    color: "var(--color-muted)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-primary)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-muted)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                  data-testid={`footer-social-${s.platform.toLowerCase()}`}
                >
                  <Icon name={s.icon_name} size={14} />
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>

          {/* Contact CTA */}
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 font-code text-[11px] tracking-[0.04em] transition-all duration-200 w-fit"
            style={{
              padding: "10px 16px",
              background: "var(--color-primary-subtle)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              color: "var(--color-primary-2)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px var(--color-primary-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-primary-subtle)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
              e.currentTarget.style.color = "var(--color-primary-2)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            data-testid="footer-contact-cta"
          >
            <Icon name={primaryChannel?.icon_name ?? "Mail"} size={13} />
            {contactLabel}
          </a>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      style={{ width: "78%", margin: "0 auto", padding: "20px 0" }}
      className="max-lg:w-[88%] max-md:w-[92%]"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p
          className="text-xs font-light"
          style={{ color: "var(--color-muted)" }}
          data-testid="footer-copyright"
        >
          <span
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-syne)",
            }}
          >
            ©
          </span>{" "}
          {new Date().getFullYear()} {brandName}. {t.footer.rights}
        </p>
        <a
          href="#home"
          aria-label={t.footer.backToTop}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-2)",
            color: "var(--color-muted)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.color = "var(--color-bg)";
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px var(--color-primary-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-surface)";
            e.currentTarget.style.borderColor = "var(--color-border-2)";
            e.currentTarget.style.color = "var(--color-muted)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          data-testid="footer-back-to-top"
        >
          <ArrowUp size={16} />
        </a>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
