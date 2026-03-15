import { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PendingParticipantsPanel } from "@/components/pending-participants-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Participant {
  user_id: string;
  full_name: string;
  profile_photo_url?: string;
  city?: string;
}

export default function EventParticipants() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingParticipants, setPendingParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [isCreator, setIsCreator] = useState(false);
  const [eventCreatorId, setEventCreatorId] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchEventInfo();
    }
  }, [id]);

  useEffect(() => {
    if (id && eventCreatorId) {
      fetchParticipants();
    }
  }, [id, eventCreatorId, user]);

  const fetchEventInfo = async () => {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('title, created_by')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event info:', error);
        return;
      }

      if (event) {
        setEventTitle(event.title);
        setEventCreatorId(event.created_by);
        setIsCreator(user?.id === event.created_by);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      // Buscar participantes aprovados do evento
      const { data: approvedParticipants, error: approvedError } = await supabase
        .from('event_participants')
        .select('user_id')
        .eq('event_id', id)
        .eq('status', 'registered');

      if (approvedError) {
        console.error('Error fetching approved participants:', approvedError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os participantes.",
          variant: "destructive",
        });
        return;
      }

      // Buscar participantes pendentes (apenas se for o criador)
      let pendingData: any[] = [];
      if (isCreator) {
        const { data: pending, error: pendingError } = await supabase
          .from('event_participants')
          .select('user_id')
          .eq('event_id', id)
          .eq('status', 'pending');

        if (!pendingError && pending) {
          pendingData = pending;
        }
      }

      // Buscar dados dos perfis
      const allUserIds = [
        ...(approvedParticipants || []).map(ep => ep.user_id),
        ...pendingData.map(ep => ep.user_id)
      ];

      if (allUserIds.length === 0) {
        setParticipants([]);
        setPendingParticipants([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_photo_url, city')
        .in('user_id', allUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos participantes.",
          variant: "destructive",
        });
        return;
      }

      // Separar aprovados e pendentes
      const approvedIds = (approvedParticipants || []).map(ep => ep.user_id);
      const pendingIds = pendingData.map(ep => ep.user_id);

      setParticipants((profiles || []).filter(p => approvedIds.includes(p.user_id)));
      setPendingParticipants((profiles || []).filter(p => pendingIds.includes(p.user_id)));
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar participantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Carregando participantes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      
      {/* Page Header */}
      <div className="px-4 py-4 border-b border-[rgba(119,136,143,0.3)]">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="text-white hover:bg-white/10 p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Jogadores</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 pb-24">
        {/* Pending Participants - Only for creator */}
        {isCreator && (
          <PendingParticipantsPanel
            eventId={id!}
            pendingParticipants={pendingParticipants}
            onUpdate={fetchParticipants}
          />
        )}

        {participants.length === 0 && pendingParticipants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[rgba(119,136,143,1)] text-lg">
              Nenhum participante inscrito ainda
            </p>
            <p className="text-[rgba(119,136,143,1)] text-sm mt-2">
              Seja o primeiro a se inscrever!
            </p>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[rgba(119,136,143,1)] text-lg">
              Nenhum participante aprovado ainda
            </p>
          </div>
        ) : (
          <>
            {/* Participants Grid */}
            <div className="grid grid-cols-3 gap-4">
              {participants.map((participant) => (
                <div key={participant.user_id} className="relative">
                  {/* More menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 rounded-full"
                      >
                        <MoreVertical className="h-3 w-3 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[rgba(3,29,36,1)] border-[rgba(119,136,143,0.3)]">
                      <DropdownMenuItem 
                        onClick={showUnderDevelopment}
                        className="text-white hover:bg-white/10"
                      >
                        Ver perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={showUnderDevelopment}
                        className="text-white hover:bg-white/10"
                      >
                        Enviar mensagem
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={showUnderDevelopment}
                        className="text-red-400 hover:bg-white/10"
                      >
                        Remover do evento
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Participant Card */}
                  <div 
                    onClick={() => navigate(`/profile/${participant.user_id}`)}
                    className="bg-[rgba(42,69,78,1)] rounded-lg p-3 text-center cursor-pointer hover:bg-[rgba(52,79,88,1)] transition-colors"
                  >
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarImage src={participant.profile_photo_url} alt={participant.full_name} />
                      <AvatarFallback className="bg-[rgba(119,136,143,1)] text-white">
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white text-sm font-medium truncate">
                      {participant.full_name}
                    </p>
                    {participant.city && (
                      <p className="text-[rgba(119,136,143,1)] text-xs truncate mt-1">
                        {participant.city}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer info */}
            <div className="mt-6 text-center">
              <p className="text-[rgba(119,136,143,1)] text-sm">
                {participants.length} participante{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}