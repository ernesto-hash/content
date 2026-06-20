// api/audit.ts
// ─────────────────────────────────────────────────────────────────────────────
// AUDITOR DO SITE — FASE 1 (SÓ LEITURA)
//
// Esta função NÃO altera NADA. Apenas lê a base de dados e testa páginas,
// devolvendo um relatório JSON com os problemas encontrados, separados por
// gravidade (crítico vs. aviso).
//
// Como usar: abrir https://suckorsex.com/api/audit?key=SEGREDO no browser.
// (a chave evita que qualquer pessoa corra a auditoria; define AUDIT_KEY no Vercel)
//
// Próximas fases (NÃO incluídas aqui de propósito):
//   - Fase 2: enviar este relatório para o Telegram
//   - Fase 3: correção assistida (com aprovação)
//   - Fase 4: Google Analytics
// ─────────────────────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const DOMAIN = "https://suckorsex.com";

// ─── Tipos do relatório ──────────────────────────────────────────────────────
type Severity = "critico" | "aviso";

type Issue = {
  severity: Severity;
  category: string;       // ex: "signed_url", "sem_thumbnail"
  message: string;        // descrição legível
  count: number;          // quantos registos afetados
  examples: string[];     // até 5 exemplos (ids ou slugs)
};

type HealthCheck = {
  url: string;
  status: number | null;
  ok: boolean;
};

