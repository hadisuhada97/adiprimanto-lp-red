"use client";

import { BsWhatsapp } from 'react-icons/bs';
import { useLanguage } from '@/app/lib/language-context';

const WA_URL = 'https://wa.me/6285727346620?text=Halo%20Adi%20Primanto,%20saya%20ingin%20membuat%20website%20untuk%20bisnis%20saya.';

const WhatsAppButton = () => {
  const { t } = useLanguage();

  return (
  <a
    href={WA_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 group flex items-center gap-3"
    title="Chat WhatsApp"
  >
    {/* Tooltip */}
    <span
      className="font-display font-semibold text-xs tracking-[0.04em] opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap translate-x-2 group-hover:translate-x-0 rounded-lg px-3 py-2 shadow-xl"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-2)',
        color: 'var(--color-white)',
      }}
    >
      {t.whatsapp.tooltip}
    </span>

    {/* Button */}
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
      style={{
        background: '#25d366',
        boxShadow: '0 4px 24px rgba(37, 211, 102, 0.35)',
      }}
    >
      <BsWhatsapp size={26} color="#fff" />
    </div>
  </a>
  );
};

export default WhatsAppButton;
