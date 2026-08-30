"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Sparkles,
  Volume2,
  VolumeX,
  Gift,
  Mail,
  Check,
  Coffee,
  HeartHandshake,
  Smile,
  Star,
  Music,
} from "lucide-react";

// ==========================================
// TYPES & DATA DEFINITIONS
// ==========================================

interface StarPoint {
  id: number;
  name: string;
  x: number; // percentage width
  y: number; // percentage height
}

interface Connection {
  from: StarPoint;
  to: StarPoint;
}

interface FloatingItem {
  id: number;
  x: number; // percentage position
  y: number; // current top position
  speed: number;
  size: number;
  type: "heart" | "rose" | "sparkle";
  rotationSpeed: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: "circle" | "heart" | "star";
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface Voucher {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  code: string;
}

// 6 stars positioned to form a heart contour when connected in sequence:
// 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0 (loop back to start)
const CONSTELLATION_STARS: StarPoint[] = [
  { id: 1, name: "Senyumanmu", x: 50, y: 35 }, // Top center dip
  { id: 2, name: "Kelembutan", x: 30, y: 22 }, // Top left curve
  { id: 3, name: "Kebaikan", x: 15, y: 45 }, // Mid left
  { id: 4, name: "Cintamu", x: 50, y: 80 }, // Bottom point
  { id: 5, name: "Kehangatan", x: 85, y: 45 }, // Mid right
  { id: 6, name: "Tawamu", x: 70, y: 22 }, // Top right curve
];

// Connection sequence by index in the array above
const CONNECTION_SEQUENCE = [0, 1, 2, 3, 4, 5, 0];

export default function HeldaLoveGame() {
  // Load Google Fonts dynamically on mount to prevent re-evaluation and font flickering
  useEffect(() => {
    if (typeof window === "undefined") return;
    const linkId = "google-fonts-helda";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Playpen+Sans:wght@400;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Game state:
  // 0 = Starry Constellation Stage
  // 1 = Heart Catcher Game Stage
  // 2 = The Grand Reveal (Letter, SVG Flowers & Love Vouchers)
  const [stage, setStage] = useState<number>(0);

  // Audio state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stage 1 (Constellation) state:
  const [connectedIndices, setConnectedIndices] = useState<number[]>([0]); // Starts with the first star connected
  const [starsParticles, setStarsParticles] = useState<Particle[]>([]);
  const [constellationComplete, setConstellationComplete] =
    useState<boolean>(false);

  // Stage 2 (Heart Catcher) state:
  const [loveMeter, setLoveMeter] = useState<number>(0);
  const [catcherItems, setCatcherItems] = useState<FloatingItem[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [catchCounter, setCatchCounter] = useState<number>(0);
  const catcherTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stage 3 (Reveal) state:
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState<boolean>(false);
  const [claimedVouchers, setClaimedVouchers] = useState<
    Record<string, boolean>
  >({});

  // Confetti particles for stage completion and page endings
  const [confetti, setConfetti] = useState<Particle[]>([]);

  // Refs for tracking animation loops
  const requestRef = useRef<number | null>(null);
  const particlesIdRef = useRef<number>(0);
  const floatingTextsIdRef = useRef<number>(0);
  const floatingItemsIdRef = useRef<number>(0);

  // ==========================================
  // AUDIO SYNTHESIZER (WEB AUDIO API)
  // ==========================================
  const playSound = (
    type: "twinkle" | "pop" | "success" | "stamp" | "open",
  ) => {
    if (isMuted || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      if (type === "twinkle") {
        // Twinkling star sound (bell-like high pitch)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Map frequency based on current connected star count for rising pitch!
        const freq = 600 + connectedIndices.length * 100;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "pop") {
        // Pop sound for heart catching
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "success") {
        // Glorious romantic major chord arpeggio
        const chord = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6 (C Major)
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";

          const noteStart = now + idx * 0.08;
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.06, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteStart);
          osc.stop(noteStart + 0.8);
        });
      } else if (type === "stamp") {
        // Deep stamp sound (thump)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "open") {
        // Swoosh + chime sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain1.gain.setValueAtTime(0.05, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(523.25, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4);
        gain2.gain.setValueAtTime(0.05, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.3);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context failed to initialize: ", e);
    }
  };

  // ==========================================
  // PARTICLE ANIMATION LOOP (SHARED)
  // ==========================================
  const triggerExplosion = (x: number, y: number, colorPreset?: string[]) => {
    const colors = colorPreset || [
      "#ff5e7e",
      "#ff88a5",
      "#ffb3c6",
      "#fbcfe8",
      "#fb7185",
      "#f43f5e",
    ];
    const shapes: ("circle" | "heart" | "star")[] = ["circle", "heart", "star"];
    const count = 30;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesIdRef.current += 1;
      newParticles.push({
        id: particlesIdRef.current,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (colorPreset ? 3 : 1), // higher upward blast if preset/confetti
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 14,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        opacity: 1,
      });
    }

    if (colorPreset) {
      setConfetti((prev) => [...prev, ...newParticles]);
    } else {
      setStarsParticles((prev) => [...prev, ...newParticles]);
    }
  };

  // Update particles positions and check bounds
  useEffect(() => {
    const updatePhysics = () => {
      // Update local stars particles
      setStarsParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            opacity: p.opacity - 0.02,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter((p) => p.opacity > 0),
      );

      // Update full screen confetti
      setConfetti(
        (prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + 0.1, // lighter gravity
              opacity: p.opacity - 0.015,
              rotation: p.rotation + p.rotationSpeed,
            }))
            .filter((p) => p.opacity > 0 && p.y < 1200), // keep inside vertical area
      );

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // ==========================================
  // STAGE 1: STARRY CONSTELLATION LOGIC
  // ==========================================

  // Get index of the next star that Helda needs to connect
  const getNextStarTargetIndex = (): number => {
    if (connectedIndices.length >= CONNECTION_SEQUENCE.length) return -1;
    return CONNECTION_SEQUENCE[connectedIndices.length];
  };

  const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>, starIdx: number) => {
    const nextTargetIdx = getNextStarTargetIndex();

    // Ignore if click is not the next target, or if constellation is already complete
    if (starIdx !== nextTargetIdx || constellationComplete) return;

    playSound("twinkle");

    // Trigger localized starry sparkles exactly where clicked
    triggerExplosion(e.pageX, e.pageY);

    const newConnected = [...connectedIndices, starIdx];
    setConnectedIndices(newConnected);

    // If we completed the loop (connected back to start)
    if (newConnected.length === CONNECTION_SEQUENCE.length) {
      setConstellationComplete(true);
      playSound("success");

      // Burst confetti
      setTimeout(() => {
        if (typeof window !== "undefined") {
          triggerExplosion(window.innerWidth / 2, window.innerHeight / 2, [
            "#f472b6",
            "#ec4899",
            "#d946ef",
            "#a855f7",
            "#e9d5ff",
            "#fbcfe8",
          ]);
        }
      }, 500);
    }
  };

