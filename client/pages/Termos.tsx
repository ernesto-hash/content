// client/pages/Termos.tsx
// Rota pública: /termos

import Layout from "@/components/Layout";

const SECTIONS = [
  {
    title: "1. Aceitação dos Termos",
    body: "Ao aceder e utilizar esta plataforma, o utilizador aceita integralmente os presentes Termos de Utilização. Se não concordar com algum dos termos, deverá cessar imediatamente a utilização da plataforma.",
  },
  {
    title: "2. Elegibilidade e Idade Mínima",
    body: "Esta plataforma é destinada exclusivamente a adultos com idade igual ou superior a 18 anos. Ao aceder, o utilizador declara e garante que tem idade legal para consumir conteúdo para adultos na sua jurisdição. A plataforma reserva-se o direito de suspender contas de utilizadores que não cumpram este requisito.",
  },
  {
    title: "3. Conta de Utilizador",
    body: "O utilizador é responsável pela confidencialidade das suas credenciais de acesso. Qualquer actividade realizada através da sua conta é da sua exclusiva responsabilidade. Deverá notificar imediatamente a plataforma em caso de uso não autorizado da sua conta.",
  },
  {
    title: "4. Conteúdo da Plataforma",
    body: "Todo o conteúdo disponível é protegido por direitos de autor. É estritamente proibido descarregar, redistribuir, reproduzir ou partilhar qualquer conteúdo sem autorização expressa. A subscrição confere apenas o direito de visualização pessoal e intransmissível.",
  },
  {
    title: "5. Subscrições e Pagamentos",
    body: "As subscrições são processadas de forma segura através da Stripe. O utilizador autoriza a cobrança recorrente conforme o plano seleccionado. O cancelamento pode ser efectuado a qualquer momento através do portal de gestão de subscrição, sem penalizações, produzindo efeitos no final do período em curso.",
  },
  {
    title: "6. Política de Reembolso",
    body: "Dado o carácter digital e imediato do acesso ao conteúdo, não são emitidos reembolsos após a activação da subscrição, salvo nos casos previstos na legislação aplicável de protecção do consumidor.",
  },
  {
    title: "7. Conduta do Utilizador",
    body: "É proibido utilizar a plataforma para fins ilegais, partilhar credenciais de acesso, tentar contornar sistemas de segurança, ou qualquer actividade que prejudique outros utilizadores ou a integridade da plataforma.",
  },
  {
    title: "8. Limitação de Responsabilidade",
    body: "A plataforma não se responsabiliza por danos indirectos, incidentais ou consequentes resultantes da utilização ou impossibilidade de utilização do serviço.",
  },
  {
    title: "9. Alterações aos Termos",
    body: "A plataforma reserva-se o direito de actualizar os presentes Termos a qualquer momento. As alterações serão comunicadas por email e/ou notificação na plataforma. A continuação da utilização após as alterações implica a sua aceitação.",
  },
  {
    title: "10. Lei Aplicável",
    body: "Os presentes Termos são regidos pela lei portuguesa e qualquer litígio será submetido à jurisdição exclusiva dos tribunais portugueses.",
  },
];

export default function Termos() {
  return (
    <Layout>
      <div className="min-h-screen py-16 px-4" style={{ background: "#080010" }}>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: "rgba(236,72,153,0.10)", border: "1px solid rgba(236,72,153,0.20)", color: "#ec4899" }}
            >
              Legal
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Termos de Utilização</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Última actualização: Abril de 2026
            </p>
          </div>

          {/* Divider */}
          <div className="mb-10" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

          {/* Sections */}
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2
                  className="text-base font-black text-white mb-3"
                  style={{ color: "#ffffff" }}
                >
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

          {/* Footer note */}
          <div
            className="mt-14 px-5 py-4 rounded-2xl text-sm leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.03)",
              border:     "1px solid rgba(255,255,255,0.07)",
              color:      "rgba(255,255,255,0.35)",
            }}
          >
            Para questões relacionadas com os presentes Termos de Utilização, contacte-nos através do email de suporte disponível na plataforma.
          </div>
        </div>
      </div>
    </Layout>
  );
}