// ─── Utilitário: testar se uma página responde (teste de "vida") ─────────────
async function ping(url: string): Promise<HealthCheck> {
  try {
    const r = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SuckOrSex-Audit/1.0" },
    });
    return { url, status: r.status, ok: r.status >= 200 && r.status < 400 };
  } catch {
    return { url, status: null, ok: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ─── Proteção por chave ────────────────────────────────────────────────────
  const auditKey = process.env.AUDIT_KEY;
  const provided = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
  if (!auditKey || provided !== auditKey) {
    return res.status(401).json({ error: "Não autorizado. Falta ?key= correta." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Variáveis de ambiente Supabase em falta." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const issues: Issue[] = [];
  const startTime = Date.now();

  try {
    // ── Buscar todos os vídeos públicos (só as colunas necessárias) ──────────
    // Paginação simples: até 5000 para não rebentar memória.
    const { data: videos, error: vErr } = await supabase
      .from("videos")
      .select("id, slug, title, description, video_url, public_url, thumbnail_url, created_at, status, visibility, is_short")
      .limit(5000);

    if (vErr) throw new Error(`Erro a ler videos: ${vErr.message}`);

    const vids = videos ?? [];

    // ── VERIFICAÇÃO 1: signed URLs que expiram (CRÍTICO) ─────────────────────
    const signed = vids.filter(
      (v) => v.video_url && (v.video_url.includes("?token=") || v.video_url.includes("/sign/")),
    );
    if (signed.length > 0) {
      // Quantos destes têm um public_url alternativo disponível?
      const comAlternativa = signed.filter((v) => v.public_url && v.public_url.startsWith("https://") && !v.public_url.includes("?token="));
      issues.push({
        severity: "critico",
        category: "signed_url",
        message: `Vídeos com URL assinado (expira) em vez de público. ${comAlternativa.length} têm public_url alternativo disponível.`,
        count: signed.length,
        examples: signed.slice(0, 5).map((v) => v.slug || v.id),
      });
    }

    // ── VERIFICAÇÃO 2: vídeos publicados sem thumbnail (AVISO) ───────────────
    const semThumb = vids.filter(
      (v) => v.status === "published" && v.visibility === "public" && (!v.thumbnail_url || v.thumbnail_url.trim() === ""),
    );
    if (semThumb.length > 0) {
      issues.push({
        severity: "aviso",
        category: "sem_thumbnail",
        message: "Vídeos publicados sem thumbnail (prejudica apresentação e SEO).",
        count: semThumb.length,
        examples: semThumb.slice(0, 5).map((v) => v.slug || v.id),
      });
    }

    // ── VERIFICAÇÃO 3: vídeos publicados sem descrição (AVISO) ───────────────
    const semDesc = vids.filter(
      (v) => v.status === "published" && v.visibility === "public" && (!v.description || v.description.trim() === ""),
    );
    if (semDesc.length > 0) {
      issues.push({
        severity: "aviso",
        category: "sem_descricao",
        message: "Vídeos publicados sem descrição (pior para SEO).",
        count: semDesc.length,
        examples: semDesc.slice(0, 5).map((v) => v.slug || v.id),
      });
    }

    // ── VERIFICAÇÃO 4: vídeos sem slug (CRÍTICO — não têm página própria) ────
    const semSlug = vids.filter(
      (v) => v.status === "published" && v.visibility === "public" && (!v.slug || v.slug.trim() === ""),
    );
    if (semSlug.length > 0) {
      issues.push({
        severity: "critico",
        category: "sem_slug",
        message: "Vídeos publicados sem slug (não têm URL própria, não indexáveis).",
        count: semSlug.length,
        examples: semSlug.slice(0, 5).map((v) => v.id),
      });
    }

    // ── VERIFICAÇÃO 5: slugs duplicados (CRÍTICO — conflito de URLs) ──────────
    const slugMap = new Map<string, number>();
    for (const v of vids) {
      if (v.slug) slugMap.set(v.slug, (slugMap.get(v.slug) ?? 0) + 1);
    }
    const duplicados = [...slugMap.entries()].filter(([, n]) => n > 1);
    if (duplicados.length > 0) {
      issues.push({
        severity: "critico",
        category: "slug_duplicado",
        message: "Slugs repetidos em mais de um vídeo (conflito de URL).",
        count: duplicados.length,
        examples: duplicados.slice(0, 5).map(([slug, n]) => `${slug} (${n}x)`),
      });
    }

    // ── VERIFICAÇÃO 6: perfis sem full_name ou avatar (AVISO) ────────────────
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .limit(5000);

    if (!pErr && profiles) {
      const semNome = profiles.filter((p) => !p.full_name || p.full_name.trim() === "");
      if (semNome.length > 0) {
        issues.push({
          severity: "aviso",
          category: "perfil_sem_nome",
          message: "Perfis sem full_name (Google mostra o username em vez do nome).",
          count: semNome.length,
          examples: semNome.slice(0, 5).map((p) => p.username || p.id),
        });
      }
      const semAvatar = profiles.filter((p) => !p.avatar_url || p.avatar_url.trim() === "");
      if (semAvatar.length > 0) {
        issues.push({
          severity: "aviso",
          category: "perfil_sem_avatar",
          message: "Perfis sem foto de perfil.",
          count: semAvatar.length,
          examples: semAvatar.slice(0, 5).map((p) => p.username || p.id),
        });
      }
    }

    // ── TESTE DE VIDA: páginas-chave respondem? ──────────────────────────────
    // Usa um vídeo e um perfil reais para testar as rotas SEO.
    const amostraVideo = vids.find((v) => v.slug && v.status === "published" && v.visibility === "public" && !v.is_short);
    const amostraShort = vids.find((v) => v.slug && v.status === "published" && v.visibility === "public" && v.is_short);
    const amostraModelo = (profiles ?? []).find((p) => p.username);

    const checks: HealthCheck[] = [];
    checks.push(await ping(`${DOMAIN}/`));
    if (amostraVideo) checks.push(await ping(`${DOMAIN}/video/${amostraVideo.slug}`));
    if (amostraShort) checks.push(await ping(`${DOMAIN}/short/${amostraShort.slug}`));
    if (amostraModelo) checks.push(await ping(`${DOMAIN}/modelo/${amostraModelo.username}`));

    const siteFunctional = checks.every((c) => c.ok);

    // ── Resumo ───────────────────────────────────────────────────────────────
    const criticos = issues.filter((i) => i.severity === "critico");
    const avisos = issues.filter((i) => i.severity === "aviso");

    return res.status(200).json({
      gerado_em: new Date().toISOString(),
      duracao_ms: Date.now() - startTime,
      site_funcional: siteFunctional,
      resumo: {
        total_videos_analisados: vids.length,
        total_perfis_analisados: (profiles ?? []).length,
        problemas_criticos: criticos.length,
        avisos: avisos.length,
      },
      saude_paginas: checks,
      problemas_criticos: criticos,
      avisos: avisos,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Auditoria falhou",
      detalhe: err instanceof Error ? err.message : String(err),
      nota: "A função é só-leitura; este erro não afeta o site nem os dados.",
    });
  }
}
