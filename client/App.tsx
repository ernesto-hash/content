import "./global.css";
import "./i18n";

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// ── Lazy page imports ──────────────────────────────────────────────────────────
const Login          = lazy(() => import("./pages/Login"));
const Signup         = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Categorias     = lazy(() => import("./pages/Categorias"));
const Modelos        = lazy(() => import("./pages/Modelos"));
const ModelosPage    = lazy(() => import("./pages/Modelos").then(m => ({ default: m.ModelosPage })));
const Canais         = lazy(() => import("./pages/Canais"));
const NotFound       = lazy(() => import("./pages/NotFound"));
const Video          = lazy(() => import("./pages/Video"));
const Videos         = lazy(() => import("./pages/Videos"));
const FotosGifs      = lazy(() => import("./pages/Fotos-gifs"));
const Populares      = lazy(() => import("./pages/Populares"));
const PopularesPage  = Populares;
const Recomendados   = lazy(() => import("./pages/Recomendados"));

const VideoAuthenticated        = lazy(() => import("./pages/VideoAuthenticated"));
const CategoriasAuthenticated   = lazy(() => import("./pages/CategoriasAuthenticated"));
const PopularesAuthenticated    = lazy(() => import("./pages/PopularesAuthenticated"));
const RecomendadosAuthenticated = lazy(() => import("./pages/RecomendadosAuthenticated"));
const FotosGifAuthenticated     = lazy(() => import("./pages/FotosGifAuthenticated"));
const ModelosAuthenticated      = lazy(() => import("./pages/ModelosAuthenticated"));

const Profile         = lazy(() => import("./pages/Profile"));
const EscolherConta   = lazy(() => import("./pages/EscolherConta"));
const StudioDashboard = lazy(() => import("./pages/studio/StudioDashboard"));
const StudioUpload    = lazy(() => import("./pages/studio/StudioUpload"));
const StudioVideos    = lazy(() => import("./pages/studio/StudioVideos"));
const StudioAnalytics = lazy(() => import("./pages/studio/StudioAnalytics"));
const StudioComments  = lazy(() => import("./pages/studio/StudioComments"));
const StudioSettings  = lazy(() => import("./pages/studio/StudioSettings"));

const RecentesPage          = lazy(() => import("./pages/categoria/Recentes"));
const TendenciasPage        = lazy(() => import("./pages/categoria/Tendencias"));
const MelhoresAvaliadosPage = lazy(() => import("./pages/categoria/Melhoresavaliados"));
const MaisVistosPage        = lazy(() => import("./pages/categoria/Maisvistos"));
const RecomendadosPage      = lazy(() => import("./pages/categoria/Recomendados"));
const CasalPage             = lazy(() => import("./pages/categoria/Casal"));
const CasalAuthenticatedPage = lazy(() => import("./pages/categoria/CasalAuthenticated"));

// Tipo de Conteúdo — Público
const AmadorPage       = lazy(() => import("@/pages/categoria/Amador"));
const ProfissionalPage = lazy(() => import("@/pages/categoria/Profissional"));
const SoloPage         = lazy(() => import("@/pages/categoria/Solo"));
const GrupoPage        = lazy(() => import("@/pages/categoria/Grupo"));
const TransPage        = lazy(() => import("@/pages/categoria/Trans"));
const GayPage          = lazy(() => import("@/pages/categoria/Gay"));
const LesbicaPage      = lazy(() => import("@/pages/categoria/Lesbica"));
const FetichePage      = lazy(() => import("@/pages/categoria/Fetiche"));
const BDSMPage         = lazy(() => import("@/pages/categoria/BDSM"));
const VintagePage      = lazy(() => import("@/pages/categoria/Vintage"));
const AnimacaoPage     = lazy(() => import("@/pages/categoria/Animacao"));

