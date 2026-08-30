"use client";

import { ArrowUp, Mail } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";

const WA_URL =
  "https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/adi-primanto/" },
  { label: "Instagram", href: "https://www.instagram.com/adiprimanto" },
  { label: "TikTok", href: "https://www.tiktok.com/@adi_primanto?lang=id-ID" },
  { label: "GitHub", href: "https://github.com/adiprimanto" },
];

const Footer = () => {
  const { t } = useLanguage();
  const navLinks = t.footer.navLinks;

  return (
  <footer
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
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 10px var(--color-primary)",
                animation: "pulse-dot 2s ease infinite",
              }}
            />
            <span className="font-display font-black text-lg tracking-[0.06em] gradient-text">
              ADI PRIMANTO
            </span>
          </a>
          <span
            className="font-code text-[11px] tracking-widest uppercase"
            style={{ color: "var(--color-primary)" }}
          >
            {t.footer.tagline}
          </span>
          {/* <p
            className="text-sm font-light leading-[1.7] mt-1 max-w-xs"
            style={{ color: "var(--color-muted)" }}
          >
            Website yang bekerja untuk bisnis Anda — bukan sekadar tampil bagus.
          </p> */}
        </div>

        {/* Nav */}
        <div className="flex flex-col gap-4">
          <h4
            className="font-display font-bold text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            {t.footer.navigation}
          </h4>
          <ul className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
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
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Socials + CTA */}
        <div className="flex flex-col gap-4">
          <h4
            className="font-display font-bold text-[11px] tracking-[0.12em] uppercase"
            style={{ color: "var(--color-muted)" }}
          >
            {t.footer.socialMedia}
          </h4>
          <ul className="flex flex-col gap-2.5">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-light transition-all duration-200 block w-fit"
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
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Email CTA */}
          <a
            href={WA_URL}
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
          >
            <Mail size={13} />
            adiprimanto.98@gmail.com
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
        >
          <span
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-syne)",
            }}
          >
            ©
          </span>{" "}
          {new Date().getFullYear()} Adi Primanto. {t.footer.rights}
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
        >
          <ArrowUp size={16} />
        </a>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
