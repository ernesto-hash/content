// client/pages/RtaLabel.tsx
// Rota pública: /rta

import Layout from "@/components/Layout";
import { Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. O que é o RTA Label",
    body: "O RTA (Restricted To Adults) é um sistema de classificação voluntário para websites que contêm conteúdo para adultos. Esta plataforma adoptou o RTA Label para permitir que ferramentas de controlo parental identifiquem e filtrem automaticamente o nosso conteúdo, protegendo menores de acederem a material inadequado para a sua faixa etária.",
  },
  {
    title: "2. Como Funciona",
    body: 'O RTA Label é inserido nos metadados da plataforma (meta tag "rating") com o valor "RTA-5042-1996-1400-1577-RTA". Softwares de controlo parental como Net Nanny, CyberPatrol, SurfControl e outros lêem automaticamente esta etiqueta e bloqueiam o acesso em dispositivos configurados para protecção de menores, sem necessidade de qualquer configuração adicional por parte dos pais ou tutores.',
  },
  {
    title: "3. O nosso Compromisso",
    body: "Esta plataforma está comprometida com a protecção de menores e com o acesso responsável a conteúdo para adultos. Exigimos verificação de idade no acesso e utilizamos o RTA Label como camada adicional de protecção técnica. O bem-estar das crianças e jovens é uma responsabilidade que levamos a sério.",
  },
  {
    title: "4. Controlo Parental",
    body: "Se é pai ou tutor e pretende bloquear o acesso a este e outros websites para adultos, recomendamos a configuração de software de controlo parental no dispositivo dos seus filhos. Soluções disponíveis incluem Net Nanny, Qustodio, Circle, e as funcionalidades nativas de controlo parental disponíveis nos sistemas operativos modernos — iOS, Android, Windows e macOS oferecem todos controlos integrados para restrição de conteúdo.",
  },
  {
    title: "5. Mais Informações",
    body: "Para mais informações sobre o sistema RTA Label e a sua implementação, visite o website oficial em rtalabel.org. O RTA Label é um projecto sem fins lucrativos dedicado à protecção de menores online, desenvolvido por e para a indústria de conteúdo adulto responsável.",
  },
];

export default function RtaLabel() {
  return (
    <Layout>
      <div className="min-h-screen py-16 px-4" style={{ background: "#080010" }}>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.20)", color: "#34d399" }}
            >
              <Shield size={11} /> Protecção de Menores
            </div>
            <h1 className="text-4xl font-black text-white mb-2">
              RTA Label
            </h1>
            <p className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Classificação de Conteúdo para Adultos
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
              Restricted To Adults
            </p>
          </div>

          {/* Divider */}
          <div className="mb-10" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

          {/* Sections */}
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-base font-black text-white mb-3">
                  {s.title}
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.70)" }}
                >
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          {/* RTA Code block */}
          <div
            className="mt-14 px-6 py-5 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border:     "1px solid rgba(236,72,153,0.25)",
            }}
          >
            <p
              className="text-xs font-semibold mb-3 tracking-wider uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Código RTA desta plataforma
            </p>
            <code
              className="block text-sm font-mono px-4 py-3 rounded-xl select-all"
              style={{
                background: "rgba(0,0,0,0.35)",
                color:      "#ec4899",
                border:     "1px solid rgba(236,72,153,0.15)",
                letterSpacing: "0.05em",
              }}
            >
              RTA-5042-1996-1400-1577-RTA
            </code>
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              Esta etiqueta está inserida nos metadados de todas as páginas da plataforma e é reconhecida automaticamente por software de controlo parental compatível.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
