// client/pages/Privacidade.tsx
// Rota pública: /privacidade

import Layout from "@/components/Layout";

const SECTIONS = [
  {
    title: "1. Responsável pelo Tratamento",
    body: "A entidade responsável pelo tratamento dos dados pessoais dos utilizadores é o operador desta plataforma, em conformidade com o Regulamento Geral sobre a Protecção de Dados (RGPD — Regulamento UE 2016/679) e a legislação nacional aplicável.",
  },
  {
    title: "2. Dados Recolhidos",
    body: "A plataforma recolhe os seguintes dados: endereço de email, dados de autenticação, dados de pagamento (processados exclusivamente pela Stripe — não armazenamos dados de cartão de crédito), endereço IP, e dados de utilização anónimos utilizados para melhoria contínua do serviço.",
  },
  {
    title: "3. Finalidade do Tratamento",
    body: "Os dados pessoais são utilizados exclusivamente para: gestão e autenticação de conta, processamento seguro de pagamentos, comunicações relacionadas com o serviço (confirmações, alertas de segurança), e cumprimento de obrigações legais aplicáveis.",
  },
  {
    title: "4. Base Legal",
    body: "O tratamento de dados pessoais baseia-se no consentimento do utilizador, prestado no momento do registo, e na execução do contrato de subscrição celebrado entre o utilizador e a plataforma, nos termos do artigo 6.º do RGPD.",
  },
  {
    title: "5. Partilha de Dados",
    body: "Os dados pessoais não são vendidos nem partilhados com terceiros para fins comerciais. São partilhados apenas com prestadores de serviços essenciais ao funcionamento da plataforma — nomeadamente a Stripe para processamento de pagamentos e a Supabase para infraestrutura de dados — ao abrigo de acordos de confidencialidade e contratos de subcontratação rigorosos.",
  },
  {
    title: "6. Retenção de Dados",
    body: "Os dados pessoais são conservados pelo período estritamente necessário à prestação do serviço e ao cumprimento das obrigações legais aplicáveis, não excedendo cinco anos após o término da relação contratual.",
  },
  {
    title: "7. Direitos do Utilizador",
    body: "Ao abrigo do RGPD, o utilizador tem o direito de aceder, rectificar, apagar, exportar (portabilidade) e limitar o tratamento dos seus dados pessoais, bem como o direito de se opor ao seu tratamento. Para exercer qualquer um destes direitos, contacte-nos através do email de suporte indicado na plataforma.",
  },
  {
    title: "8. Cookies",
    body: "A plataforma utiliza exclusivamente cookies essenciais para o funcionamento do serviço, designadamente para autenticação de sessão e armazenamento de preferências do utilizador. Não utilizamos cookies de rastreamento de terceiros nem publicidade comportamental externa.",
  },
  {
    title: "9. Segurança",
    body: "Implementamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. A comunicação com os nossos servidores é sempre cifrada via HTTPS/TLS.",
  },
  {
    title: "10. Contacto",
    body: "Para questões relacionadas com privacidade, protecção de dados ou para exercer os seus direitos ao abrigo do RGPD, contacte o nosso responsável de privacidade através do email de suporte disponível na plataforma.",
  },
];

export default function Privacidade() {
  return (
    <Layout>
      <div className="min-h-screen py-16 px-4" style={{ background: "#080010" }}>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: "rgba(147,51,234,0.12)", border: "1px solid rgba(147,51,234,0.25)", color: "#a855f7" }}
            >
              Legal
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Política de Privacidade</h1>
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

          {/* RGPD badge */}
          <div
            className="mt-14 px-5 py-4 rounded-2xl text-sm leading-relaxed"
            style={{
              background: "rgba(147,51,234,0.06)",
              border:     "1px solid rgba(147,51,234,0.18)",
              color:      "rgba(255,255,255,0.40)",
            }}
          >
            Esta plataforma está em conformidade com o Regulamento Geral sobre a Protecção de Dados (RGPD — Regulamento UE 2016/679). Para questões de privacidade, contacte-nos através do email de suporte disponível na plataforma.
          </div>
        </div>
      </div>
    </Layout>
  );
}
