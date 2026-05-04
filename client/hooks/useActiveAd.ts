// src/hooks/useActiveAd.ts
// ─────────────────────────────────────────────────────────────
// FIX: O AdBanner é montado várias vezes na mesma página.
// Cada instância do hook não pode criar o seu próprio canal
// Supabase — o segundo .on() depois de .subscribe() crasha.
//
// SOLUÇÃO: Singleton fora do React.
//   • Um único canal Supabase para toda a app
//   • Listeners internos registados por instância do hook
//   • Rotação a cada 8s partilhada por todas as instâncias
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ActiveAd = {
  id:           string;
  company_name: string;
  website_url:  string;
  headline:     string;
  description:  string;
  cta_text:     string;
  logo_url:     string | null;
  bg_color:     string;
  accent_color: string;
  ends_at:      string;
};

// ─────────────────────────────────────────────
// SINGLETON — vive fora do React, partilhado
// por todas as instâncias do hook na mesma tab
// ─────────────────────────────────────────────
const ROTATION_MS = 8000;

let   _ads:       ActiveAd[]            = [];
let   _idx:       number                = 0;
let   _loading:   boolean               = true;
let   _listeners: Set<() => void>       = new Set();
let   _channel:   ReturnType<typeof supabase.channel> | null = null;
let   _rotTimer:  ReturnType<typeof setInterval> | null      = null;
let   _fetchInFlight = false;

function _notify() {
  _listeners.forEach(fn => fn());
}

async function _fetchAds() {
  if (_fetchInFlight) return;
  _fetchInFlight = true;
  try {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("ads")
      .select("id,company_name,website_url,headline,description,cta_text,logo_url,bg_color,accent_color,ends_at")
      .eq("status", "active")
      .lte("starts_at", now)
      .gte("ends_at",   now)
      .order("starts_at", { ascending: true });

    _ads     = (data ?? []) as ActiveAd[];
    _idx     = 0;
    _loading = false;
    _restartRotation();
    _notify();
  } finally {
    _fetchInFlight = false;
  }
}

function _restartRotation() {
  if (_rotTimer) { clearInterval(_rotTimer); _rotTimer = null; }
  if (_ads.length <= 1) return;
  _rotTimer = setInterval(() => {
    _idx = (_idx + 1) % _ads.length;
    _notify();
  }, ROTATION_MS);
}

function _ensureChannel() {
  if (_channel) return;               // já existe, não criar outro
  _channel = supabase
    .channel("ads-rt-singleton")     // nome único e fixo
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ads" },
      () => _fetchAds()
    )
    .subscribe();
}

function _teardownIfNoListeners() {
  if (_listeners.size > 0) return;
  // Ninguém está a ouvir — limpa tudo
  if (_rotTimer)  { clearInterval(_rotTimer); _rotTimer = null; }
  if (_channel)   { supabase.removeChannel(_channel); _channel = null; }
  _loading = true;   // próxima montagem vai buscar de novo
}

// ─────────────────────────────────────────────
// HOOK — cada instância subscreve o singleton
// ─────────────────────────────────────────────
export function useActiveAd() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    // Registar listener neste componente
    const listener = () => forceRender(n => n + 1);
    _listeners.add(listener);

    // Arrancar canal e fetch (apenas uma vez globalmente)
    _ensureChannel();
    if (_loading && !_fetchInFlight) _fetchAds();

    return () => {
      _listeners.delete(listener);
      // Se foi o último componente, limpa recursos
      _teardownIfNoListeners();
    };
  }, []);

  return {
    ad:       _ads.length > 0 ? _ads[_idx] : null,
    totalAds: _ads.length,
    loading:  _loading,
  };
}