  // ==========================================
  // STAGE 2: HEART CATCHER MINI GAME
  // ==========================================

  useEffect(() => {
    if (stage !== 1 || gameComplete) {
      if (catcherTimerRef.current) clearInterval(catcherTimerRef.current);
      return;
    }

    // Spawn falling objects (floating up)
    catcherTimerRef.current = setInterval(() => {
      const types: ("heart" | "rose" | "sparkle")[] = [
        "heart",
        "rose",
        "sparkle",
      ];
      const colors = [
        "#ff4b72", // pinkish-red
        "#ff7e9b", // light pink
        "#e11d48", // deep rose
        "#f43f5e", // rose
        "#fda4af", // rose petal pink
        "#f472b6", // pink
      ];

      floatingItemsIdRef.current += 1;
      const newItem: FloatingItem = {
        id: floatingItemsIdRef.current,
        x: 10 + Math.random() * 80, // random horizontal (10% to 90%)
        y: 110, // start just below bottom of screen
        speed: 1.2 + Math.random() * 2.2, // vertical float speed
        size: 32 + Math.random() * 28, // size in px
        type: types[Math.floor(Math.random() * types.length)],
        rotationSpeed: (Math.random() - 0.5) * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      };

      setCatcherItems((prev) => [...prev, newItem]);
    }, 650);

    return () => {
      if (catcherTimerRef.current) clearInterval(catcherTimerRef.current);
    };
  }, [stage, gameComplete]);

  // Floating physics loops
  useEffect(() => {
    if (stage !== 1) return;

    const interval = setInterval(() => {
      setCatcherItems(
        (prev) =>
          prev
            .map((item) => ({ ...item, y: item.y - item.speed }))
            .filter((item) => item.y > -20), // remove offscreen
      );
    }, 25);

    return () => clearInterval(interval);
  }, [stage]);

  const handleItemCatch = (e: React.MouseEvent, item: FloatingItem) => {
    e.stopPropagation();

    // Remove the item immediately from screen
    setCatcherItems((prev) => prev.filter((i) => i.id !== item.id));

    // Play popping chime
    playSound("pop");

    // Sparkle explosion exactly at the click/tap coordinate
    triggerExplosion(e.pageX, e.pageY);

    // Visual text popup feedback (+10% Sayang, etc.)
    const texts = ["Sayang", "Cinta", "Kangen", "Peluk", "Senyum"];
    const randomWord = texts[Math.floor(Math.random() * texts.length)];

    floatingTextsIdRef.current += 1;
    const newText: FloatingText = {
      id: floatingTextsIdRef.current,
      x: item.x,
      y: item.y,
      text: `+10% ${randomWord} ❤️`,
    };

    setFloatingTexts((prev) => [...prev, newText]);

    // Remove text feedback after a brief delay
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1200);

