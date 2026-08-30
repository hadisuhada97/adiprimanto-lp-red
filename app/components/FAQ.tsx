"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/lib/language-context";

const FAQItem = ({
  question,
  answer,
  isLast,
}: {
  question: string;
  answer: string;
  isLast: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
      }}
    >
      <button
        className="w-full flex justify-between items-center text-left py-6 gap-6 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className="font-display font-semibold text-base leading-[1.4] tracking-[-0.01em]"
          style={{
            color: isOpen ? "var(--color-white)" : "var(--color-white)",
          }}
        >
          {question}
        </span>
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: isOpen
              ? "var(--color-primary)"
              : "var(--color-surface)",
            border: `1px solid ${isOpen ? "var(--color-primary)" : "var(--color-border)"}`,
            color: isOpen ? "var(--color-bg)" : "var(--color-muted)",
            boxShadow: isOpen ? "0 0 16px var(--color-primary-glow)" : "none",
          }}
        >
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p
              className="pb-6 text-sm leading-[1.85] font-light max-w-2xl"
              style={{ color: "var(--color-muted)" }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const { t } = useLanguage();
  const faqs = t.faq.items;

  return (
  <section
    id="faq"
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
        07 <span className="eyebrow-sep">/</span> {t.faq.eyebrow}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">
        <div>
          <h2
            className="font-display font-black tracking-[-0.02em] leading-[1.05] mb-4"
            style={{
              fontSize: "clamp(28px, 3.5vw, 46px)",
              color: "var(--color-white)",
            }}
          >
            {t.faq.headingLine1} <span className="gradient-text">{t.faq.headingHighlight}</span>
          </h2>
          <p
            className="text-sm font-light leading-[1.8]"
            style={{ color: "var(--color-muted)" }}
          >
            {t.faq.sub}
          </p>
        </div>

        <div
          style={{
            background: "var(--color-bg-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
            padding: "0 28px",
          }}
        >
          {faqs.map((f, i) => (
            <FAQItem
              key={i}
              question={f.q}
              answer={f.a}
              isLast={i === faqs.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
  );
};

export default FAQ;
