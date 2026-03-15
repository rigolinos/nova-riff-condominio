import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import { MatchmakingForm } from "@/components/matchmaking/matchmaking-form";
import { MatchmakingList } from "@/components/matchmaking/matchmaking-list";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Matchmaking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, fetchRequests, loading } = useMatchmakingStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.condominium_id) {
      fetchRequests(user.user_metadata.condominium_id);
    }
  }, [user, fetchRequests]);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleFormSubmitted = () => {
    if (user?.user_metadata?.condominium_id) {
      fetchRequests(user.user_metadata.condominium_id);
    }
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto relative overflow-hidden font-sans flex flex-col">
      <header className="px-5 pt-12 pb-6 border-b border-[rgba(255,255,255,0.05)] sticky top-0 bg-[rgba(3,29,36,0.95)] backdrop-blur-md z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(238,243,243,1)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[rgba(238,243,243,1)] font-bold text-lg">Tô Disponível 🎾</span>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </header>

      <main className="p-5 pb-24 flex-1 overflow-y-auto">
        <section className="bg-gradient-to-br from-[rgba(241,216,110,0.1)] to-transparent p-6 rounded-3xl border border-[rgba(241,216,110,0.2)] mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-[rgba(241,216,110,1)] to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(241,216,110,0.4)] text-[rgba(3,29,36,1)]">
            <Users size={24} />
          </div>
          <h2 className="text-xl font-bold text-[rgba(238,243,243,1)] mb-2">
            Encontre parceiros pro jogo
          </h2>
          <p className="text-[rgba(238,243,243,0.7)] text-sm mb-5">
            Avise os moradores do seu condomínio que você quer jogar ou chame quem já sinalizou.
          </p>
          <button 
            onClick={toggleForm}
            className="w-full bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] py-3 rounded-full text-base font-bold hover:bg-[rgba(241,216,110,0.9)] transition-colors shadow-[0_4px_14px_0_rgba(241,216,110,0.4)]"
          >
            {showForm ? 'Cancelar requisição' : 'Avisar que quero jogar'}
          </button>
        </section>

        {showForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <MatchmakingForm onCancel={toggleForm} onSuccess={handleFormSubmitted} />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[rgba(238,243,243,1)]">Moradores disponíveis</h3>
            <span className="text-[rgba(238,243,243,0.5)] text-sm">{requests.length} requisições</span>
          </div>

          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 rounded-full border-t-2 border-[rgba(241,216,110,1)] animate-spin"></div>
             </div>
          ) : (
             <MatchmakingList requests={requests} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Matchmaking;
