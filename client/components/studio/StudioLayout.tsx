import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Film,
  TrendingUp,
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type StudioNavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  verified: boolean;
}

interface StudioLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function StudioLayout({ children, title = "Creator Studio", subtitle }: StudioLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems: StudioNavItem[] = useMemo(
    () => [
      { label: "Dashboard", to: "/studio", icon: <LayoutDashboard size={18} /> },
      { label: "Enviar vídeo", to: "/studio/upload", icon: <Upload size={18} /> },
      { label: "Meus vídeos", to: "/studio/videos", icon: <Film size={18} /> },
      { label: "Estatísticas", to: "/studio/analytics", icon: <TrendingUp size={18} /> },
      { label: "Comentários", to: "/studio/comments", icon: <MessageCircle size={18} /> },
      { label: "Configurações", to: "/studio/settings", icon: <Settings size={18} /> },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoadingProfile(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,role")
        .eq("id", user.id)
        .single();

      if (!isMounted) return;

      if (error) {
        // Se não existir profile ainda, não quebrar o Studio.
        setProfile({
          id: user.id,
          username: user.email?.split("@")[0] || "Usuário",
          full_name: "",
          avatar_url: "",
          verified: false,
        });
      } else {
        setProfile(prof);
      }

      setLoadingProfile(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (to: string) => {
    if (to === "/studio") return location.pathname === "/studio";
    return location.pathname.startsWith(to);
  };

  const closeMobile = () => setMobileSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-container safe-area py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile menu + Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen((v) => !v)}
                className="lg:hidden w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all"
                aria-label="Abrir menu"
              >
                {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <Link to="/studio" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center text-white font-black">
                  CS
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground">{title}</div>
                  <div className="text-xs text-foreground/40">{subtitle || "Painel reservado para criação e gestão"}</div>
                </div>
              </Link>
            </div>

            {/* Center: search (opcional / futuro) */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="w-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/15 via-neon-purple/15 to-neon-blue/15 rounded-full blur-md opacity-0 md:opacity-100 pointer-events-none" />
                <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  <Search size={18} className="text-foreground/40" />
                  <input
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/30 outline-none"
                    placeholder="Buscar vídeos, comentários, tags..."
                    disabled
                  />
                  <span className="text-[10px] text-foreground/30 border border-white/10 px-2 py-1 rounded-full">
                    Em breve
                  </span>
                </div>
              </div>
            </div>

            {/* Right: actions + user */}
            <div className="flex items-center gap-2">
              <Link
                to="/studio/upload"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                <Upload size={16} />
                <span>Criar</span>
              </Link>

              <button className="relative w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-r from-neon-pink to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                    {loadingProfile ? "…" : profile?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-foreground/80 hidden sm:block">
                    {loadingProfile ? "Carregando..." : profile?.username || "Usuário"}
                  </span>
                  <ChevronDown size={14} className="text-foreground/40" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-dark border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-foreground">{profile?.username || "Usuário"}</p>
                      <p className="text-xs text-foreground/40">
                        {profile?.verified ? "Conta verificada" : "Conta padrão"}
                      </p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span className="text-sm">Voltar ao app</span>
                      </Link>

                      <div className="h-px bg-white/10 my-2" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-foreground/70 hover:text-neon-pink transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout grid */}
      <div className="max-container safe-area py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="glass border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="text-sm font-semibold text-foreground">Studio</div>
                <div className="text-xs text-foreground/40">Crie, gerencie e analise</div>
              </div>

              <nav className="p-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isActive(item.to)
                        ? "bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 text-foreground"
                        : "text-foreground/70 hover:text-neon-pink hover:bg-white/5"
                    }`}
                  >
                    <span className={`${isActive(item.to) ? "text-neon-pink" : "text-foreground/50"}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-white/10">
                <div className="text-xs text-foreground/40 leading-relaxed">
                  Dica: crie como <span className="text-foreground/70">rascunho</span>, revise e publique com confiança.
                </div>
              </div>
            </div>
          </aside>

          {/* Sidebar (mobile overlay) */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
              <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-sm glass-dark border-r border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-foreground">Creator Studio</div>
                  <button
                    onClick={closeMobile}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-foreground/60 hover:text-neon-pink hover:bg-white/10 transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive(item.to)
                          ? "bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 text-foreground"
                          : "text-foreground/70 hover:text-neon-pink hover:bg-white/5"
                      }`}
                    >
                      <span className={`${isActive(item.to) ? "text-neon-pink" : "text-foreground/50"}`}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-6">
                  <Link
                    to="/studio/upload"
                    onClick={closeMobile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-white text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    <Upload size={18} /> Criar conteúdo
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <section className="min-w-0">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}