    // Increase Love Meter
    setLoveMeter((prev) => {
      const nextVal = Math.min(prev + 10, 100);
      if (nextVal === 100 && !gameComplete) {
        setGameComplete(true);
        playSound("success");
        // Major confetti blast!
        setTimeout(() => {
          if (typeof window !== "undefined") {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                triggerExplosion(
                  (window.innerWidth / 4) * (i + 1),
                  window.innerHeight * 0.7,
                  [
                    "#ff2e63",
                    "#f35588",
                    "#ff8b94",
                    "#ec4899",
                    "#fda4af",
                    "#ffd3e8",
                  ],
                );
              }, i * 300);
            }
          }
        }, 300);
      }
      return nextVal;
    });

    setCatchCounter((prev) => prev + 1);
  };

  // Get comments depending on the current score
  const getCuteCommentary = (): string => {
    if (loveMeter === 0)
      return "Tangkap hati & mawar yang terbang untuk mengumpulkan cinta Adi! 💕";
    if (loveMeter < 30)
      return "Baru terkumpul sedikit... Tangkap lagi yaa Helda sayang! 😘";
    if (loveMeter < 60)
      return "Cintanya makin melimpah! Kangennya makin membara nih... 🔥";
    if (loveMeter < 90)
      return "Dikit lagi penuh! Siap-siap dapet kejutan manis... ✨";
    return "YEAAAY! HATI ADI PENUH 100% UNTUK HELDA! 🎉💖";
  };

  // ==========================================
  // STAGE 3: THE GRAND REVEAL & VOUCHERS LOGIC
  // ==========================================

  const handleEnvelopeClick = () => {
    if (isEnvelopeOpen) return;
    setIsEnvelopeOpen(true);
    playSound("open");

    // Sparkle effect
    setTimeout(() => {
      if (typeof window !== "undefined") {
        triggerExplosion(window.innerWidth / 2, window.innerHeight * 0.4, [
          "#ffd700",
          "#ff4b72",
          "#ffb3c6",
          "#ffffff",
          "#ffe2e2",
        ]);
      }
    }, 450);
  };

  const handleClaimVoucher = (voucherId: string) => {
    if (claimedVouchers[voucherId]) return;

    // Play thud stamp sound
    playSound("stamp");

    // Set claimed state
    setClaimedVouchers((prev) => ({ ...prev, [voucherId]: true }));

    // Trigger little particle burst from the clicked card
    if (typeof window !== "undefined") {
      triggerExplosion(window.innerWidth / 2, window.innerHeight * 0.8, [
        "#ff3366",
        "#e11d48",
        "#ffb3c6",
        "#fbcfe8",
      ]);
    }
  };

  // Vouchers list details
  const VOUCHERS: Voucher[] = [
    {
      id: "hug",
      title: "Voucher Pelukan Hangat",
      desc: "Dapatkan 1x pelukan erat, nyaman, dan hangat dari Adi pas Helda lagi capek, sedih, atau kangen berat.",
      icon: <HeartHandshake className="w-8 h-8 text-rose-500" />,
      color:
        "from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-pink-500/40",
      code: "ADI-HUG-LOVE",
    },
    {
      id: "dinner",
      title: "Voucher Makan Malam Romantis",
      desc: "Bebas pilih tempat dan menu makan malam romantis apa saja yang Helda pengen. Adi yang bayar penuh tanpa protes!",
      icon: <Coffee className="w-8 h-8 text-amber-500" />,
      color:
        "from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40",
      code: "ADI-DINNER-SWEET",
    },
    {
      id: "no_angry",
      title: "Voucher Bebas Marah (1 Hari)",
      desc: "Gunakan voucher ini saat melakukan kesalahan kecil. Adi berjanji tidak akan ngambek atau ngedumel selama 24 jam penuh!",
      icon: <Smile className="w-8 h-8 text-emerald-500" />,
      color:
        "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40",
      code: "ADI-CALM-PEACE",
    },
  ];

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at center, #1e0b2e 0%, #0d0415 60%, #05010a 100%)",
      }}
    >
      {/* Google fonts injection for beautiful romantic text */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .font-romantic {
          font-family: 'Dancing Script', cursive;
        }
        .font-playpen {
          font-family: 'Playpen Sans', sans-serif;
        }
        .twinkle-star {
          animation: pulseTwinkle 1.8s infinite ease-in-out alternate;
        }
        @keyframes pulseTwinkle {
          0% { opacity: 0.3; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 6px rgba(255,255,255,0.7)); }
        }
      `,
        }}
      />

      {/* Decorative Background Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full twinkle-star"
            style={{
              width: `${(i % 3) + 1}px`,
              height: `${(i % 3) + 1}px`,
              left: `${(i * 7.7) % 100}%`,
              top: `${(i * 13.3) % 100}%`,
              animationDelay: `${(i * 0.17) % 2}s`,
            }}
          />
        ))}
      </div>

      {/* Audio Controller Floating Top-Right */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            playSound("twinkle");
          }}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-rose-300 hover:text-rose-400 transition-colors shadow-lg backdrop-blur-md"
          title={isMuted ? "Aktifkan Suara" : "Senyap"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Local Sparkle Particles rendering */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {starsParticles.map((p) => (
          <div
            key={p.id}
            className="absolute flex items-center justify-center"
            style={{
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.opacity})`,
              opacity: p.opacity,
            }}
          >
            {p.shape === "heart" ? (
              <Heart
                className="w-4 h-4 fill-current"
                style={{ color: p.color }}
              />
            ) : p.shape === "star" ? (
              <Star className="w-4 h-4 fill-current text-yellow-300" />
            ) : (
              <div
                className="rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Confetti rendering */}
      <div className="absolute inset-0 pointer-events-none z-55">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute flex items-center justify-center"
            style={{
              left: c.x,
              top: c.y,
              transform: `translate(-50%, -50%) rotate(${c.rotation}deg)`,
              opacity: c.opacity,
            }}
          >
            {c.shape === "heart" ? (
              <Heart
                className="fill-current"
                style={{
                  color: c.color,
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.15))",
                }}
              />
            ) : c.shape === "star" ? (
              <Star
                className="fill-current text-yellow-300"
                style={{
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                  filter: "drop-shadow(0 2px 5px rgba(253,224,71,0.3))",
                }}
              />
            ) : (
              <div
                className="rounded-full"
                style={{
                  width: `${c.size}px`,
                  height: `${c.size}px`,
                  backgroundColor: c.color,
                  boxShadow: `0 0 10px ${c.color}`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ==========================================
          STAGE 0: STARRY CONSTELLATION SCREEN
          ========================================== */}
      {stage === 0 && (
        <div className="w-full max-w-lg flex flex-col items-center justify-center text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-indigo-300 drop-shadow-sm mb-3">
              Rasi Bintang Helda ✨
            </h1>
            <p className="text-sm sm:text-base text-pink-200/70 font-light max-w-sm px-4">
              Hubungkan bintang-bintang di bawah ini secara berurutan untuk
              memancarkan cahaya hatiku...
            </p>
          </motion.div>

          {/* Interactive Constellation Area */}
          <div className="relative w-full aspect-[4/3] max-w-md bg-white/2 backdrop-blur-xs border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-6 mb-8 flex items-center justify-center">
            {/* SVG connections overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {/* Completed lines */}
              {connectedIndices.slice(0, -1).map((starIdx, seqIdx) => {
                const currentStar = CONSTELLATION_STARS[starIdx];
                const nextStarIdx = connectedIndices[seqIdx + 1];
                const nextStar = CONSTELLATION_STARS[nextStarIdx];
                return (
                  <motion.line
                    key={seqIdx}
                    x1={`${currentStar.x}%`}
                    y1={`${currentStar.y}%`}
                    x2={`${nextStar.x}%`}
                    y2={`${nextStar.y}%`}
                    stroke="url(#gradientRose)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(244,63,94,0.7))",
                    }}
                  />
                );
              })}

              {/* Dashed Guideline to Next Star */}
              {!constellationComplete &&
                connectedIndices.length > 0 &&
                (() => {
                  const lastConnectedStar =
                    CONSTELLATION_STARS[
                      connectedIndices[connectedIndices.length - 1]
                    ];
                  const nextTargetIdx = getNextStarTargetIndex();
                  if (nextTargetIdx === -1) return null;
                  const targetStar = CONSTELLATION_STARS[nextTargetIdx];
                  return (
                    <line
                      x1={`${lastConnectedStar.x}%`}
                      y1={`${lastConnectedStar.y}%`}
                      x2={`${targetStar.x}%`}
                      y2={`${targetStar.y}%`}
                      stroke="#ec4899"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-40"
                    />
                  );
                })()}

              {/* Define color gradient for lines */}
              <defs>
                <linearGradient
                  id="gradientRose"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            {/* Render stars */}
            {CONSTELLATION_STARS.map((star, idx) => {
              const isConnected = connectedIndices.includes(idx);
              const nextTargetIdx = getNextStarTargetIndex();
              const isTarget = idx === nextTargetIdx;

              return (
                <button
                  key={star.id}
                  onClick={(e) => handleStarClick(e, idx)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-hidden group z-20 w-12 h-12 flex items-center justify-center cursor-pointer"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                  }}
                >
                  <motion.div
                    animate={
                      isConnected
                        ? { scale: [1, 1.2, 1], rotate: 360 }
                        : isTarget
                          ? {
                              scale: [1, 1.3, 1],
                              filter: [
                                "drop-shadow(0 0 2px rgba(253,224,71,0.5))",
                                "drop-shadow(0 0 12px rgba(253,224,71,0.9))",
                                "drop-shadow(0 0 2px rgba(253,224,71,0.5))",
                              ],
                            }
                          : { scale: 1 }
                    }
                    transition={
                      isTarget
                        ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                        : { duration: 0.5 }
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      isConnected
                        ? "bg-rose-500 border-rose-300 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                        : isTarget
                          ? "bg-yellow-400 border-yellow-200 text-yellow-950 animate-pulse scale-110 cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.8)]"
                          : "bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${isConnected ? "fill-current" : isTarget ? "fill-current" : ""}`}
                    />
                  </motion.div>

                  {/* Floating star name */}
                  <span
                    className={`absolute top-9 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-wide whitespace-nowrap px-1.5 py-0.5 rounded-md transition-all ${
                      isConnected
                        ? "text-rose-300 bg-rose-500/10 border border-rose-500/20"
                        : isTarget
                          ? "text-yellow-200 bg-yellow-400/10 border border-yellow-400/20"
                          : "text-slate-500 opacity-20"
                    }`}
                  >
                    {star.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback messages */}
          <div className="h-16 flex flex-col items-center justify-center">
            {constellationComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <p className="text-emerald-400 font-medium flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5" /> Rasi Hati Terhubung Sempurna! ❤️
                </p>
                <button
                  onClick={() => {
                    playSound("open");
                    setStage(1);
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-medium hover:from-rose-600 hover:to-indigo-700 shadow-xl shadow-rose-950/20 scale-105 active:scale-95 transition-all text-sm tracking-wide"
                >
                  Terbang ke Langit Cinta 🚀
                </button>
              </motion.div>
            ) : (
              <p className="text-slate-400 text-xs sm:text-sm italic">
                {(() => {
                  const nextTargetIdx = getNextStarTargetIndex();
                  if (nextTargetIdx === -1) return "";
                  return `Selanjutnya, klik bintang "${CONSTELLATION_STARS[nextTargetIdx].name}"`;
                })()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STAGE 1: HEART CATCHER GAME SCREEN
          ========================================== */}
      {stage === 1 && (
        <div className="relative w-full max-w-lg flex flex-col items-center justify-center z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 w-full"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-rose-300 drop-shadow-md flex items-center justify-center gap-2">
              Koleksi Cinta Adi{" "}
              <Heart className="w-6 h-6 fill-current text-rose-500 animate-bounce" />
            </h1>
            <p className="text-xs sm:text-sm text-pink-200/60 mt-1 max-w-xs mx-auto">
              Ketuk/klik setiap ikon cinta dan bunga yang melayang untuk mengisi
              tangki sayangnya Adi!
            </p>
          </motion.div>

          {/* Love Meter Bar */}
          <div className="w-full max-w-sm bg-black/30 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-xl mb-8">
            <div className="flex justify-between items-center text-xs text-rose-200 font-semibold mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Love Meter
              </span>
              <span>{loveMeter}%</span>
            </div>

            <div className="relative w-full h-5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner flex items-center">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 rounded-full"
                animate={{ width: `${loveMeter}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              {/* Beating heart icon riding at the end of the bar */}
              {loveMeter > 0 && (
                <motion.div
                  className="absolute"
                  style={{ left: `calc(${loveMeter}% - 12px)` }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Heart className="w-6 h-6 fill-rose-400 text-rose-200 stroke-2 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                </motion.div>
              )}
            </div>

            <p className="text-center text-pink-300/80 text-xs mt-3 h-5 flex items-center justify-center italic">
              {getCuteCommentary()}
            </p>
          </div>

          {/* Game area bounding container */}
          <div className="relative w-full h-[50vh] max-h-[400px] border border-white/5 bg-slate-950/20 backdrop-blur-xs rounded-3xl overflow-hidden shadow-2xl">
            {/* Instruction layer when no items clicked yet */}
            {catchCounter === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500/80 pointer-events-none text-center p-6">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex flex-col items-center"
                >
                  <Heart className="w-12 h-12 stroke-[1.5] mb-2 text-pink-500/40" />
                  <p className="text-xs">
                    Balon cinta akan melayang ke atas di sini
                  </p>
                </motion.div>
              </div>
            )}

            {/* Falling/Floating items */}
            <AnimatePresence>
              {catcherItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={(e) => handleItemCatch(e, item)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-2 focus:outline-hidden"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center justify-center p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    style={{
                      backgroundColor: `${item.color}15`,
                      border: `1.5px solid ${item.color}`,
                      boxShadow: `0 0 12px ${item.color}33`,
                    }}
                  >
                    {item.type === "heart" ? (
                      <Heart
                        className="fill-current"
                        style={{
                          color: item.color,
                          width: item.size / 1.5,
                          height: item.size / 1.5,
                        }}
                      />
                    ) : item.type === "rose" ? (
                      <span
                        className="text-xl"
                        style={{ fontSize: item.size / 1.8 }}
                      >
                        🌹
                      </span>
                    ) : (
                      <Sparkles
                        className="text-yellow-300 fill-yellow-100"
                        style={{
                          width: item.size / 1.6,
                          height: item.size / 1.6,
                        }}
                      />
                    )}
                  </motion.div>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Floating pop-up feedback text in the game area */}
            {floatingTexts.map((text) => (
              <motion.div
                key={text.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-playpen font-semibold text-xs sm:text-sm text-pink-200 pointer-events-none drop-shadow-md z-30"
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                }}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -40, scale: 1.1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {text.text}
              </motion.div>
            ))}
          </div>

          {/* Proceed button once complete */}
          <div className="h-16 flex items-center justify-center mt-6 w-full">
            {gameComplete && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  playSound("open");
                  setStage(2);
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white font-semibold hover:from-emerald-600 hover:to-indigo-700 shadow-xl shadow-teal-950/20 scale-105 active:scale-95 transition-all text-sm tracking-wide flex items-center gap-2"
              >
                Buka Kado Spesial 🎁✨
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STAGE 2: THE GRAND REVEAL (LETTER & VOUCHERS)
          ========================================== */}
      {stage === 2 && (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center z-10 py-8 px-4">
          {/* Header Message */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-amber-300 drop-shadow-lg mb-2">
              Hadiah Spesial Helda ❤️
            </h1>
            <p className="text-sm text-pink-200/60 max-w-sm mx-auto">
              Adi sudah menyiapkan kejutan khusus ini untukmu. Silakan sentuh
              amplop di bawah ini untuk membukanya!
            </p>
          </motion.div>

          {/* Interactive Envelope Container */}
          <div className="relative w-full flex flex-col items-center mb-12">
            {!isEnvelopeOpen ? (
              // SEALED ENVELOPE
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnvelopeClick}
                className="relative w-80 h-52 bg-gradient-to-br from-rose-800 to-rose-950 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-rose-700/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden z-20 group"
              >
                {/* Flap details */}
                <div
                  className="absolute inset-0 bg-no-repeat bg-cover opacity-10 group-hover:scale-105 transition-transform duration-500"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, #fda4af 0%, transparent 60%)",
                  }}
                />

                {/* Envelope fold diagonal borders */}
                <div className="absolute inset-0 border-[3px] border-double border-rose-600/10 rounded-2xl pointer-events-none" />

                <div className="flex flex-col items-center z-10 gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-400/40 shadow-inner"
                  >
                    <Mail className="w-8 h-8 text-rose-300 fill-rose-500/10" />
                  </motion.div>

                  <span className="font-romantic text-2xl text-rose-200 font-semibold tracking-wide">
                    Untuk Helda Tersayang...
                  </span>

                  <span className="text-[10px] text-rose-400 font-code uppercase tracking-[0.2em] bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-800/30">
                    Klik untuk membuka 💌
                  </span>
                </div>

                {/* Wax Seal Heart in the center bottom */}
                <div className="absolute -bottom-2 w-10 h-10 rounded-full bg-rose-600 border-2 border-rose-400 shadow-md flex items-center justify-center transform translate-y-[-50%] z-20">
                  <Heart className="w-5 h-5 fill-current text-white" />
                </div>
              </motion.div>
            ) : (
              // OPENED ENVELOPE WITH THE REVEALED GIFT
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full flex flex-col items-center gap-8 z-10"
              >
                {/* Beautiful SVG Rose Bouquet & Love Letter Side-by-Side (or stacked on mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 w-full">
                  {/* LEFT: THE INTERACTIVE SVG ROSE BOUQUET (40% width) */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="md:col-span-5 flex flex-col items-center justify-center bg-white/3 border border-white/5 rounded-3xl p-4 sm:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden min-h-[260px] md:min-h-[300px]"
                  >
                    {/* Glowing Aura background */}
                    <div className="absolute inset-0 bg-radial-gradient from-rose-500/20 via-transparent to-transparent pointer-events-none" />

                    <h3 className="text-lg font-display font-semibold text-rose-300 mb-4 tracking-wide text-center">
                      Buket Mawar Cantik 🌹
                    </h3>

                    {/* SVG Bouquet Layout */}
                    <svg
                      className="w-full max-w-[200px] h-auto drop-shadow-[0_10px_25px_rgba(244,63,94,0.4)]"
                      viewBox="0 0 200 240"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Wrapping paper behind */}
                      <path
                        d="M70 200 L100 230 L130 200 L180 80 L20 80 Z"
                        fill="#fda4af"
                        opacity="0.35"
                        stroke="#f472b6"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M100 230 L30 90 L170 90 Z"
                        fill="#fbcfe8"
                        opacity="0.5"
                      />

                      {/* Leaves */}
                      <path
                        d="M60 110 C50 90, 40 100, 30 110 C40 120, 55 120, 60 110 Z"
                        fill="#10b981"
                      />
                      <path
                        d="M140 110 C150 90, 160 100, 170 110 C160 120, 145 120, 140 110 Z"
                        fill="#10b981"
                      />
                      <path
                        d="M110 70 C100 50, 80 60, 90 85 C100 85, 110 80, 110 70 Z"
                        fill="#059669"
                      />

                      {/* Stems */}
                      <path
                        d="M75 140 L100 210 M100 130 L100 220 M125 140 L100 210"
                        stroke="#047857"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Flowers (Clickable/Hoverable) */}
                      {/* Rose 1: Center */}
                      <g className="cursor-pointer hover:scale-110 origin-[100px_90px] transition-transform duration-300">
                        <circle cx="100" cy="90" r="26" fill="#f43f5e" />
                        <path
                          d="M100 75 C90 75, 85 85, 95 95 C105 105, 115 90, 100 75 Z"
                          fill="#e11d48"
                        />
                        <path
                          d="M100 82 C93 82, 93 92, 100 95 C107 92, 107 82, 100 82 Z"
                          fill="#be123c"
                        />
                        <circle
                          cx="100"
                          cy="90"
                          r="6"
                          fill="#fda4af"
                          opacity="0.8"
                        />
                      </g>

                      {/* Rose 2: Left */}
                      <g className="cursor-pointer hover:scale-110 origin-[65px_120px] transition-transform duration-300">
                        <circle cx="65" cy="120" r="22" fill="#fb7185" />
                        <path
                          d="M65 108 C57 108, 52 116, 61 124 C70 132, 78 120, 65 108 Z"
                          fill="#f43f5e"
                        />
                        <path
                          d="M65 113 C60 113, 60 121, 65 124 C70 121, 70 113, 65 113 Z"
                          fill="#e11d48"
                        />
                        <circle
                          cx="65"
                          cy="120"
                          r="5"
                          fill="#fbcfe8"
                          opacity="0.8"
                        />
                      </g>

                      {/* Rose 3: Right */}
                      <g className="cursor-pointer hover:scale-110 origin-[135px_120px] transition-transform duration-300">
                        <circle cx="135" cy="120" r="22" fill="#fb7185" />
                        <path
                          d="M135 108 C127 108, 122 116, 131 124 C140 132, 148 120, 135 108 Z"
                          fill="#f43f5e"
                        />
                        <path
                          d="M135 113 C130 113, 130 121, 135 124 C140 121, 140 113, 135 113 Z"
                          fill="#e11d48"
                        />
                        <circle
                          cx="135"
                          cy="120"
                          r="5"
                          fill="#fbcfe8"
                          opacity="0.8"
                        />
                      </g>

                      {/* Rose 4: Top Left */}
                      <g className="cursor-pointer hover:scale-110 origin-[72px_75px] transition-transform duration-300">
                        <circle cx="72" cy="75" r="18" fill="#fda4af" />
                        <path
                          d="M72 65 C65 65, 61 72, 69 78 C77 84, 83 75, 72 65 Z"
                          fill="#fb7185"
                        />
                        <circle
                          cx="72"
                          cy="75"
                          r="4"
                          fill="#fff"
                          opacity="0.8"
                        />
                      </g>

                      {/* Rose 5: Top Right */}
                      <g className="cursor-pointer hover:scale-110 origin-[128px_75px] transition-transform duration-300">
                        <circle cx="128" cy="75" r="18" fill="#fda4af" />
                        <path
                          d="M128 65 C121 65, 117 72, 125 78 C133 84, 139 75, 128 65 Z"
                          fill="#fb7185"
                        />
                        <circle
                          cx="128"
                          cy="75"
                          r="4"
                          fill="#fff"
                          opacity="0.8"
                        />
                      </g>

                      {/* Wrapping paper front wrap fold */}
                      <path
                        d="M100 230 L10 80 H190 Z"
                        fill="none"
                        stroke="#f472b6"
                        strokeWidth="2"
                      />
                      <path
                        d="M100 230 L55 130 L10 80 Z"
                        fill="#fda4af"
                        opacity="0.4"
                      />
                      <path
                        d="M100 230 L145 130 L190 80 Z"
                        fill="#fda4af"
                        opacity="0.4"
                      />

                      {/* Big Pink Ribbon Ribbon Bow */}
                      <path
                        d="M100 190 C85 170, 75 190, 100 195 C125 190, 115 170, 100 190 Z"
                        fill="#db2777"
                      />
                      <circle cx="100" cy="192" r="6" fill="#f472b6" />
                      <path
                        d="M100 195 L80 220 M100 195 L120 220"
                        stroke="#db2777"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>

                    <p className="text-[10px] text-pink-300/60 text-center italic mt-4 max-w-[160px]">
                      Arahkan mouse atau sentuh bunga mawar untuk melihat
                      kelopaknya bereaksi... 🌹✨
                    </p>
                  </motion.div>

                  {/* RIGHT: THE SCROLLABLE HEARTFELT LOVE LETTER (70% width) */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="md:col-span-7 bg-amber-50 text-slate-800 rounded-3xl p-5 sm:p-8 shadow-[0_20px_50px_rgba(244,63,94,0.15)] relative border border-amber-100 flex flex-col justify-between"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 10% 10%, #fffbf2 0%, #fef8eb 100%)",
                    }}
                  >
                    {/* Vintage envelope lining design style */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-400 via-pink-400 to-indigo-400 rounded-t-3xl" />

                    <div className="flex justify-between items-center mb-4 mt-2">
                      <span className="text-xs text-rose-500/80 font-code font-bold uppercase tracking-wider">
                        Personal Note 💌
                      </span>
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
                    </div>

                    {/* Scrollable Letter Content */}
                    <div className="max-h-[260px] md:max-h-[320px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-rose-200">
                      <p className="font-romantic text-2xl sm:text-3xl text-rose-600 mb-4 font-semibold">
                        Halo Helda sayang, ❤️
                      </p>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-playpen mb-4 font-light text-justify">
                        Sejak pertama kali kamu hadir dalam hidupku, hari-hari
                        terasa jauh lebih berwarna dan penuh tawa. Kebaikanmu,
                        senyum manis kamu, dan perhatian kecil yang selalu kamu
                        berikan membuatku bersyukur memiliki kamu di setiap
                        langkahku.
                      </p>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-playpen mb-4 font-light text-justify">
                        Mungkin aku tidak selalu bisa merangkai kata-kata indah
                        secara langsung, tapi lewat baris-baris kode ini, aku
                        ingin menyampaikan betapa berharganya dirimu bagiku.
                      </p>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-playpen mb-6 font-light text-justify">
                        Terima kasih sudah menjadi bagian terindah dalam
                        duniaku. Aku menyayangimu hari ini, esok, dan
                        seterusnya. 🌹✨
                      </p>

                      <div className="text-right mt-6 flex flex-col items-end">
                        <span className="text-xs text-slate-400 italic font-playpen">
                          Dengan sepenuh hati,
                        </span>
                        <span className="font-romantic text-2xl text-rose-600 font-bold mt-1">
                          Adi Primanto
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* BOTTOM: THE INTERACTIVE LOVE VOUCHERS */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-full mt-10 flex flex-col items-center"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-pink-300 flex items-center justify-center gap-2">
                      Voucher Cinta Khusus Helda 🎫❤️
                    </h3>
                    <p className="text-xs text-pink-200/50 mt-1 max-w-sm">
                      Klaim kupon spesial di bawah ini (screenshot kupon yang
                      sudah diklaim lalu tunjukkan ke Adi untuk menukarnya!)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                    {VOUCHERS.map((v) => {
                      const isClaimed = claimedVouchers[v.id];
                      return (
                        <div
                          key={v.id}
                          className={`relative rounded-2xl border p-5 bg-gradient-to-b ${v.color} flex flex-col justify-between h-64 overflow-hidden backdrop-blur-md shadow-lg transition-all duration-300 ${
                            isClaimed
                              ? "scale-95 brightness-75 shadow-inner"
                              : "hover:-translate-y-1 hover:shadow-rose-950/20"
                          }`}
                        >
                          {/* Claim Stamp overlay */}
                          <AnimatePresence>
                            {isClaimed && (
                              <motion.div
                                initial={{ scale: 3, rotate: 45, opacity: 0 }}
                                animate={{ scale: 1, rotate: -15, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 15,
                                }}
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                              >
                                <div className="border-4 border-rose-500 border-dashed rounded-xl px-4 py-2 rotate-[-15deg] bg-black/40 shadow-lg flex flex-col items-center">
                                  <span className="text-rose-500 font-display font-black text-2xl tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                    CLAIMED ❤️
                                  </span>
                                  <span className="text-[8px] text-rose-300/80 font-code tracking-widest mt-0.5">
                                    {v.code}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex flex-col gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                              {v.icon}
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-sm text-pink-100 leading-tight">
                                {v.title}
                              </h4>
                              <p className="text-xs text-pink-200/60 font-light mt-1.5 leading-relaxed">
                                {v.desc}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5">
                            <button
                              onClick={() => handleClaimVoucher(v.id)}
                              disabled={isClaimed}
                              className={`w-full py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                                isClaimed
                                  ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                                  : "bg-white text-slate-950 hover:bg-rose-100 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                              }`}
                            >
                              {isClaimed
                                ? "Kupon Sudah Diklaim"
                                : "Klaim Voucher 🌟"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Restart Game Option */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playSound("open");
                      setStage(0);
                      setConnectedIndices([0]);
                      setConstellationComplete(false);
                      setLoveMeter(0);
                      setCatcherItems([]);
                      setGameComplete(false);
                      setCatchCounter(0);
                      setIsEnvelopeOpen(false);
                      setClaimedVouchers({});
                    }}
                    className="mt-12 flex items-center gap-2 text-xs text-pink-300/40 hover:text-pink-300/70 border border-white/5 hover:border-white/10 bg-white/2 hover:bg-white/5 rounded-full px-4 py-2 transition-all cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5" /> Ulangi Game Dari Awal 🔄
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
