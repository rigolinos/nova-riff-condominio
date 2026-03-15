import { Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  full_name: string;
  apt_number?: string;
  block_number?: string;
}

interface MatchmakingRequest {
  id: string;
  sport_name: string;
  time_preference: string;
  created_at: string;
  profiles?: Profile;
}

interface MatchmakingListProps {
  requests: MatchmakingRequest[];
}

export const MatchmakingList = ({ requests }: MatchmakingListProps) => {
  if (requests.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-full flex items-center justify-center mx-auto mb-5 text-[rgba(238,243,243,0.3)]">
          <Users size={32} />
        </div>
        <h4 className="text-[rgba(238,243,243,1)] font-bold mb-2">Sem requisições no momento</h4>
        <p className="text-[rgba(238,243,243,0.5)] text-sm">
          Nenhum morador avisou que está disponível para jogar. 
          Seja o primeiro!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div 
          key={request.id} 
          className="glass-card rounded-3xl p-5 flex gap-4 items-center hover:bg-[rgba(255,255,255,0.05)] transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-[rgba(241,216,110,1)] to-orange-400 rounded-full flex-shrink-0 flex items-center justify-center text-[rgba(3,29,36,1)] font-bold shadow-[0_4px_14px_rgba(241,216,110,0.3)]">
            {request.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-[rgba(238,243,243,1)] text-base font-bold truncate">
              {request.profiles?.full_name} 
              <span className="text-[rgba(238,243,243,0.4)] text-sm ml-1 font-normal">
                {request.profiles?.block_number ? `(Bl. ${request.profiles.block_number}` : ''}
                {request.profiles?.apt_number ? ` - Ap. ${request.profiles.apt_number})` : ''}
              </span>
            </h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span className="text-[rgba(241,216,110,1)] text-sm font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(241,216,110,1)] inline-block"></span>
                {request.sport_name}
              </span>
              <span className="text-[rgba(238,243,243,0.7)] text-sm flex items-center gap-1">
                <Clock size={12} className="opacity-70" />
                {request.time_preference}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[rgba(238,243,243,0.4)] text-[10px]">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            <button className="mt-2 text-[rgba(241,216,110,1)] text-xs font-bold px-3 py-1.5 bg-[rgba(241,216,110,0.1)] rounded-full hover:bg-[rgba(241,216,110,0.2)] transition-colors lg:opacity-0 group-hover:opacity-100">
              Mandar Mensagem
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
