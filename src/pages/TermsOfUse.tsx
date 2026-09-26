import { Header } from "@/components/dashboard/header";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] pb-20">
      <header className="sticky top-0 z-50 bg-[rgba(3,29,36,0.9)] backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white text-center absolute left-1/2 -translate-x-1/2">
          Termos de Uso
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="p-6 text-white/80 space-y-6 max-w-2xl mx-auto text-sm leading-relaxed">
        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">1. Objeto</h2>
          <p>
            O Riff Sports é uma plataforma digital destinada a facilitar a organização esportiva, agendamento de áreas de lazer comuns, comunicação entre moradores e controle simplificado de acesso de convidados em condomínios.
          </p>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">2. Cadastro e Acesso</h2>
          <p className="mb-2">
            O acesso exige cadastro com dados válidos e vínculo ativo a um condomínio cadastrado.
          </p>
          <p>
            A conta é individual e intransferível. O usuário é o único responsável pela guarda de suas credenciais.
          </p>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">3. Natureza do Serviço e Limitação de Responsabilidade</h2>
          <p className="mb-2">
            O Riff Sports atua exclusivamente como provedor de aplicação de tecnologia para intermediação e gestão de agendamentos.
          </p>
          <p className="mb-2">
            A plataforma não possui ingerência, posse ou responsabilidade sobre as instalações físicas dos condomínios, estado de conservação de quadras, integridade física dos participantes de partidas ou incidentes ocorridos no interior das dependências condominiais.
          </p>
          <p>
            O cumprimento dos horários, regras de convivência, capacidade máxima e regimento interno permanece sob exclusiva autoridade da administração/síndico de cada condomínio.
          </p>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">4. Controle de Acesso e Convidados (Guest Passes)</h2>
          <p>
            A emissão de convites e passes com QR Code é de inteira responsabilidade do morador titular da reserva. O condomínio e a portaria reservam-se o direito de barrar qualquer pessoa em desconformidade com as normas internas locais.
          </p>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">5. Cancelamento e Suspensão de Contas</h2>
          <p>
            Reservamo-nos o direito de suspender ou banir usuários que utilizem a plataforma para práticas fraudulentas, ofensas ou violações de segurança.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse;
