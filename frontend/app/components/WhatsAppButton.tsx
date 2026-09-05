"use client";

import { BsWhatsapp } from 'react-icons/bs';
import { useLanguage } from '@/app/lib/language-context';
import { useLanding } from '@/app/lib/landing-context';

const FALLBACK_NUMBER = '6285727346620';

const WhatsAppButton = () => {
  const { t } = useLanguage();
  const { data } = useLanding();

  const channel = data?.contact?.channels?.find((item) => item.type === 'whatsapp');
  const number = (data?.settings?.general?.whatsapp_number ?? FALLBACK_NUMBER).replace(/\D/g, '');
  const baseUrl = channel?.url ?? `https://wa.me/${number || FALLBACK_NUMBER}`;
  const waUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(t.whatsapp.message)}`;

  return (
  <a
    href={waUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 group flex items-center gap-3"
    title="Chat WhatsApp"
    data-testid="whatsapp-float-button"
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
