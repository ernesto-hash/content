import { useMemo, useState } from "react";
import { UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
};

export default function VideoUploader({ onFileSelected, accept = "video/*", maxSizeMB = 1024 }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const maxBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  const validateAndSet = (file: File | null) => {
    setError(null);
    if (!file) return;

    if (file.size > maxBytes) {
      setError(`Arquivo muito grande. Limite: ${maxSizeMB}MB`);
      return;
    }
    setSelectedName(file.name);
    onFileSelected(file);
  };

  return (
    <div className="glass border border-white/10 rounded-2xl p-5">
      <div
        className={`rounded-2xl border border-dashed transition-all p-6 ${
          dragOver ? "border-neon-pink/50 bg-white/5" : "border-white/15 bg-black/10"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          validateAndSet(f || null);
        }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-pink">
            <UploadCloud size={24} />
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Arraste e solte seu vídeo aqui</div>
            <div className="text-xs text-foreground/50 mt-1">
              ou selecione um arquivo (máx. {maxSizeMB}MB)
            </div>
          </div>

          <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/80 hover:text-neon-pink hover:bg-white/10 transition-all">
            Selecionar arquivo
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => validateAndSet(e.target.files?.[0] || null)}
            />
          </label>

          {selectedName && !error && (
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <CheckCircle2 size={14} className="text-neon-pink" />
              <span className="truncate max-w-[260px]">{selectedName}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-foreground/40">
        Dica: use um título claro e uma thumbnail boa — melhora muito o desempenho do vídeo.
      </div>
    </div>
  );
}