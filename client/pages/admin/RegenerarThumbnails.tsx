import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutAuthenticated from "@/components/LayoutAuthenticated";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Shield, ImageIcon, CheckCircle2, XCircle, RefreshCw, ChevronLeft } from "lucide-react";

type VideoRow = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
};

type LogEntry = {
  id: string;
  title: string;
  status: "success" | "failed" | "processing";
  message: string;
};

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`;

export default function RegenerarThumbnails() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [currentTitle, setCurrentTitle] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { setIsAdmin(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", uid).single();
      setIsAdmin(profile?.role === "admin");
    });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("videos")
      .select("id, title, video_url, thumbnail_url")
      .ilike("thumbnail_url", "%/avatars/%")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setVideos(data ?? []);
        setLoading(false);
      });
  }, [isAdmin]);

  function appendLog(entry: LogEntry) {
    setLog(prev => {
      const idx = prev.findIndex(e => e.id === entry.id);
      if (idx === -1) return [...prev, entry];
      const next = [...prev];
      next[idx] = entry;
      return next;
    });
  }

  async function processVideos(list: VideoRow[]) {
    setProcessing(true);
    setDone(false);
    setLog([]);
    setProgress({ current: 0, total: list.length, success: 0, failed: 0 });

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? "";

    let success = 0;
    let failed = 0;

    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      setCurrentTitle(v.title);
      setProgress(p => ({ ...p, current: i + 1 }));
      appendLog({ id: v.id, title: v.title, status: "processing", message: "A gerar thumbnail no servidor..." });

      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ videoId: v.id }),
        });

        const result = await response.json();

        if (result.success) {
          success++;
          setProgress(p => ({ ...p, success }));
          appendLog({ id: v.id, title: v.title, status: "success", message: result.thumbnail_url });
        } else {
          failed++;
          setProgress(p => ({ ...p, failed }));
          appendLog({ id: v.id, title: v.title, status: "failed", message: result.error ?? "Erro desconhecido" });
        }
      } catch (err) {
        failed++;
        setProgress(p => ({ ...p, failed }));
        appendLog({ id: v.id, title: v.title, status: "failed", message: String(err) });
      }
    }

    setProcessing(false);
    setDone(true);
    setCurrentTitle("");
  }

  async function retryFailed() {
    const failedIds = log.filter(e => e.status === "failed").map(e => e.id);
    const failedVideos = videos.filter(v => failedIds.includes(v.id));
    await processVideos(failedVideos);
  }

  // ── Access denied ─────────────────────────────────────────────────────────────
  if (isAdmin === false) {
    return (
      <LayoutAuthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Shield size={28} style={{ color: "#f87171" }} />
          </div>
          <p className="text-white/50 text-sm">Acesso restrito a administradores.</p>
          <Link to="/dashboard" className="text-xs" style={{ color: "#ec4899" }}>← Voltar ao Dashboard</Link>
        </div>
      </LayoutAuthenticated>
    );
  }

  // ── Loading auth ───────────────────────────────────────────────────────────────
  if (isAdmin === null) {
    return (
      <LayoutAuthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin" style={{ color: "#ec4899" }} />
        </div>
      </LayoutAuthenticated>
    );
  }

  const failedCount = log.filter(e => e.status === "failed").length;

  return (
    <LayoutAuthenticated>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/galeria"
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-75"
            style={{ color: "rgba(255,255,255,0.35)" }}>
            <ChevronLeft size={14} /> Galeria Admin
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={18} style={{ color: "#ec4899" }} />
            <h1 className="text-xl font-black text-white">Regenerar Thumbnails</h1>
          </div>
          {loading ? (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>A carregar vídeos...</p>
          ) : (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              {videos.length} vídeo{videos.length !== 1 ? "s" : ""} encontrado{videos.length !== 1 ? "s" : ""} com thumbnail de avatar
            </p>
          )}
        </div>

        {/* Estado inicial — antes de começar */}
        {!processing && !done && !loading && (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.2)" }}>
              <ImageIcon size={28} style={{ color: "#ec4899" }} />
            </div>
            <div>
              <p className="text-white font-bold mb-1">
                {videos.length === 0
                  ? "Sem vídeos para regenerar"
                  : `${videos.length} thumbnail${videos.length !== 1 ? "s" : ""} para regenerar`}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Cada vídeo será processado individualmente via Edge Function no servidor.
              </p>
            </div>
            {videos.length > 0 && (
              <>
                <button
                  onClick={() => processVideos(videos)}
                  className="px-6 py-3 rounded-xl text-white text-sm font-black transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(90deg,#ec4899,#9333ea)" }}>
                  Iniciar regeneração automática
                </button>
                <p className="text-xs" style={{ color: "rgba(239,68,68,0.7)" }}>
                  ⚠ Mantém esta página aberta durante o processo
                </p>
              </>
            )}
          </div>
        )}

        {/* Estado: a processar */}
        {(processing || done) && (
          <div className="space-y-5">

            {/* Barra de progresso */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">
                  {done ? "Concluído" : `A processar: ${currentTitle}`}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%",
                    background: "linear-gradient(90deg,#ec4899,#9333ea)",
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span style={{ color: "#4ade80" }}>✅ {progress.success} sucesso</span>
                <span style={{ color: "#f87171" }}>❌ {progress.failed} falhados</span>
              </div>
              {processing && (
                <p className="text-xs text-center" style={{ color: "rgba(239,68,68,0.7)" }}>
                  A processar... não feches esta página
                </p>
              )}
            </div>

            {/* Sumário pós-conclusão */}
            {done && (
              <div className="rounded-2xl p-5 text-center space-y-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-white font-bold">
                  {progress.success} thumbnail{progress.success !== 1 ? "s" : ""} regenerada{progress.success !== 1 ? "s" : ""} com sucesso.
                  {progress.failed > 0 && ` ${progress.failed} falharam.`}
                </p>
                {failedCount > 0 && (
                  <button
                    onClick={retryFailed}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <RefreshCw size={13} /> Tentar falhados novamente ({failedCount})
                  </button>
                )}
              </div>
            )}

            {/* Log */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Log</p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {log.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {entry.status === "success"    && <CheckCircle2 size={14} style={{ color: "#4ade80" }} />}
                      {entry.status === "failed"     && <XCircle      size={14} style={{ color: "#f87171" }} />}
                      {entry.status === "processing" && <Loader2      size={14} className="animate-spin" style={{ color: "#facc15" }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/80 font-medium truncate">{entry.title}</p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {entry.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </LayoutAuthenticated>
  );
}
