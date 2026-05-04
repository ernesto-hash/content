export type PlanoNome = "normal" | "exclusivo" | "raro";

export type Pack = {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail_url: string | null;
  fotos_count: number;
  etiqueta: string | null;
  is_premium: boolean;
  views: number;
  destaque: boolean;
  created_at: string;
};

export type GaleriaLayoutProps = {
  packs: Pack[];
  packsLoading: boolean;
  planoUser: PlanoNome | null;
  nivelUser: number;
};
