import Layout from "@/components/Layout";
import {
FileText,
ShieldCheck,
Scale,
AlertTriangle,
CheckCircle2,
Ban,
Copyright,
Users,
} from "lucide-react";

const sections = [
{
title: "1. Aceitação dos Termos",
icon: <CheckCircle2 size={18} className="text-neon-pink" />,
content: [
"Ao aceder, registar-se ou utilizar esta plataforma, o utilizador declara que leu, compreendeu e aceita integralmente os presentes Termos de Uso.",
"Caso não concorde com qualquer disposição aqui prevista, não deverá utilizar a plataforma nem criar conta.",
"A utilização contínua da plataforma será considerada como aceitação da versão mais recente destes termos.",
],
},
{
title: "2. Objecto da Plataforma",
icon: <FileText size={18} className="text-neon-blue" />,
content: [
"A plataforma disponibiliza funcionalidades de registo, autenticação, visualização de conteúdos, upload de vídeos e gestão de conta por utilizadores autenticados.",
"Os utilizadores podem publicar conteúdo na plataforma, desde que esse conteúdo respeite a lei, os presentes termos e as demais regras internas aplicáveis.",
],
},
{
title: "3. Elegibilidade e Conta do Utilizador",
icon: <Users size={18} className="text-emerald-400" />,
content: [
"O utilizador é responsável por fornecer informações verdadeiras, actuais e completas no momento do registo.",
"Cada utilizador é inteiramente responsável pela segurança das suas credenciais de acesso e por toda a actividade realizada através da sua conta.",
"A plataforma poderá recusar, limitar, suspender ou encerrar contas que apresentem informação falsa, actividade suspeita, uso abusivo ou violação destes termos.",
],
},
{
title: "4. Responsabilidade pelo Conteúdo Enviado",
icon: <ShieldCheck size={18} className="text-neon-purple" />,
content: [
"Todo o conteúdo enviado, publicado ou disponibilizado pelo utilizador é da sua exclusiva responsabilidade.",
"Ao fazer upload de conteúdo, o utilizador declara possuir os direitos, autorizações, consentimentos e permissões necessários para a sua publicação.",
"O utilizador responde integralmente por qualquer dano, reclamação, denúncia ou responsabilidade decorrente do conteúdo que submeter à plataforma.",
],
},
{
title: "5. Conteúdo Permitido e Conteúdo Proibido",
icon: <Ban size={18} className="text-red-400" />,
content: [
"A plataforma poderá admitir conteúdo adulto apenas quando esse conteúdo for legal, publicado com consentimento válido e respeitar integralmente a legislação aplicável.",
"É estritamente proibido publicar, transmitir, armazenar, promover ou partilhar conteúdo ilegal, incluindo conteúdo sem consentimento, conteúdo que viole a privacidade de terceiros, material obtido ilicitamente ou qualquer conteúdo que incentive actos ilegais.",
"É absolutamente proibido qualquer conteúdo que envolva menores, exploração de menores, aparência de menor em contexto sexualizado ou qualquer forma de material relacionado com abuso infantil.",
"Também é proibido conteúdo protegido por direitos de autor sem autorização, spam, fraude, assédio, discurso abusivo, divulgação indevida de dados pessoais, ou qualquer utilização da plataforma em desconformidade com a lei.",
],
},
{
title: "6. Direitos de Remoção e Moderação",
icon: <AlertTriangle size={18} className="text-amber-400" />,
content: [
"A plataforma reserva-se o direito de analisar, restringir, ocultar, despublicar ou remover qualquer conteúdo que considere inadequado, suspeito, ilícito ou contrário aos presentes termos.",
"A remoção de conteúdo poderá ocorrer com ou sem aviso prévio, sempre que necessário para segurança da plataforma, cumprimento legal, moderação interna ou protecção de terceiros.",
"A plataforma também poderá cooperar com autoridades competentes quando legalmente exigido.",
],
},
{
title: "7. Suspensão e Encerramento de Conta",
icon: <ShieldCheck size={18} className="text-emerald-400" />,
content: [
"Contas poderão ser suspensas temporária ou permanentemente em caso de violação destes termos, denúncias credíveis, actividade fraudulenta, uso abusivo da plataforma ou publicação de conteúdo proibido.",
"A suspensão ou encerramento da conta não elimina, por si só, eventuais responsabilidades legais do utilizador pelos seus actos.",
],
},
{
title: "8. Direitos de Autor e Propriedade Intelectual",
icon: <Copyright size={18} className="text-neon-blue" />,
content: [
"O utilizador não pode publicar conteúdo protegido por direitos de autor, marca, imagem, voz ou quaisquer outros direitos de terceiros sem autorização válida.",
"A estrutura da plataforma, design, marca, identidade visual, textos, elementos gráficos, código e funcionalidades pertencem aos respectivos titulares e não podem ser copiados, reproduzidos ou explorados sem autorização.",
],
},
{
title: "9. Planos, Serviços e Funcionalidades Pagas",
icon: <Scale size={18} className="text-amber-400" />,
content: [
"Algumas áreas, funcionalidades ou conteúdos da plataforma poderão depender de subscrição, pagamento ou activação de plano específico.",
"Preços, benefícios, periodicidade e regras comerciais poderão ser alterados, respeitando-se, quando aplicável, os períodos já contratados.",
"Serviços de pagamento processados por terceiros ficam também sujeitos às políticas e condições desses prestadores.",
],
},
{
title: "10. Limitação de Responsabilidade",
icon: <AlertTriangle size={18} className="text-red-400" />,
content: [
"A plataforma é disponibilizada conforme a disponibilidade técnica existente e poderá sofrer falhas, interrupções, manutenção, limitações temporárias ou alterações funcionais.",
"Na máxima extensão permitida por lei, a plataforma não garante disponibilidade ininterrupta, ausência total de erros ou adequação absoluta a finalidades específicas do utilizador.",
"A plataforma não será responsável por perdas indirectas, danos consequenciais, lucros cessantes, falhas de terceiros, uso indevido por utilizadores ou conteúdos inseridos por terceiros.",
],
},
{
title: "11. Alterações aos Termos",
icon: <CheckCircle2 size={18} className="text-neon-pink" />,
content: [
"Os presentes Termos de Uso podem ser alterados a qualquer momento para reflectir mudanças legais, operacionais, técnicas ou comerciais.",
"A versão actualizada ficará disponível nesta página e entrará em vigor após a sua publicação, salvo indicação em contrário.",
],
},
{
title: "12. Contacto",
icon: <FileText size={18} className="text-neon-purple" />,
content: [
"Quaisquer dúvidas, comunicações formais, pedidos legais ou questões relacionadas com estes termos deverão ser enviados através dos canais oficiais de contacto disponibilizados pela plataforma.",
],
},
];

export default function Terms() {
return (
<Layout>
<div className="min-h-screen bg-[#07070a] text-white">
<section className="relative overflow-hidden border-b border-white/10">
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,#0b0712_0%,#07070a_100%)]" />
<div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
<div className="max-w-3xl">
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-pink/25 bg-neon-pink/10 text-neon-pink text-xs font-bold tracking-[0.18em] uppercase mb-6">
<FileText size={14} />
Termos de Uso
</div>

<h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
Regras e condições para uso da
<span className="block bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent">
plataforma de vídeos
</span>
</h1>

<p className="text-white/55 text-base md:text-lg leading-relaxed">
Estes Termos de Uso regulam a criação de conta, publicação de vídeos,
subscrições, moderação de conteúdo, direitos e responsabilidades dos utilizadores.
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
<h2 className="text-lg md:text-xl font-bold text-white">
{section.title}
</h2>
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

<div className="mt-10 rounded-2xl border border-neon-pink/20 bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-blue/10 p-6">
<p className="text-sm text-white/70 leading-relaxed">
Última actualização: <span className="font-bold text-white">2026</span>.
Recomenda-se a leitura periódica desta página para acompanhar futuras alterações.
</p>
</div>
</section>
</div>
</Layout>
);
}