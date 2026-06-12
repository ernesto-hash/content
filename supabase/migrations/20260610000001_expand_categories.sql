-- Campo is_short na tabela videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
UPDATE videos SET is_short = true WHERE duration <= 60 AND duration IS NOT NULL;

-- Tabela de países
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  flag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Relação videos <-> países
CREATE TABLE IF NOT EXISTS video_countries (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, country_id)
);

-- Relação videos <-> categorias
CREATE TABLE IF NOT EXISTS video_categories (
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, category_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_video_countries_video_id ON video_countries(video_id);
CREATE INDEX IF NOT EXISTS idx_video_countries_country_id ON video_countries(country_id);
CREATE INDEX IF NOT EXISTS idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON videos(is_short);

-- Seed países
INSERT INTO countries (slug, name, flag) VALUES
  ('portugal','Portugal','PT'),
  ('brasil','Brasil','BR'),
  ('angola','Angola','AO'),
  ('mocambique','Moçambique','MZ'),
  ('cabo-verde','Cabo Verde','CV'),
  ('estados-unidos','Estados Unidos','US'),
  ('espanha','Espanha','ES'),
  ('franca','França','FR'),
  ('alemanha','Alemanha','DE'),
  ('italia','Itália','IT'),
  ('reino-unido','Reino Unido','GB'),
  ('russia','Rússia','RU'),
  ('japao','Japão','JP'),
  ('coreia-sul','Coreia do Sul','KR'),
  ('china','China','CN'),
  ('india','Índia','IN'),
  ('tailandia','Tailândia','TH'),
  ('colombia','Colômbia','CO'),
  ('argentina','Argentina','AR'),
  ('mexico','México','MX'),
  ('venezuela','Venezuela','VE'),
  ('nigeria','Nigéria','NG'),
  ('africa-do-sul','África do Sul','ZA'),
  ('marrocos','Marrocos','MA'),
  ('australia','Austrália','AU'),
  ('canada','Canadá','CA'),
  ('turquia','Turquia','TR')
ON CONFLICT (slug) DO NOTHING;

-- Seed categorias
INSERT INTO categories (slug, name, type) VALUES
  ('amador','Amador','content'),
  ('profissional','Profissional','content'),
  ('casal','Casal','content'),
  ('solo','Solo','content'),
  ('grupo','Grupo','content'),
  ('lesbico','Lésbico','content'),
  ('gay','Gay','content'),
  ('trans','Trans','content'),
  ('hentai','Hentai','content'),
  ('anime','Anime','content'),
  ('cosplay','Cosplay','content'),
  ('asmr','ASMR','content'),
  ('latina','Latina','ethnicity'),
  ('ebony','Ebony','ethnicity'),
  ('asiatica','Asiática','ethnicity'),
  ('europeia','Europeia','ethnicity'),
  ('arabe','Árabe','ethnicity'),
  ('milf','MILF','ethnicity'),
  ('teen','Teen','ethnicity'),
  ('madura','Madura','ethnicity'),
  ('shorts','Shorts','format'),
  ('full-hd','Full HD','format'),
  ('4k','4K Ultra HD','format'),
  ('realidade-virtual','Realidade Virtual','format'),
  ('ao-vivo','Ao Vivo','format')
ON CONFLICT (slug) DO NOTHING;