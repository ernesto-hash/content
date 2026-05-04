// src/pages/modelos/types.ts
// Tipos e helpers partilhados entre ModelosPage e CanalPage

export type Creator = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  video_count: number;
  total_views: number;
  subscriber_count: number;
  preview_thumbs: string[];
};

export type VideoItem = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  views: number;
  duration: number | null;
  created_at: string;
  likes_count: number;
  category: string | null;
};

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}
export function fmtDuration(s: number | null): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  if (m >= 60) return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
  return `${m}:${sec}`;
}
export function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return "hoje";
  if (days < 7)   return `há ${days}d`;
  if (days < 30)  return `há ${Math.floor(days / 7)}sem`;
  if (days < 365) return `há ${Math.floor(days / 30)}mes`;
  return `há ${Math.floor(days / 365)}a`;
}
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

export const GRADIENTS = [
  "from-neon-pink/20 to-neon-purple/10",
  "from-blue-500/20 to-cyan-500/10",
  "from-violet-500/20 to-fuchsia-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-emerald-500/20 to-teal-500/10",
  "from-rose-500/20 to-pink-500/10",
  "from-sky-500/20 to-indigo-500/10",
  "from-lime-500/20 to-green-500/10",
];

export const ACCENT_COLORS = [
  "text-neon-pink border-neon-pink/30 bg-neon-pink/10",
  "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "text-violet-400 border-violet-400/30 bg-violet-400/10",
  "text-amber-400 border-amber-400/30 bg-amber-400/10",
  "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  "text-rose-400 border-rose-400/30 bg-rose-400/10",
  "text-sky-400 border-sky-400/30 bg-sky-400/10",
  "text-lime-400 border-lime-400/30 bg-lime-400/10",
];