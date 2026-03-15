import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Coffee, Trophy, Users, Flag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/dashboard/header";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface PraiseTag {
  id: string;
  label: string;
  icon: any;
}

const praiseTags: PraiseTag[] = [
  { id: "comunicativo", label: "Comunicativo", icon: MessageSquare },
  { id: "trabalho_equipe", label: "Trabalho em equipe", icon: Users },
  { id: "habilidoso", label: "Habilidoso", icon: Trophy },
  { id: "amigavel", label: "Amigável", icon: Coffee },
  { id: "esforcado", label: "Esforçado", icon: Flag },
];

export default function EventEvaluation() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");
  const [selectedTab, setSelectedTab] = useState<"players" | "event" | "location">("players");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedPlayerForPraise, setSelectedPlayerForPraise] = useState<string | null>(null);
  const [selectedPraiseTags, setSelectedPraiseTags] = useState<string[]>([]);
  const [eventComment, setEventComment] = useState("");
  const [eventTitle, setEventTitle] = useState("Avalie seu último jogo");
  const [eventSubtitle, setEventSubtitle] = useState("Jogo de queimada • Organizador: Julia Alcantra");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    validateParticipationAndFetchData();
  }, [eventId]);

  const validateParticipationAndFetchData = async () => {
    if (!eventId) {
      toast({
        title: "Erro",
        description: "ID do evento não encontrado.",
        variant: "destructive",
      });
      navigate('/my-events');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de Autenticação",
          description: "Usuário não autenticado.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Verificar se o usuário participou do evento
      const { data: participation, error: participationError } = await supabase
        .from('event_participants')
        .select('id, evaluation_status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'registered')
        .single();

      if (participationError || !participation) {
        toast({
          title: "Acesso Negado",
          description: "Você só pode avaliar eventos dos quais participou.",
          variant: "destructive",
        });
        navigate('/my-events');
        return;
      }

      // Verificar se a avaliação está disponível
      if (participation.evaluation_status !== 'evaluation_available') {
        toast({
          title: "Avaliação Não Disponível",
          description: "A avaliação para este evento ainda não foi liberada ou já foi concluída.",
          variant: "destructive",
        });
        navigate('/my-events');
        return;
      }

      // Se chegou até aqui, o usuário pode avaliar - carregar dados
      await fetchEventData();
      await fetchParticipants();
      
    } catch (error) {
      console.error('Erro ao validar participação:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões de avaliação.",
        variant: "destructive",
      });
      navigate('/my-events');
    }
  };

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('title, description')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      if (data) {
        setEventTitle(`Avalie seu último jogo`);
        setEventSubtitle(`${data.title} • Organizador: Usuário`);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do evento:', error);
    }
  };

  const fetchParticipants = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'registered');

      if (error) throw error;

      // Buscar perfis dos participantes separadamente
      const userIds = data?.map(p => p.user_id) || [];
      
      if (userIds.length === 0) {
        setParticipants([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const participantsList = profilesData?.map((profile: any) => ({
        id: profile.user_id,
        name: profile.full_name || 'Usuário'
      })) || [];

      setParticipants(participantsList);
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar participantes do evento.",
        variant: "destructive",
      });
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else if (selectedPlayers.length < 3) {
      setSelectedPlayers([...selectedPlayers, playerId]);
    } else {
      toast({
        title: "Limite atingido",
        description: "Você pode selecionar até 3 jogadores para elogiar.",
        variant: "destructive",
      });
    }
  };

  const openPraiseModal = (playerId: string) => {
    setSelectedPlayerForPraise(playerId);
    setSelectedPraiseTags([]);
  };

  const closePraiseModal = () => {
    setSelectedPlayerForPraise(null);
    setSelectedPraiseTags([]);
  };

  const handlePraiseTagSelect = (tagId: string) => {
    if (selectedPraiseTags.includes(tagId)) {
      setSelectedPraiseTags(selectedPraiseTags.filter(id => id !== tagId));
    } else {
      setSelectedPraiseTags([...selectedPraiseTags, tagId]);
    }
  };

  const savePraise = async () => {
    if (!selectedPlayerForPraise || selectedPraiseTags.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (const tag of selectedPraiseTags) {
        const tagLabel = praiseTags.find(t => t.id === tag)?.label;
        
        const { error } = await supabase
          .from('reviews')
          .insert({
            event_id: eventId,
            reviewer_user_id: user.id,
            reviewed_user_id: selectedPlayerForPraise,
            review_type: 'player_praise',
            praise_tags: [tag],
            comment: tagLabel
          });

        if (error) throw error;
      }

      toast({
        title: "Elogio enviado!",
        description: "Seu elogio foi registrado com sucesso.",
      });

      closePraiseModal();
    } catch (error) {
      console.error('Erro ao salvar elogio:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar elogio. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const submitEvaluation = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Save event comment if provided
      if (eventComment.trim()) {
        const { error } = await supabase
          .from('reviews')
          .insert({
            event_id: eventId,
            reviewer_user_id: user.id,
            review_type: 'event',
            comment: eventComment
          });

        if (error) throw error;
      }

      // Update participant status to completed
      const { error: statusError } = await supabase
        .from('event_participants')
        .update({ evaluation_status: 'completed' })
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (statusError) throw statusError;

      toast({
        title: "Obrigado pelo seu feedback!",
        description: "Sua avaliação foi enviada com sucesso.",
      });

      navigate('/my-events');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlayer = participants.find(p => p.id === selectedPlayerForPraise);

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/my-events")}
            className="p-2 hover:bg-[rgba(119,136,143,0.3)]"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-white text-2xl font-semibold">{eventTitle}</h1>
          <p className="text-[rgba(238,243,243,0.7)]">{eventSubtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2">
          <Button
            variant={selectedTab === "players" ? "default" : "ghost"}
            onClick={() => setSelectedTab("players")}
            className={`flex-1 ${selectedTab === "players" 
              ? "bg-white text-[rgba(3,29,36,1)]" 
              : "bg-[rgba(119,136,143,0.3)] text-white hover:bg-[rgba(119,136,143,0.4)]"
            }`}
          >
            Esportistas
          </Button>
          <Button
            variant={selectedTab === "event" ? "default" : "ghost"}
            onClick={() => setSelectedTab("event")}
            className={`flex-1 ${selectedTab === "event" 
              ? "bg-white text-[rgba(3,29,36,1)]" 
              : "bg-[rgba(119,136,143,0.3)] text-white hover:bg-[rgba(119,136,143,0.4)]"
            }`}
          >
            Evento
          </Button>
          <Button
            variant={selectedTab === "location" ? "default" : "ghost"}
            onClick={() => setSelectedTab("location")}
            className={`flex-1 ${selectedTab === "location" 
              ? "bg-white text-[rgba(3,29,36,1)]" 
              : "bg-[rgba(119,136,143,0.3)] text-white hover:bg-[rgba(119,136,143,0.4)]"
            }`}
          >
            Local
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {selectedTab === "players" && (
          <div>
            <p className="text-white mb-6">Você pode avaliar até 3 jogadores</p>
            
            {/* Players Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`relative cursor-pointer ${
                    selectedPlayers.includes(participant.id)
                      ? "ring-2 ring-[rgba(241,216,110,1)]"
                      : ""
                  }`}
                  onClick={() => handlePlayerSelect(participant.id)}
                >
                  <div className="aspect-square bg-gray-600 rounded-lg mb-2 overflow-hidden">
                    {participant.avatar ? (
                      <img 
                        src={participant.avatar} 
                        alt={participant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[rgba(119,136,143,0.3)] flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm text-center">{participant.name}</p>
                  
                  {selectedPlayers.includes(participant.id) && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPraiseModal(participant.id);
                      }}
                      className="w-full mt-2 bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.8)]"
                    >
                      Elogiar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "event" && (
          <div>
            <div className="mb-8">
              <img 
                src="/src/assets/basketball-court.jpg" 
                alt="Event" 
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white text-lg font-medium mb-4">Deixar um comentário</h3>
                <Textarea
                  placeholder="Como foi sua experiência no evento?"
                  value={eventComment}
                  onChange={(e) => setEventComment(e.target.value)}
                  className="min-h-[120px] bg-[rgba(119,136,143,0.3)] border-[rgba(119,136,143,0.5)] text-white placeholder:text-[rgba(238,243,243,0.5)]"
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === "location" && (
          <div className="text-center py-8">
            <p className="text-[rgba(238,243,243,0.7)]">
              Avaliação do local em desenvolvimento
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-[rgba(3,29,36,1)]">
          <Button
            onClick={submitEvaluation}
            disabled={isSubmitting}
            className="w-full bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.8)] font-medium py-3"
          >
            {isSubmitting ? "Enviando..." : "Enviar comentário"}
          </Button>
        </div>
      </div>

      {/* Praise Modal */}
      {selectedPlayerForPraise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgba(3,29,36,1)] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={closePraiseModal}
                className="p-2 hover:bg-[rgba(119,136,143,0.3)]"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
              <h3 className="text-white text-lg font-medium">Fazer um elogio?</h3>
              <div className="w-10" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {praiseTags.map((tag) => {
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.id}
                    onClick={() => handlePraiseTagSelect(tag.id)}
                    className={`p-4 rounded-lg text-center transition-colors ${
                      selectedPraiseTags.includes(tag.id)
                        ? "bg-[rgba(241,216,110,0.2)] border border-[rgba(241,216,110,1)]"
                        : "bg-[rgba(119,136,143,0.3)] hover:bg-[rgba(119,136,143,0.4)]"
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${
                      selectedPraiseTags.includes(tag.id)
                        ? "text-[rgba(241,216,110,1)]"
                        : "text-white"
                    }`} />
                    <p className={`text-sm ${
                      selectedPraiseTags.includes(tag.id)
                        ? "text-[rgba(241,216,110,1)]"
                        : "text-white"
                    }`}>
                      {tag.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={savePraise}
              disabled={selectedPraiseTags.length === 0}
              className="w-full bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.8)] disabled:opacity-50"
            >
              Confirmar Elogio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}