// Tipo de Conteúdo — Authenticated
const AmadorAuthenticatedPage       = lazy(() => import("@/pages/categoria/AmadorAuthenticated"));
const ProfissionalAuthenticatedPage = lazy(() => import("@/pages/categoria/ProfissionalAuthenticated"));
const SoloAuthenticatedPage         = lazy(() => import("@/pages/categoria/SoloAuthenticated"));
const GrupoAuthenticatedPage        = lazy(() => import("@/pages/categoria/GrupoAuthenticated"));
const TransAuthenticatedPage        = lazy(() => import("@/pages/categoria/TransAuthenticated"));
const GayAuthenticatedPage          = lazy(() => import("@/pages/categoria/GayAuthenticated"));
const LesbicaAuthenticatedPage      = lazy(() => import("@/pages/categoria/LesbicaAuthenticated"));
const FeticheAuthenticatedPage      = lazy(() => import("@/pages/categoria/FeticheAuthenticated"));
const BDSMAuthenticatedPage         = lazy(() => import("@/pages/categoria/BDSMAuthenticated"));
const VintageAuthenticatedPage      = lazy(() => import("@/pages/categoria/VintageAuthenticated"));
const AnimacaoAuthenticatedPage     = lazy(() => import("@/pages/categoria/AnimacaoAuthenticated"));

// Formato — Público
const CurtoPage      = lazy(() => import("@/pages/categoria/Curto"));
const MedioPage      = lazy(() => import("@/pages/categoria/Medio"));
const LongoPage      = lazy(() => import("@/pages/categoria/Longo"));
const CompilacaoPage = lazy(() => import("@/pages/categoria/Compilacao"));
const POVPage        = lazy(() => import("@/pages/categoria/POV"));
const InterativoPage = lazy(() => import("@/pages/categoria/Interativo"));

// Formato — Authenticated
const CurtoAuthenticatedPage      = lazy(() => import("@/pages/categoria/CurtoAuthenticated"));
const MedioAuthenticatedPage      = lazy(() => import("@/pages/categoria/MedioAuthenticated"));
const LongoAuthenticatedPage      = lazy(() => import("@/pages/categoria/LongoAuthenticated"));
const CompilacaoAuthenticatedPage = lazy(() => import("@/pages/categoria/CompilacaoAuthenticated"));
const POVAuthenticatedPage        = lazy(() => import("@/pages/categoria/POVAuthenticated"));
const InterativoAuthenticatedPage = lazy(() => import("@/pages/categoria/InterativoAuthenticated"));

// País — Público
const PortugalPage = lazy(() => import("@/pages/categoria/Portugal"));
const BrasilPage   = lazy(() => import("@/pages/categoria/Brasil"));
const EUAPage      = lazy(() => import("@/pages/categoria/EUA"));
const EspanhaPage  = lazy(() => import("@/pages/categoria/Espanha"));
const FrancaPage   = lazy(() => import("@/pages/categoria/Franca"));
const ItaliaPage   = lazy(() => import("@/pages/categoria/Italia"));
const AlemanhaPage = lazy(() => import("@/pages/categoria/Alemanha"));
const JapaoPage    = lazy(() => import("@/pages/categoria/Japao"));

// País — Authenticated
const PortugalAuthenticatedPage = lazy(() => import("@/pages/categoria/PortugalAuthenticated"));
const BrasilAuthenticatedPage   = lazy(() => import("@/pages/categoria/BrasilAuthenticated"));
const EUAAuthenticatedPage      = lazy(() => import("@/pages/categoria/EUAAuthenticated"));
const EspanhaAuthenticatedPage  = lazy(() => import("@/pages/categoria/EspanhaAuthenticated"));
const FrancaAuthenticatedPage   = lazy(() => import("@/pages/categoria/FrancaAuthenticated"));
const ItaliaAuthenticatedPage   = lazy(() => import("@/pages/categoria/ItaliaAuthenticated"));
const AlemanhaAuthenticatedPage = lazy(() => import("@/pages/categoria/AlemanhaAuthenticated"));
const JapaoAuthenticatedPage    = lazy(() => import("@/pages/categoria/JapaoAuthenticated"));

