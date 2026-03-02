import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard"; // ← Import adicionado
import Categorias from "./pages/Categorias";
import Modelos from "./pages/Modelos";
import Canais from "./pages/Canais";
import NotFound from "./pages/NotFound";
import Video from "./pages/Video";
import Videos from "./pages/Videos";
import FotosGifs from "./pages/Fotos-gifs";
import Populares from "./pages/Populares";
import Recomendados from "./pages/Recomendados";
import ProtectedRoute from "./components/ProtectedRoute"; // ← Import adicionado

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Rotas Públicas de Conteúdo */}
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/modelos" element={<Modelos />} />
          <Route path="/canais" element={<Canais />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/video/:id" element={<Video />} />
          <Route path="/fotos-gifs" element={<FotosGifs />} />
          <Route path="/populares" element={<Populares />} />
          <Route path="/recomendados" element={<Recomendados />} />
          
          {/* Rotas Protegidas (requerem login) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Rota para perfil/canal do usuário (pública para visualização) */}
          <Route path="/perfil/:username" element={<Canais />} />
          
          {/* Rota 404 - Mantida no final */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);