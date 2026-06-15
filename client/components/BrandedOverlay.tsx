// Overlay de marca para players de vídeo.
// 1. INTRO: sequência REC → dispositivo → clique → zoom → wordmark (portada
//    do intro-referencia.html). Corre no mount e, quando retriggerOnRestart=true,
//    sempre que o vídeo recomeça do início (páginas individuais, não feeds).
// 2. MARCA DE ÁGUA: "@username · suckorsex.com" sempre visível, roda entre
//    4 cantos a cada 4 s (CSS transition, pointer-events: none).
// Som via Web Audio API — só toca se AudioContext já estiver running
// (respeito automático à política de autoplay dos browsers).

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface Props {
  username?: string | null;
  showIntro?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  retriggerOnRestart?: boolean;
  onDismiss?: () => void;
}

const WM_SPOTS = [
  { top: "12%", left: "8%"  },
  { top: "12%", left: "60%" },
  { top: "78%", left: "8%"  },
  { top: "78%", left: "54%" },
] as const;

export default function BrandedOverlay({ username, showIntro = true, videoRef, retriggerOnRestart = true, onDismiss }: Props) {
  const introRef = useRef<HTMLDivElement>(null);

  // false = overlay visível; true = dispensado. Inicia oculto se showIntro===false.
  const [introGone, setIntroGone] = useState(showIntro === false);
  const [spotIdx, setSpotIdx] = useState(0);

  // ── Audio state (all in refs — no re-renders) ─────────────────────────────
  const actxRef     = useRef<AudioContext | null>(null);
  const noiseBufRef = useRef<AudioBuffer | null>(null);
  const busRef      = useRef<GainNode | null>(null);
  const fxDelayRef  = useRef<DelayNode | null>(null);

  // ── Animation tracking ────────────────────────────────────────────────────
  const animsRef   = useRef<Animation[]>([]);
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tcTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);
  const pendingRunRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // ensureCtx: cria o AudioContext na primeira interação do utilizador.
  // Se state === 'suspended' (autoplay policy), faz resume.
  // scheduleAudio verifica state === 'running' antes de emitir som.
  // ─────────────────────────────────────────────────────────────────────────
  const ensureCtx = useCallback((): AudioContext | null => {
    if (!actxRef.current) {
      const AC =
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      actxRef.current = ctx;
      const len = ctx.sampleRate * 1.2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBufRef.current = buf;
    }
    if (actxRef.current.state === "suspended") actxRef.current.resume();
    return actxRef.current;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // endIntro: chamado pelo timeout (5 s) ou por toque do utilizador.
  // ─────────────────────────────────────────────────────────────────────────
  const endIntro = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    if (tcTimerRef.current) { clearInterval(tcTimerRef.current); tcTimerRef.current = null; }
    setIntroGone(true);
    onDismiss?.();
  }, [onDismiss]);

  // ─────────────────────────────────────────────────────────────────────────
  // runIntro: síntese de áudio e animação (portada do IIFE de referência).
  // ─────────────────────────────────────────────────────────────────────────
  const runIntro = useCallback(() => {
    const intro = introRef.current;
    if (!intro) return;

    // ── Reset ────────────────────────────────────────────────────────────
    animsRef.current.forEach(a => a.cancel()); animsRef.current = [];
    timersRef.current.forEach(clearTimeout);   timersRef.current = [];
    if (tcTimerRef.current) { clearInterval(tcTimerRef.current); tcTimerRef.current = null; }

    // ── Query DOM ────────────────────────────────────────────────────────
    const vf        = intro.querySelector<HTMLElement>(".bi-vf")!;
    const rec       = intro.querySelector<HTMLElement>(".bi-rec")!;
    const tc        = intro.querySelector<HTMLElement>(".bi-tc")!;
    const device    = intro.querySelector<HTMLElement>(".bi-device")!;
    const sglow     = intro.querySelector<SVGCircleElement>(".bi-sglow")!;
    const ptri      = intro.querySelector<SVGPathElement>(".bi-ptri")!;
    const tap       = intro.querySelector<HTMLElement>(".bi-tap")!;
    const ripple    = intro.querySelector<HTMLElement>(".bi-ripple")!;
    const fill      = intro.querySelector<HTMLElement>(".bi-fill")!;
    const end       = intro.querySelector<HTMLElement>(".bi-end")!;
    const line      = intro.querySelector<HTMLElement>(".bi-line")!;
    const community = intro.querySelector<HTMLElement>(".bi-community")!;
    const words     = intro.querySelectorAll<HTMLElement>(".bi-word");

    // Reset visual state
    [vf, rec, tc].forEach(e => { e.style.opacity = "0"; });
    device.style.opacity = "0"; device.style.transform = "scale(.6)";
    sglow.setAttribute("opacity", "0"); ptri.setAttribute("opacity", "0");
    tap.style.opacity = "0"; ripple.style.opacity = "0"; fill.style.opacity = "0";
    end.style.opacity = "0"; line.style.width = "0"; community.style.opacity = "0";
    words.forEach(w => { w.style.opacity = "0"; w.style.transform = "translateY(16px)"; });

    // Position device/tap/ripple/fill at intro centre
    const cw = intro.offsetWidth, ch = intro.offsetHeight;
    const cx = cw / 2, cy = ch / 2;
    device.style.left  = (cx - 46) + "px"; device.style.top  = (cy - 89) + "px";
    tap.style.left     = (cx - 27) + "px"; tap.style.top     = (cy - 27) + "px";
    ripple.style.left  = (cx - 27) + "px"; ripple.style.top  = (cy - 27) + "px";
    fill.style.left    = (cx - 32) + "px"; fill.style.top    = (cy - 65) + "px";

    // ── Audio helpers (locais, portados directamente do HTML de referência) ──
    const getBus = (): GainNode => {
      const actx = actxRef.current!;
      if (!busRef.current) {
        const comp = actx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 22; comp.ratio.value = 4;
        comp.attack.value = 0.003; comp.release.value = 0.2;
        const g = actx.createGain(); g.gain.value = 0.8;
        g.connect(comp); comp.connect(actx.destination); busRef.current = g;
        const dl = actx.createDelay(); dl.delayTime.value = 0.1875;
        const fb = actx.createGain(); fb.gain.value = 0.3;
        const wet = actx.createGain(); wet.gain.value = 0.45;
        dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(g);
        fxDelayRef.current = dl;
      }
      return busRef.current;
    };
    const kick = (t: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine";
      o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
      g.gain.setValueAtTime(gain * 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.26);
    };
    const hat = (t: number, gain = 1, open = false) => {
      const actx = actxRef.current!, bus = getBus();
      const s = actx.createBufferSource(); s.buffer = noiseBufRef.current;
      const hp = actx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7200;
      const g = actx.createGain(); const d = open ? 0.13 : 0.032;
      g.gain.setValueAtTime(gain * 0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      s.connect(hp).connect(g).connect(bus); s.start(t); s.stop(t + d + 0.02);
    };
    const snare = (t: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      const s = actx.createBufferSource(); s.buffer = noiseBufRef.current;
      const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.7;
      const g = actx.createGain();
      g.gain.setValueAtTime(gain * 0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t + 0.18);
      const o2 = actx.createOscillator(), og = actx.createGain(); o2.type = "triangle"; o2.frequency.setValueAtTime(185, t);
      og.gain.setValueAtTime(gain * 0.22, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o2.connect(og).connect(bus); o2.start(t); o2.stop(t + 0.13);
    };
    const bass = (t: number, freq: number, dur: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      const o = actx.createOscillator(), o2 = actx.createOscillator();
      const f = actx.createBiquadFilter(), g = actx.createGain();
      o.type = "sawtooth"; o2.type = "square";
      o.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq / 2, t);
      f.type = "lowpass"; f.Q.value = 7;
      f.frequency.setValueAtTime(160, t); f.frequency.linearRampToValueAtTime(1000, t + 0.04);
      f.frequency.exponentialRampToValueAtTime(230, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * 0.34, t + 0.01);
      g.gain.setValueAtTime(gain * 0.30, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(f); o2.connect(f); f.connect(g).connect(bus);
      o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
    };
    const lead = (t: number, freq: number, dur: number, gain = 1, send = false) => {
      const actx = actxRef.current!, bus = getBus();
      const o = actx.createOscillator(), o2 = actx.createOscillator();
      const f = actx.createBiquadFilter(), g = actx.createGain();
      o.type = "sawtooth"; o2.type = "sawtooth";
      o.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq, t); o2.detune.setValueAtTime(9, t);
      f.type = "lowpass"; f.Q.value = 9;
      f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(4600, t + 0.08);
      f.frequency.exponentialRampToValueAtTime(950, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * 0.17, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(f); o2.connect(f); f.connect(g).connect(bus);
      if (send && fxDelayRef.current) g.connect(fxDelayRef.current);
      o.start(t); o2.start(t); o.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
    };
    const stab = (t: number, freqs: number[], dur: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      freqs.forEach(fr => {
        const o = actx.createOscillator(), o2 = actx.createOscillator();
        const f = actx.createBiquadFilter(), g = actx.createGain();
        o.type = "sawtooth"; o2.type = "sawtooth"; o2.detune.value = 11;
        o.frequency.setValueAtTime(fr, t); o2.frequency.setValueAtTime(fr, t);
        f.type = "lowpass"; f.Q.value = 3;
        f.frequency.setValueAtTime(3800, t); f.frequency.exponentialRampToValueAtTime(750, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * 0.1, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(f); o2.connect(f); f.connect(g).connect(bus);
        o.start(t); o2.start(t); o.stop(t + dur + 0.03); o2.stop(t + dur + 0.03);
      });
    };
    const sub = (t: number, freq: number, dur: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * 0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.03);
    };
    const impact = (t: number) => {
      const actx = actxRef.current!, bus = getBus();
      const s = actx.createBufferSource(); s.buffer = noiseBufRef.current;
      const hp = actx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      s.connect(hp).connect(g).connect(bus); s.start(t); s.stop(t + 0.72);
    };
    const riser = (t: number, dur: number) => {
      const actx = actxRef.current!, bus = getBus();
      const s = actx.createBufferSource(); s.buffer = noiseBufRef.current;
      const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(320, t); bp.frequency.exponentialRampToValueAtTime(6500, t + dur);
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.9);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
      s.connect(bp).connect(g).connect(bus); s.start(t); s.stop(t + dur + 0.06);
    };
    const bell = (t: number, freq: number, dur: number, gain = 1) => {
      const actx = actxRef.current!, bus = getBus();
      const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * 0.12, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(bus);
      if (fxDelayRef.current) g.connect(fxDelayRef.current);
      o.start(t); o.stop(t + dur + 0.03);
    };

    const scheduleAudio = () => {
      const c = ensureCtx(); if (!c || c.state !== "running") return;
      getBus();
      const t0 = c.currentTime + 0.05, S = 0.15;
      const A2 = 110, C3 = 130.81, E3 = 164.81, G3 = 196, A3 = 220;
      const A4 = 440, C5 = 523.25, D5 = 587.33, E5 = 659.25;
      sub(t0, 55, 0.9, 0.3);
      hat(t0 + 0.16, 0.5, false);
      const gS = t0 + 0.9;
      [0, 4, 8, 12, 15].forEach(s => kick(gS + s * S, s === 0 ? 1 : 0.85));
      kick(gS + 10 * S, 0.65);
      [2, 6, 10, 14].forEach(s => hat(gS + s * S, 0.85, false));
      [0, 4, 8, 12].forEach(s => hat(gS + s * S, 0.4, false));
      [4, 12].forEach(s => snare(gS + s * S, 0.6));
      ([
        [0, A2, 3], [3, A2, 1], [4, A3, 1], [6, G3, 2],
        [8, A2, 2], [10, C3, 1], [11, A2, 1], [12, A3, 1], [13, E3, 1],
      ] as [number, number, number][]).forEach(([b, f, d]) =>
        bass(gS + b * S, f, d * S * 0.95, b === 0 ? 1 : 0.8)
      );
      ([
        [8, E5, 2], [10, D5, 1], [11, C5, 1], [12, A4, 3],
      ] as [number, number, number][]).forEach(([b, f, d]) =>
        lead(gS + b * S, f, d * S * 0.95, 0.6, true)
      );
      snare(t0 + 2.35, 0.55);
      riser(t0 + 2.55, 0.80);
      const L = t0 + 3.32;
      kick(L, 1.2); sub(L, 55, 0.95, 0.7); impact(L); snare(L, 0.45);
      stab(L, [220, 261.63, 329.63, 440], 1.6, 1.0);
      lead(L, A4, 1.3, 0.9, true);
      const Lo = L + 0.55;
      kick(Lo, 0.9); kick(Lo + 2 * S, 0.8); kick(Lo + 4 * S, 0.9);
      [1, 3, 5].forEach(s => hat(Lo + s * S, 0.55));
      bass(Lo, A2, 2 * S, 0.8); bass(Lo + 2 * S, E3, 2 * S, 0.8); bass(Lo + 4 * S, G3, 2 * S, 0.7);
      bell(L + 0.7, 880, 0.7, 1); bell(L + 0.97, 1318.5, 0.8, 0.8); bell(L + 1.25, 1760, 0.9, 0.6);
    };

    // ── Run ──────────────────────────────────────────────────────────────
    playingRef.current = true;
    scheduleAudio();

    const A = (el: Element, kf: Keyframe[], opt: KeyframeAnimationOptions): Animation => {
      const a = el.animate(kf, { fill: "both", easing: "ease", ...opt });
      animsRef.current.push(a);
      return a;
    };
    const T = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    A(vf, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 60 });
    [...vf.querySelectorAll<HTMLElement>(".bi-corner")].forEach((c, i) =>
      A(c, [{ transform: "scale(.4)" }, { transform: "scale(1)" }],
        { duration: 450, delay: 60 + i * 60, easing: "cubic-bezier(.2,.8,.2,1)" })
    );
    A(rec, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160 });
    A(tc,  [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160 });

    let f = 0;
    tcTimerRef.current = setInterval(() => {
      f++;
      const ff = String(f % 30).padStart(2, "0");
      const ss = String(Math.floor(f / 30)).padStart(2, "0");
      tc.textContent = "00:00:" + ss + ":" + ff;
    }, 33);

    A(device, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 600, delay: 850, easing: "cubic-bezier(.34,1.4,.5,1)" });
    A(sglow, [{ opacity: 0 }, { opacity: .95 }], { duration: 500, delay: 1250 });
    A(ptri,  [{ opacity: 0 }, { opacity: 1 }],  { duration: 400, delay: 1400 });
    A(tap,
      [{ opacity: 0, transform: "scale(2.2) translateY(-40px)" },
       { opacity: 1, transform: "scale(1) translateY(0)" }],
      { duration: 650, delay: 1650, easing: "cubic-bezier(.3,.7,.2,1)" });

    T(() => {
      A(tap,    [{ transform: "scale(1)" }, { transform: "scale(.8)" }, { transform: "scale(1)" }],
        { duration: 260, easing: "ease-out" });
      A(ripple, [{ opacity: .9, transform: "scale(.5)" }, { opacity: 0, transform: "scale(3.4)" }],
        { duration: 620, easing: "ease-out" });
    }, 2350);

    T(() => {
      A(device, [{ opacity: 1 }, { opacity: 0 }], { duration: 380 });
      A(tap,    [{ opacity: 1 }, { opacity: 0 }], { duration: 280 });
      fill.style.opacity = "1";
      A(fill,
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 1, transform: "scale(26)" }],
        { duration: 760, delay: 60, easing: "cubic-bezier(.7,0,.85,.2)" });
    }, 2560);

    T(() => {
      end.style.opacity = "1";
      A(fill, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
      [...words].forEach((w, i) =>
        A(w,
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 520, delay: i * 130, easing: "cubic-bezier(.2,.8,.2,1)" })
      );
      A(line,
        [{ width: "0px" }, { width: "150px" }],
        { duration: 560, delay: 430, easing: "cubic-bezier(.2,.8,.2,1)" });
      A(community,
        [{ opacity: 0, letterSpacing: ".02em" }, { opacity: 1, letterSpacing: ".32em" }],
        { duration: 700, delay: 560 });
    }, 3320);

    T(endIntro, 5000);
  }, [ensureCtx, endIntro]);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showIntro) runIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-trigger: corre runIntro após setIntroGone(false) via triggerIntro ──
  useEffect(() => {
    if (!introGone && pendingRunRef.current) {
      pendingRunRef.current = false;
      runIntro();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introGone]);

  const triggerIntro = useCallback(() => {
    if (playingRef.current) return;
    pendingRunRef.current = true;
    setIntroGone(false);
  }, []);

  // ── Detecção de reinício via timeupdate (só se retriggerOnRestart=true) ───
  // prevTime > 1.5 s → currentTime < 0.3 s = salto para o início.
  // Cobre: loop (attr loop não dispara 'play'/'ended'), seek manual, replay.
  // Não dispara no primeiro play (prevTime começa em 0, nunca > 1.5).
  useEffect(() => {
    if (!retriggerOnRestart) return;
    const video = videoRef?.current;
    if (!video) return;
    let prevTime = 0;
    const onTimeUpdate = () => {
      const cur = video.currentTime;
      if (prevTime > 1.5 && cur < 0.3) triggerIntro();
      prevTime = cur;
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Marca de água: roda entre os 4 cantos a cada 4 s ─────────────────────
  useEffect(() => {
    const id = setInterval(() => setSpotIdx(i => (i + 1) % WM_SPOTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // ── Cleanup no unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      animsRef.current.forEach(a => a.cancel());
      timersRef.current.forEach(clearTimeout);
      if (tcTimerRef.current) clearInterval(tcTimerRef.current);
      actxRef.current?.close().catch(() => {});
    };
  }, []);

  const spot = WM_SPOTS[spotIdx];

  return (
    <>
      {/* ── Keyframes globais ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes bi-grain{0%{transform:translate(0,0)}33%{transform:translate(-6%,3%)}66%{transform:translate(4%,-5%)}100%{transform:translate(0,0)}}
        @keyframes bi-blink{50%{opacity:.15}}
      `}</style>

      {/* ── Marca de água ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          pointerEvents: "none",
          userSelect: "none",
          top: spot.top,
          left: spot.left,
          transition: "top 1.6s ease, left 1.6s ease",
          color: "rgba(255,255,255,.42)",
          fontSize: ".82rem",
          fontWeight: 600,
          textShadow: "0 1px 6px rgba(0,0,0,.7)",
          whiteSpace: "nowrap",
        }}
      >
        {username ? `@${username}` : ""}
        <span style={{ color: "#ff1b8d", margin: "0 6px" }}>·</span>
        suckorsex.com
      </div>

      {/* ── Intro overlay ──────────────────────────────────────────────────── */}
      {!introGone && (
        <div
          ref={introRef}
          style={{
            position: "absolute", inset: 0, zIndex: 30,
            background: "#05040a", overflow: "hidden",
            display: "grid", placeItems: "center", cursor: "pointer",
          }}
          onClick={e => { e.stopPropagation(); ensureCtx(); endIntro(); }}
          onTouchEnd={e => { e.stopPropagation(); ensureCtx(); endIntro(); }}
        >
          {/* Grain */}
          <div style={{
            position: "absolute", inset: "-50%", opacity: .06,
            pointerEvents: "none", mixBlendMode: "screen",
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>")`,
            animation: "bi-grain .5s steps(3) infinite",
          }} />

          {/* Scanlines */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: .5,
            background: "repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px)",
          }} />

          {/* Viewfinder */}
          <div className="bi-vf" style={{ position: "absolute", inset: "7%", pointerEvents: "none", opacity: 0 }}>
            {([
              { top: 0,    left:  0,   borderRight: 0, borderBottom: 0 } as React.CSSProperties,
              { top: 0,    right: 0,   borderLeft:  0, borderBottom: 0 } as React.CSSProperties,
              { bottom: 0, left:  0,   borderRight: 0, borderTop:    0 } as React.CSSProperties,
              { bottom: 0, right: 0,   borderLeft:  0, borderTop:    0 } as React.CSSProperties,
            ]).map((s, i) => (
              <div key={i} className="bi-corner" style={{
                position: "absolute", width: 34, height: 34,
                border: "2px solid rgba(255,255,255,.85)", ...s,
              }} />
            ))}
          </div>

          {/* REC */}
          <div className="bi-rec" style={{
            position: "absolute", top: "9%", left: "9%",
            display: "flex", alignItems: "center", gap: 9,
            fontSize: ".8rem", fontWeight: 700, letterSpacing: ".18em",
            color: "#fff", opacity: 0,
          }}>
            <span style={{
              width: 11, height: 11, borderRadius: "50%", display: "inline-block",
              background: "#ff2d2d", boxShadow: "0 0 12px #ff2d2d",
              animation: "bi-blink 1s steps(1) infinite",
            }} />
            REC
          </div>

          {/* Timecode */}
          <div className="bi-tc" style={{
            position: "absolute", top: "9%", right: "9%",
            fontVariantNumeric: "tabular-nums", fontSize: ".8rem",
            letterSpacing: ".12em", color: "rgba(255,255,255,.85)", opacity: 0,
          }}>
            00:00:00:00
          </div>

          {/* Device */}
          <div className="bi-device" style={{ position: "absolute", opacity: 0, transform: "scale(.6)", willChange: "transform,opacity" }}>
            <svg width="92" height="178" viewBox="0 0 92 178" style={{ display: "block", filter: "drop-shadow(0 18px 40px rgba(155,77,255,.4))" }}>
              <rect x="2" y="2" width="88" height="174" rx="16" fill="#0d0c14" stroke="rgba(255,255,255,.25)" strokeWidth="2" />
              <rect x="9" y="14" width="74" height="150" rx="8" fill="#06050b" />
              <circle className="bi-sglow" cx="46" cy="89" r="30" fill="url(#bi-grad)" opacity="0" />
              <path className="bi-ptri" d="M40 76 L40 102 L62 89 Z" fill="#fff" opacity="0" />
              <rect x="36" y="170" width="20" height="3" rx="1.5" fill="rgba(255,255,255,.25)" />
              <defs>
                <radialGradient id="bi-grad">
                  <stop offset="0%" stopColor="#ff1b8d" />
                  <stop offset="100%" stopColor="#9b4dff" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Tap indicator */}
          <div className="bi-tap" style={{
            position: "absolute", width: 54, height: 54, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,.9)", opacity: 0,
            pointerEvents: "none", boxShadow: "0 0 18px rgba(255,255,255,.4)",
          }}>
            <span style={{
              position: "absolute", inset: 0, margin: "auto",
              width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block",
            }} />
          </div>

          {/* Ripple */}
          <div className="bi-ripple" style={{
            position: "absolute", width: 54, height: 54, borderRadius: "50%",
            border: "2px solid #ff1b8d", opacity: 0, pointerEvents: "none",
          }} />

          {/* Fill zoom */}
          <div className="bi-fill" style={{
            position: "absolute", width: 64, height: 130, borderRadius: 14,
            background: "linear-gradient(135deg,#ff1b8d 0%,#9b4dff 100%)",
            opacity: 0, transform: "scale(1)", willChange: "transform,opacity",
          }} />

          {/* End wordmark */}
          <div className="bi-end" style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 14, opacity: 0,
          }}>
            <div style={{
              fontWeight: 800, fontSize: "clamp(2rem,7.5vw,3.6rem)",
              letterSpacing: "-.03em", display: "flex", gap: ".28em",
            }}>
              <span className="bi-word" style={{ color: "#ff1b8d", opacity: 0, transform: "translateY(16px)", display: "inline-block" }}>suck</span>
              <span className="bi-word" style={{ color: "#7a7a88", opacity: 0, transform: "translateY(16px)", display: "inline-block" }}>or</span>
              <span className="bi-word" style={{ color: "#9b4dff", opacity: 0, transform: "translateY(16px)", display: "inline-block" }}>sex</span>
            </div>
            <div className="bi-line" style={{ width: 0, height: 2, background: "linear-gradient(135deg,#ff1b8d 0%,#9b4dff 100%)", borderRadius: 2 }} />
            <div className="bi-community" style={{
              fontSize: ".85rem", fontWeight: 600, letterSpacing: ".1em",
              textTransform: "uppercase", color: "rgba(255,255,255,.7)", opacity: 0,
            }}>
              community
            </div>
          </div>

          {/* Skip hint */}
          <div style={{
            position: "absolute", bottom: "5%", left: 0, right: 0, textAlign: "center",
            fontSize: ".7rem", letterSpacing: ".16em", textTransform: "uppercase",
            color: "rgba(255,255,255,.35)",
          }}>
            tocar para saltar
          </div>
        </div>
      )}
    </>
  );
}