const CanalPage               = lazy(() => import("./pages/modelos/CanalPage"));
const ModeloAuthenticated     = lazy(() => import("./pages/modelos/ModeloAuthenticated"));
const VideosAuthenticated     = lazy(() => import("./pages/VideosAuthenticated"));
const CanaisAuthenticated     = lazy(() => import("./pages/CanaisAuthenticated"));
const GaleriaAuthenticated    = lazy(() => import("./pages/GaleriaAuthenticated"));
const GaleriaPackAuthenticated = lazy(() => import("./pages/GaleriapackAuthenticated"));
const GaleriaNormal    = lazy(() => import("./pages/GaleriaNormal"));
const GaleriaExclusivo = lazy(() => import("./pages/GaleriaExclusivo"));
const GaleriaRaro      = lazy(() => import("./pages/GaleriaRaro"));
const Galeria          = lazy(() => import("./pages/Galeria"));
const Checkout         = lazy(() => import("./pages/Checkout"));
const CheckoutSucesso  = lazy(() => import("./pages/CheckoutSucesso"));
const CheckoutPagamento = lazy(() => import("./pages/CheckoutPagamento"));
const Terms          = lazy(() => import("./pages/Terms"));
const PrivacyCookies = lazy(() => import("./pages/PrivacyCookies"));
const Termos         = lazy(() => import("./pages/Termos"));
const Privacidade    = lazy(() => import("./pages/Privacidade"));
const RtaLabel       = lazy(() => import("./pages/RtaLabel"));
const Anunciar          = lazy(() => import("./pages/Anunciar"));
const AnunciarPagamento = lazy(() => import("./pages/AnunciarPagamento"));
const AnunciarSucesso   = lazy(() => import("./pages/AnunciarSucesso"));
const TagPage               = lazy(() => import("./pages/TagPage"));
const GaleriaAdmin          = lazy(() => import("./pages/admin/GaleriaAdmin"));
const RegenerarThumbnails   = lazy(() => import("./pages/admin/RegenerarThumbnails"));
const UploadModelVideos     = lazy(() => import("./pages/admin/UploadModelVideos"));

// ── Query client ───────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

