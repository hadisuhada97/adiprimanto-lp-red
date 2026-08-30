"use client";

import { useState } from "react";
import { Mail, Instagram, ArrowUpRight, Send } from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";
import { useLanguage } from "@/app/lib/language-context";

const WA_NUMBER = "6285727346620";

const contactLinks = [
  {
    icon: <BsWhatsapp size={17} />,
    label: "WhatsApp",
    value: "+62 857-2734-6620",
    href: `https://wa.me/${WA_NUMBER}`,
    color: "#25D366",
  },
  {
    icon: <Mail size={17} />,
    label: "Email",
    value: "adiprimanto.98@gmail.com",
    href: "mailto:adiprimanto.98@gmail.com",
    color: "var(--color-primary)",
  },
  {
    icon: <Instagram size={17} />,
    label: "Instagram",
    value: "@adiprimanto",
    href: "https://www.instagram.com/adiprimanto/",
    color: "#E1306C",
  },
];

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo, saya ${form.name} (${form.email}).\n\n${form.message}`;
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section
      id="contact"
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
          08 <span className="eyebrow-sep">/</span> {t.contact.eyebrow}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* LEFT — heading + contact links */}
          <div className="flex flex-col gap-12">
            <div>
              <h2
                className="font-display font-black tracking-[-0.02em] leading-[1.05] mb-4"
                style={{
                  fontSize: "clamp(28px, 3.5vw, 46px)",
                  color: "var(--color-white)",
                }}
              >
                {t.contact.headingLine1}{" "}
                <span className="gradient-text">
                  {t.contact.headingHighlight}
                </span>
              </h2>
              <p
                className="text-sm font-light leading-[1.8] max-w-[380px]"
                style={{ color: "var(--color-muted)" }}
              >
                {t.contact.desc}
              </p>
            </div>

            {/* Contact link cards */}
            <div
              className="flex flex-col overflow-hidden"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
              }}
            >
              {contactLinks.map(({ icon, label, value, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 transition-all duration-200"
                  style={{
                    padding: "18px 20px",
                    background: "var(--color-bg-2)",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-bg-3)";
                    e.currentTarget.style.paddingLeft = "24px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-bg-2)";
                    e.currentTarget.style.paddingLeft = "20px";
                  }}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color,
                    }}
                  >
                    {icon}
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span
                      className="font-code text-[10px] tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {label}
                    </span>
                    <span
                      className="font-display text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200"
                      style={{ color: "var(--color-white)" }}
                    >
                      {value}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200"
                    style={{ color: "var(--color-muted)" }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT — form */}
          <div
            style={{
              background: "var(--color-bg-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-3)",
              }}
            >
              <span
                className="inline-flex items-center gap-2 font-code text-[11px] tracking-[0.08em]"
                style={{ color: "var(--color-muted)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow: "0 0 6px var(--color-primary)",
                  }}
                />
                {t.contact.formBadge}
              </span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              style={{ padding: "28px 24px" }}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="font-display text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-200"
                  style={{
                    color:
                      focused === "name" || form.name
                        ? "var(--color-primary)"
                        : "var(--color-muted)",
                  }}
                >
                  {t.contact.nameLabel}
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder={t.contact.namePlaceholder}
                  required
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  className="w-full font-body text-sm font-light outline-none transition-all duration-200"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-bg)",
                    border: `1px solid ${focused === "name" ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    color: "var(--color-white)",
                    boxShadow:
                      focused === "name"
                        ? "0 0 0 3px var(--color-primary-subtle)"
                        : "none",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="font-display text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-200"
                  style={{
                    color:
                      focused === "email" || form.email
                        ? "var(--color-primary)"
                        : "var(--color-muted)",
                  }}
                >
                  {t.contact.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder={t.contact.emailPlaceholder}
                  required
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className="w-full font-body text-sm font-light outline-none transition-all duration-200"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-bg)",
                    border: `1px solid ${focused === "email" ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    color: "var(--color-white)",
                    boxShadow:
                      focused === "email"
                        ? "0 0 0 3px var(--color-primary-subtle)"
                        : "none",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="message"
                  className="font-display text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-200"
                  style={{
                    color:
                      focused === "message" || form.message
                        ? "var(--color-primary)"
                        : "var(--color-muted)",
                  }}
                >
                  {t.contact.messageLabel}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder={t.contact.messagePlaceholder}
                  required
                  value={form.message}
                  onChange={handleChange}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  className="w-full resize-none font-body text-sm font-light outline-none transition-all duration-200"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-bg)",
                    border: `1px solid ${focused === "message" ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "8px",
                    color: "var(--color-white)",
                    boxShadow:
                      focused === "message"
                        ? "0 0 0 3px var(--color-primary-subtle)"
                        : "none",
                  }}
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2.5 w-full transition-all duration-200"
                style={{
                  padding: "15px 24px",
                  background: "#25d366",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  boxShadow: "0 4px 24px rgba(37, 211, 102, 0.25)",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1ebe5a";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(37, 211, 102, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#25d366";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(37, 211, 102, 0.25)";
                }}
              >
                <BsWhatsapp size={16} />
                {t.contact.submit}
                <Send size={14} className="ml-auto opacity-70" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
