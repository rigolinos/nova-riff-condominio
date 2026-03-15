import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatchmakingFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const SPORTS = [
  "Tênis",
  "Padel",
  "Futebol Society",
  "Futsal",
  "Vôlei",
  "Basquete",
  "Academia",
  "Corrida",
  "Outro"
];

const PREFERENCES = [
  "Agora",
  "Hoje de manhã",
  "Hoje à tarde",
  "Hoje à noite",
  "Amanhã"
];

export const MatchmakingForm = ({ onCancel, onSuccess }: MatchmakingFormProps) => {
  const { user } = useAuth();
  const [sport, setSport] = useState("");
  const [preference, setPreference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport || !preference) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (!user?.user_metadata?.condominium_id) {
      toast.error("Erro: Condomínio não encontrado no seu perfil.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('matchmaking_requests').insert([{
        user_id: user.id,
        condominium_id: user.user_metadata.condominium_id,
        sport_name: sport,
        time_preference: preference,
        status: 'active'
      }]);

      if (error) throw error;

      toast.success("Aviso enviado com sucesso! Agora os vizinhos sabem que você quer jogar.");
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao enviar aviso:', error);
      toast.error("Não foi possível enviar o aviso. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-5">
      <h3 className="text-[rgba(238,243,243,1)] font-bold mb-4">Novo aviso "Tô Disponível"</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[rgba(238,243,243,0.7)] text-sm mb-2">Esporte/Modalidade</label>
          <select 
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full h-[50px] bg-transparent border-2 border-[rgba(119,136,143,0.5)] rounded-2xl px-4 text-[rgba(238,243,243,1)] focus-visible:outline-none focus-visible:border-[rgba(241,216,110,1)] [&>option]:text-black"
          >
            <option value="">Selecione...</option>
            {SPORTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[rgba(238,243,243,0.7)] text-sm mb-2">Quando quer jogar?</label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPreference(p)}
                className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  preference === p 
                    ? 'bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)]' 
                    : 'bg-transparent border border-[rgba(255,255,255,0.2)] text-[rgba(238,243,243,0.7)] hover:border-[rgba(255,255,255,0.5)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-[rgba(238,243,243,0.7)] font-bold text-sm bg-[rgba(255,255,255,0.05)] rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] font-bold text-sm rounded-full disabled:opacity-50 hover:bg-[rgba(241,216,110,0.9)] transition-colors shadow-lg"
          >
            {isSubmitting ? 'Salvando...' : 'Publicar aviso'}
          </button>
        </div>
      </div>
    </form>
  );
};
