'use client';

import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Sun, Moon, Languages } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/app/lib/theme-context';
import { useLanguage } from '@/app/lib/language-context';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleLanguage = () => setLanguage(language === 'id' ? 'en' : 'id');

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-4'
          : 'py-6'
      }`}
      style={{
        background: isScrolled ? 'var(--color-bg-2)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        opacity: isScrolled ? 0.92 : 1,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        borderBottomColor: isScrolled ? 'var(--color-border)' : 'transparent',
      }}
    >
      <div style={{ width: '78%', margin: '0 auto' }} className="grid grid-cols-3 items-center max-md:flex max-md:justify-between max-md:w-[92%]">
        {/* Logo */}
        <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center gap-2 no-underline">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: '#EF4444',
              boxShadow: '0 0 10px #EF4444',
              animation: 'pulse-dot 2s ease infinite',
            }}
          />
          <span className="font-display font-black text-sm tracking-[0.06em] gradient-text">
            ADI PRIMANTO
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-center gap-8">
          {t.nav.links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="font-display text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-300"
              style={{ color: 'var(--color-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-white)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* CTA + controls */}
        <div className="hidden md:flex justify-end items-center gap-3">
          <button
            onClick={toggleLanguage}
            aria-label={t.nav.language}
            title={t.nav.language}
            className="flex items-center gap-1.5 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border-2)',
              background: 'var(--color-surface)',
              color: 'var(--color-light)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-white)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
          >
            <Languages size={14} />
            <span className="font-display text-[11px] font-bold tracking-[0.06em] uppercase">
              {language}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.nav.lightMode : t.nav.darkMode}
            title={theme === 'dark' ? t.nav.lightMode : t.nav.darkMode}
            className="flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: '34px',
              height: '34px',
              border: '1px solid var(--color-border-2)',
              background: 'var(--color-surface)',
              color: 'var(--color-light)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-white)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-2)')}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="btn-primary-style">
            {t.nav.cta} <ChevronRight size={15} />
          </a>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            aria-label={t.nav.language}
            className="flex items-center gap-1 transition-colors"
            style={{ color: 'var(--color-white)' }}
          >
            <Languages size={18} />
            <span className="font-display text-[10px] font-bold uppercase">{language}</span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.nav.lightMode : t.nav.darkMode}
            className="transition-colors"
            style={{ color: 'var(--color-white)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="transition-colors"
            style={{ color: 'var(--color-white)' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} /> }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-col p-6 gap-5" style={{ width: '92%', margin: '0 auto' }}>
              {t.nav.links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="font-display font-semibold text-base tracking-[0.04em] transition-colors"
                  style={{ color: 'var(--color-muted)', textDecoration: 'none' }}
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="btn-primary-style justify-center"
              >
                {t.nav.ctaMobile}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
