import Layout from "@/components/Layout";
import { Shield, Cookie, Database, Lock, Eye, BellRing, Server } from "lucide-react";

const sections = [
{
title: "1. Dados que recolhemos",
icon: <Database size={18} className="text-neon-blue" />,
content: [
"A plataforma poderá recolher dados fornecidos directamente pelo utilizador, incluindo email, credenciais de conta, informações de perfil e conteúdos enviados, como uploads e metadados associados.",
"Também poderão ser recolhidos dados de actividade, incluindo interações com a plataforma, histórico de utilização, páginas visitadas, registos de sessão e informações técnicas do dispositivo e navegador.",
"Alguns dados podem ser recolhidos automaticamente através de cookies e tecnologias semelhantes.",
],
},
{
title: "2. Finalidade do uso dos dados",
icon: <Shield size={18} className="text-neon-pink" />,
content: [
"Os dados recolhidos são utilizados para criar e gerir contas, autenticar utilizadores, permitir uploads, apresentar conteúdos, processar subscrições, prestar suporte e melhorar a plataforma.",
"As informações também podem ser utilizadas para segurança, prevenção de fraude, análise técnica, moderação de conteúdo e cumprimento de obrigações legais.",
],
},
{
title: "3. Armazenamento e retenção",
icon: <Server size={18} className="text-neon-purple" />,
content: [
"Os dados são armazenados em infraestruturas e serviços tecnológicos adequados ao funcionamento da plataforma.",
"A retenção dos dados ocorrerá apenas durante o período necessário para prestação do serviço, segurança, obrigações legais, gestão contratual e prevenção de abuso ou fraude.",
"Quando aplicável, dados poderão ser eliminados, anonimizados ou limitados após deixarem de ser necessários.",
],
},
{
title: "4. Segurança",
icon: <Lock size={18} className="text-emerald-400" />,
content: [
"Adoptamos medidas técnicas e organizacionais razoáveis para proteger os dados pessoais contra acesso não autorizado, perda, alteração indevida ou divulgação ilícita.",
"Apesar disso, nenhum sistema digital oferece segurança absoluta, pelo que o utilizador também deve proteger as suas credenciais e adoptar boas práticas de segurança.",
],
},
{
title: "5. Partilha de dados",
icon: <Eye size={18} className="text-amber-400" />,
content: [
"Os dados poderão ser partilhados apenas quando necessário com prestadores de serviços ligados a alojamento, autenticação, armazenamento, pagamentos, segurança, análise técnica e funcionamento da plataforma.",
"Essas partilhas ocorrerão apenas na medida necessária à prestação do serviço, cumprimento legal ou protecção legítima da plataforma e dos utilizadores.",
"A plataforma não tem como actividade principal a venda de dados pessoais.",
],
},
{
title: "6. Direitos do utilizador",
icon: <BellRing size={18} className="text-neon-pink" />,
content: [
"O utilizador poderá solicitar acesso aos seus dados, correcção de informações, remoção de determinados dados ou limitação do seu tratamento, dentro dos limites legais e técnicos aplicáveis.",
"Também poderá apresentar pedidos relacionados com privacidade, gestão de conta e tratamento dos seus dados pessoais através dos canais oficiais da plataforma.",
],
},
{
title: "7. Cookies",
icon: <Cookie size={18} className="text-amber-400" />,
content: [
"A plataforma pode utilizar cookies e tecnologias semelhantes para autenticação, manutenção de sessão, preferências, desempenho, segurança e análise de utilização.",
"Alguns cookies são essenciais para o funcionamento correcto do serviço e não podem ser desactivados sem comprometer certas funcionalidades.",
"Ao continuar a utilizar a plataforma, o utilizador reconhece a utilização necessária de cookies essenciais.",
],
},
{
title: "8. Princípios de protecção de dados",
icon: <Shield size={18} className="text-emerald-400" />,
content: [
"A plataforma procura actuar de acordo com princípios de protecção de dados semelhantes aos previstos em regimes como o RGPD, nomeadamente transparência, limitação de finalidade, minimização de dados, segurança e responsabilização.",
],
},
{
title: "9. Alterações a esta política",
icon: <Shield size={18} className="text-neon-blue" />,
content: [
"Esta Política de Privacidade e Cookies poderá ser actualizada sempre que necessário para reflectir mudanças legais, técnicas ou operacionais.",
"A versão mais recente permanecerá disponível nesta página.",
],
},
];

export default function PrivacyCookies() {
return (
<Layout>
<div className="min-h-screen bg-[#07070a] text-white">
<section className="relative overflow-hidden border-b border-white/10">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_28%),linear-gradient(180deg,#0b0712_0%,#07070a_100%)]" />
<div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
<div className="max-w-3xl">
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-blue/25 bg-neon-blue/10 text-neon-blue text-xs font-bold tracking-[0.18em] uppercase mb-6">
<Shield size={14} />
Privacidade e Cookies
</div>

<h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
Protecção de dados, privacidade
<span className="block bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
e utilização de cookies
</span>
</h1>

<p className="text-white/55 text-base md:text-lg leading-relaxed">
Esta política explica que dados podem ser recolhidos, como são utilizados,
armazenados, protegidos e quais são os direitos do utilizador.
</p>
</div>
</div>
</section>

<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<div className="grid gap-6">
{sections.map((section) => (
<div
key={section.title}
className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
>
<div className="px-6 py-5 border-b border-white/8 bg-white/[0.02] flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
{section.icon}
</div>
<h2 className="text-lg md:text-xl font-bold text-white">{section.title}</h2>
</div>

<div className="px-6 py-5 space-y-4">
{section.content.map((paragraph, index) => (
<p key={index} className="text-white/65 leading-relaxed">
{paragraph}
</p>
))}
</div>
</div>
))}
</div>

<div className="mt-10 rounded-2xl border border-neon-blue/20 bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 p-6">
<p className="text-sm text-white/70 leading-relaxed">
Última actualização: <span className="font-bold text-white">2026</span>.
Recomenda-se a consulta regular desta página para acompanhar futuras alterações.
</p>
</div>
</section>
</div>
</Layout>
);
}