/** Rota autenticada — qualquer utilizador com sessão válida */
function Auth({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/** Rota de creator — requer role "creator" ou "admin" */
function CreatorRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute minRole="creator" roleRedirect="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

/** Rota de admin — requer role "admin" */
function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtectedRoute minRole="admin" roleRedirect="/dashboard">
      {children}
    </RoleProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div />}>
          <Routes>
            {/* ── Rotas Públicas ──────────────────────────────────────────────── */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/escolher-conta" element={<EscolherConta />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacycookies" element={<PrivacyCookies />} />
            <Route path="/termos"         element={<Termos />} />
            <Route path="/privacidade"    element={<Privacidade />} />
            <Route path="/rta"            element={<RtaLabel />} />

            {/* ── Conteúdo Público ────────────────────────────────────────────── */}
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/modelos" element={<Modelos />} />
            <Route path="/canais" element={<Canais />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/video/:slug" element={<Video />} />
            <Route path="/fotos-gifs" element={<FotosGifs />} />
            <Route path="/populares" element={<Populares />} />
            <Route path="/recomendados" element={<Recomendados />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/anunciar"          element={<Anunciar />} />
            <Route path="/anunciar/pagamento" element={<AnunciarPagamento />} />
            <Route path="/anunciar/sucesso"   element={<AnunciarSucesso />} />
            <Route path="/tag/:tag" element={<TagPage />} />
            <Route path="/perfil/:username" element={<Canais />} />
            <Route path="/modelo/:slug" element={<CanalPage />} />
            <Route path="/modelos/modelospage" element={<ModelosPage />} />

            {/* ── Categorias Públicas ─────────────────────────────────────────── */}
            <Route path="/categoria/populares"        element={<PopularesPage />} />
            <Route path="/categoria/recentes"         element={<RecentesPage />} />
            <Route path="/categoria/tendencias"       element={<TendenciasPage />} />
            <Route path="/categoria/melhoresavaliados" element={<MelhoresAvaliadosPage />} />
            <Route path="/categoria/mais-vistos"      element={<MaisVistosPage />} />
            <Route path="/categoria/recomendados"     element={<RecomendadosPage />} />
            <Route path="/categoria/casal"            element={<CasalPage />} />
            <Route path="/categoria/amador"           element={<AmadorPage />} />
            <Route path="/categoria/profissional"     element={<ProfissionalPage />} />
            <Route path="/categoria/solo"             element={<SoloPage />} />
            <Route path="/categoria/grupo"            element={<GrupoPage />} />
            <Route path="/categoria/trans"            element={<TransPage />} />
            <Route path="/categoria/gay"              element={<GayPage />} />
            <Route path="/categoria/lesbica"          element={<LesbicaPage />} />
            <Route path="/categoria/fetiche"          element={<FetichePage />} />
            <Route path="/categoria/bdsm"             element={<BDSMPage />} />
            <Route path="/categoria/vintage"          element={<VintagePage />} />
            <Route path="/categoria/animacao"         element={<AnimacaoPage />} />
            <Route path="/categoria/curto"            element={<CurtoPage />} />
            <Route path="/categoria/medio"            element={<MedioPage />} />
            <Route path="/categoria/longo"            element={<LongoPage />} />
            <Route path="/categoria/compilacao"       element={<CompilacaoPage />} />
            <Route path="/categoria/pov"              element={<POVPage />} />
            <Route path="/categoria/interativo"       element={<InterativoPage />} />
            <Route path="/categoria/portugal"         element={<PortugalPage />} />
            <Route path="/categoria/brasil"           element={<BrasilPage />} />
            <Route path="/categoria/eua"              element={<EUAPage />} />
            <Route path="/categoria/espanha"          element={<EspanhaPage />} />
            <Route path="/categoria/franca"           element={<FrancaPage />} />
            <Route path="/categoria/italia"           element={<ItaliaPage />} />
            <Route path="/categoria/alemanha"         element={<AlemanhaPage />} />
            <Route path="/categoria/japao"            element={<JapaoPage />} />

            {/* ── ROTAS AUTENTICADAS — todas protegidas por ProtectedRoute ────── */}

            {/* Perfil do utilizador autenticado */}
            <Route path="/profile" element={<Auth><Profile /></Auth>} />

            {/* Dashboard */}
            <Route path="/dashboard"   element={<Auth><Dashboard /></Auth>} />
            <Route path="/dashboard/*" element={<Auth><Dashboard /></Auth>} />

            {/* Versões autenticadas de páginas de conteúdo */}
            <Route path="/canaisauthenticated"      element={<Auth><CanaisAuthenticated /></Auth>} />
            <Route path="/videosauthenticated"      element={<Auth><VideosAuthenticated /></Auth>} />
            <Route path="/videoauthenticated"       element={<Auth><VideoAuthenticated /></Auth>} />
            <Route path="/categoriasauthenticated"  element={<Auth><CategoriasAuthenticated /></Auth>} />
            <Route path="/fotosgifauthenticated"    element={<Auth><FotosGifAuthenticated /></Auth>} />
            <Route path="/popularesauthenticated"   element={<Auth><PopularesAuthenticated /></Auth>} />
            <Route path="/recomendadosauthenticated" element={<Auth><RecomendadosAuthenticated /></Auth>} />
            <Route path="/modelosauthenticated"     element={<Auth><ModelosAuthenticated /></Auth>} />

            {/* Studio — requer role "creator" ou "admin" */}
            <Route path="/studio"            element={<CreatorRoute><StudioDashboard /></CreatorRoute>} />
            <Route path="/studio/upload"     element={<CreatorRoute><StudioUpload /></CreatorRoute>} />
            <Route path="/studio/videos"     element={<CreatorRoute><StudioVideos /></CreatorRoute>} />
            <Route path="/studio/analytics"  element={<CreatorRoute><StudioAnalytics /></CreatorRoute>} />
            <Route path="/studio/comments"   element={<CreatorRoute><StudioComments /></CreatorRoute>} />
            <Route path="/studio/settings"   element={<CreatorRoute><StudioSettings /></CreatorRoute>} />

            {/* Modelo autenticado */}
            <Route path="/modelos/modeloauthenticated" element={<Auth><ModeloAuthenticated /></Auth>} />

            {/* /app/* — todas protegidas */}
            <Route path="/app/checkout/sucesso"   element={<Auth><CheckoutSucesso /></Auth>} />
            <Route path="/app/checkout/pagamento" element={<Auth><CheckoutPagamento /></Auth>} />
            <Route path="/app/checkout"           element={<Auth><Checkout /></Auth>} />
            <Route path="/app/galeria/normal"     element={<Auth><GaleriaNormal /></Auth>} />
            <Route path="/app/galeria/exclusivo"  element={<Auth><GaleriaExclusivo /></Auth>} />
            <Route path="/app/galeria/raro"       element={<Auth><GaleriaRaro /></Auth>} />
            <Route path="/app/galeria"            element={<Auth><GaleriaAuthenticated /></Auth>} />
            <Route path="/app/galeria/:id"        element={<Auth><GaleriaPackAuthenticated /></Auth>} />

            {/* Rotas dinâmicas autenticadas */}
            <Route path="/app/video/:slug"  element={<Auth><VideoAuthenticated /></Auth>} />
            <Route path="/app/modelo/:slug" element={<Auth><CanalPage authenticated /></Auth>} />
            <Route path="/app/modelos"    element={<Auth><ModeloAuthenticated /></Auth>} />

            {/* /app/categoria/* — autenticadas */}
            <Route path="/app/categoria/casal"        element={<Auth><CasalAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/amador"       element={<Auth><AmadorAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/profissional" element={<Auth><ProfissionalAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/solo"         element={<Auth><SoloAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/grupo"        element={<Auth><GrupoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/trans"        element={<Auth><TransAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/gay"          element={<Auth><GayAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/lesbica"      element={<Auth><LesbicaAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/fetiche"      element={<Auth><FeticheAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/bdsm"         element={<Auth><BDSMAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/vintage"      element={<Auth><VintageAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/animacao"     element={<Auth><AnimacaoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/curto"        element={<Auth><CurtoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/medio"        element={<Auth><MedioAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/longo"        element={<Auth><LongoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/compilacao"   element={<Auth><CompilacaoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/pov"          element={<Auth><POVAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/interativo"   element={<Auth><InterativoAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/portugal"     element={<Auth><PortugalAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/brasil"       element={<Auth><BrasilAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/eua"          element={<Auth><EUAAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/espanha"      element={<Auth><EspanhaAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/franca"       element={<Auth><FrancaAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/italia"       element={<Auth><ItaliaAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/alemanha"     element={<Auth><AlemanhaAuthenticatedPage /></Auth>} />
            <Route path="/app/categoria/japao"        element={<Auth><JapaoAuthenticatedPage /></Auth>} />

            {/* /app sem subpath e rotas /app/* desconhecidas → galeria (catch-all no final para não engolir rotas específicas) */}
            <Route path="/app" element={<Navigate to="/app/galeria" replace />} />
            <Route path="/app/*" element={<Navigate to="/app/galeria" replace />} />

            {/* Admin */}
            <Route path="/admin/galeria"                element={<AdminRoute><GaleriaAdmin /></AdminRoute>} />
            <Route path="/admin/regenerar-thumbnails"   element={<AdminRoute><RegenerarThumbnails /></AdminRoute>} />
            <Route path="/admin/upload-videos"          element={<AdminRoute><UploadModelVideos /></AdminRoute>} />

            {/* 404 — sempre no final */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
