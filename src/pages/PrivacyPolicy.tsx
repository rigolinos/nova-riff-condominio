import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] pb-20">
      <header className="sticky top-0 z-50 bg-[rgba(3,29,36,0.9)] backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white text-center absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          Política de Privacidade
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="p-6 text-white/80 space-y-6 max-w-2xl mx-auto text-sm leading-relaxed">
        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">1. Dados Coletados</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identificação Pessoal:</strong> Nome completo, e-mail, foto de perfil (opcional), número de apartamento/bloco e vínculo condominial.</li>
            <li><strong>Registros de Uso:</strong> Horários de agendamento de amenidades, confirmações em partidas esportivas, logs de check-in e endereços IP de acesso (conforme Marco Civil da Internet).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">2. Finalidade do Tratamento</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Viabilizar a criação de partidas, reservas de quadras e controle de listas de presença/portaria.</li>
            <li>Segurança da plataforma e prevenção contra fraudes ou reservas duplicadas.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">3. Compartilhamento de Dados</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Os dados básicos de perfil (nome, foto e bloco/unidade) são visíveis apenas para outros moradores do mesmo condomínio para fins de identificação no matchmaking e no feed.</li>
            <li>Os dados de portaria/convidados são visíveis estritamente para os operadores de portaria e administradores do condomínio respectivo.</li>
            <li>Não comercializamos dados de usuários a terceiros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[rgba(241,216,110,1)] text-lg font-bold mb-2">4. Direitos do Titular (Art. 18 da LGPD)</h2>
          <p>
            O usuário pode, a qualquer momento, solicitar a visualização, retificação ou exclusão de sua conta e dados pessoais através do canal de configurações da aplicação ("Excluir minha conta").
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
