import { useMemo } from "react";
import { Image as ImageIcon, Tag, Eye, Lock, Globe, Save, Send } from "lucide-react";

export type VideoVisibility = "public" | "unlisted" | "private";
export type VideoStatus = "draft" | "processing" | "published" | "private" | "unlisted" | "review";

export type VideoFormState = {
  title: string;
  description: string;
  category: string;
  tags: string;
  visibility: VideoVisibility;
  thumbnailFile: File | null;
};

type Props = {
  value: VideoFormState;
  onChange: (next: VideoFormState) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  disabled?: boolean;
  canPublish?: boolean;
};

const categories = [
  "Tecnologia",
  "Educação",
  "Entretenimento",
  "Música",
  "Games",
  "Esportes",
  "Lifestyle",
  "Notícias",
  "Outros",
];

export default function VideoForm({
  value,
  onChange,
  onSaveDraft,
  onPublish,
  disabled,
  canPublish,
}: Props) {
  const visibilityOptions = useMemo(
    () => [
      { id: "public" as const, label: "Público", icon: <Globe size={16} /> },
      { id: "unlisted" as const, label: "Não listado", icon: <Eye size={16} /> },
      { id: "private" as const, label: "Privado", icon: <Lock size={16} /> },
    ],
    []
  );

  const set = (patch: Partial<VideoFormState>) => onChange({ ...value, ...patch });

  return (
    <div className="glass border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Detalhes do vídeo</h2>
          <p className="text-xs text-foreground/50 mt-1">Preencha os dados antes de publicar.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSaveDraft}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} /> Salvar rascunho
          </button>

          <button
            onClick={onPublish}
            disabled={disabled || !canPublish}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} /> Publicar
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-foreground/60">Título *</label>
            <input
              value={value.title}
              onChange={(e) => set({ title: e.target.value })}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
              placeholder="Ex: Como editar vídeos no celular (guia completo)"
              disabled={disabled}
            />
            <div className="mt-1 text-[11px] text-foreground/40">
              Recomendado: 40–70 caracteres, objetivo e claro.
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/60">Descrição</label>
            <textarea
              value={value.description}
              onChange={(e) => set({ description: e.target.value })}
              className="mt-1 w-full min-h-[130px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
              placeholder="Contexto, links, capítulos, chamadas para ação..."
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-foreground/60">Categoria</label>
              <select
                value={value.category}
                onChange={(e) => set({ category: e.target.value })}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-neon-purple/50 focus:bg-white/10 transition-all"
                disabled={disabled}
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-foreground/60">Tags</label>
              <div className="mt-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Tag size={16} className="text-foreground/40" />
                <input
                  value={value.tags}
                  onChange={(e) => set({ tags: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
                  placeholder="Ex: edição, tutorial, mobile"
                  disabled={disabled}
                />
              </div>
              <div className="mt-1 text-[11px] text-foreground/40">Separe por vírgulas.</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-foreground/60">Visibilidade</label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {visibilityOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set({ visibility: opt.id })}
                  disabled={disabled}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    value.visibility === opt.id
                      ? "bg-gradient-to-r from-neon-pink/15 to-neon-purple/15 border-neon-pink/30 text-foreground"
                      : "bg-white/5 border-white/10 text-foreground/70 hover:text-neon-pink hover:bg-white/10"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className={`${value.visibility === opt.id ? "text-neon-pink" : "text-foreground/40"}`}>
                    {opt.icon}
                  </span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-dark border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ImageIcon size={18} className="text-neon-pink" /> Thumbnail
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              Uma boa thumbnail aumenta muito a taxa de clique.
            </p>

            <label className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-all cursor-pointer">
              Selecionar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => set({ thumbnailFile: e.target.files?.[0] || null })}
                disabled={disabled}
              />
            </label>

            {value.thumbnailFile && (
              <div className="mt-3 text-xs text-foreground/70">
                Selecionado: <span className="text-foreground/90">{value.thumbnailFile.name}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-foreground/40 flex items-start gap-2">
            <Eye size={14} className="mt-0.5" />
            <span>
              Dica: publique como “Não listado” primeiro, teste e depois torne público.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}