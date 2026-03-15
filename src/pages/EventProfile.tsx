import React from "react";
import { ArrowLeft, Share2, Bookmark, MoreVertical, MapPin, Calendar, Clock, Users, Camera, Edit } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EventComments } from "@/components/event-comments";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useEventDetails } from "@/hooks/useEventDetails";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const EventProfile = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { requireAuth } = useAuthAction();
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const { event, participants, loading, error, joinEvent, leaveEvent } = useEventDetails(eventId || "");

  // Derived values
  const isOrganizer = user?.id === event?.created_by;
  const isEventFull = event?.max_participants ? event.participant_count >= event.max_participants : false;
  const isEventEnded = event?.status === 'completed';
  const isEventCancelled = event?.status === 'cancelled';
  
  // Format date and time
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };
  
  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${time}`));
  };

  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  const handleParticipation = async () => {
    if (!event) return;
    
    const executeAction = async () => {
      if (event.is_participant) {
        // Show confirmation dialog for cancellation
        setShowCancelDialog(true);
      } else {
        // Join event directly
        const result = await joinEvent();
        if (result.success) {
          toast({
            title: "Sucesso!",
            description: "Você se inscreveu no evento.",
            className: "bg-dashboard-card border-dashboard-border",
          });
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao se inscrever no evento.",
            variant: "destructive",
          });
        }
      }
    };

    requireAuth(executeAction, "Você precisa estar logado para se inscrever em eventos.");
  };

  const confirmCancelParticipation = async () => {
    const result = await leaveEvent();
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Inscrição cancelada.",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao cancelar inscrição.",
        variant: "destructive",
      });
    }
    setShowCancelDialog(false);
  };

  const getParticipationButtonText = () => {
    if (isOrganizer) return "Você é o organizador";
    if (isEventEnded) return "Evento encerrado";
    if (isEventCancelled) return "Evento cancelado";
    if (event?.is_participant) return "Cancelar inscrição";
    if (isEventFull) return "Evento lotado";
    return "Participar";
  };

  const getParticipationButtonStyle = () => {
    if (isOrganizer || isEventEnded || isEventCancelled || isEventFull) {
      return "bg-gray-600 text-gray-300 cursor-not-allowed";
    }
    if (event?.is_participant) {
      return "bg-red-600 hover:bg-red-700 text-white";
    }
    return "bg-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.9)] text-[rgba(3,29,36,1)]";
  };

  const handleBack = () => {
    navigate("/events");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-text" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-6 text-center">
          <p className="text-dashboard-text/70">
            {error || "Evento não encontrado"}
          </p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-dashboard-accent text-dashboard rounded-full"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="relative">
        {/* Header with back button and actions */}
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBack}
                className="p-2 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/40 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              {/* Edit button - only for event organizer and non-cancelled events */}
              {isOrganizer && !isEventCancelled && (
                <button 
                  onClick={() => navigate(`/event/${eventId}/edit`)}
                  className="px-3 py-2 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/40 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Editar</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Simplified header - Task #13: Less prominent secondary buttons */}
              <button 
                onClick={showUnderDevelopment}
                className="p-2 bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/30 transition-colors"
                aria-label="Compartilhar evento"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={showUnderDevelopment}
                className="p-2 bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/30 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative h-80">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
            
            {/* Photos indicator - moved down to avoid overlap */}
            <div className="absolute top-20 right-4 flex items-center bg-black/40 rounded-full px-3 py-1 backdrop-blur-sm z-10">
              <button onClick={showUnderDevelopment} className="flex items-center">
                <Camera className="w-4 h-4 text-white mr-1" />
                <span className="text-white text-sm">Fotos</span>
              </button>
            </div>

            {/* Event title overlay */}
            <div className="absolute bottom-6 left-4 right-4">
              <h2 className="text-white text-2xl font-bold mb-2">{event.title}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-white text-sm">Organizador:</span>
                  <span className="text-white font-medium">
                    {event.creator_name && event.creator_name.length > 16 
                      ? `${event.creator_name.substring(0, 16)}...` 
                      : event.creator_name}
                  </span>
                </div>
                <div className={`flex items-center space-x-1 ${
                  isEventEnded ? 'text-gray-400' :
                  isEventCancelled ? 'text-red-400' :
                  'text-white'
                }`}>
                  <span className="text-sm">✨</span>
                  <span className="text-sm font-medium">
                    {isEventEnded ? 'Encerrado' : 
                     isEventCancelled ? 'Cancelado' : 
                     'Aberto'}
                  </span>
                </div>
              </div>
              
              {isOrganizer && !isEventCancelled && (
                 <button 
                   onClick={() => navigate(`/event/${eventId}/guests`)}
                   className="mt-4 w-full py-2 bg-gray-900/80 backdrop-blur border border-gray-600 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                 >
                   <Users className="w-4 h-4" />
                   Gerenciar Lista de Convidados (Portaria)
                 </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Location and time */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">{event.location}</p>
                {event.location_reference && (
                  <p className="text-gray-500 text-xs mt-1">{event.location_reference}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-white">{formatDate(event.date)}</span>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-white">{formatTime(event.time)}</span>
            </div>
          </div>

           {/* Registration Button */}
           <button 
             onClick={handleParticipation}
             disabled={isOrganizer || isEventEnded || isEventCancelled || isEventFull}
             className={`w-full py-3 rounded-full font-medium transition-colors ${getParticipationButtonStyle()}`}
           >
             {getParticipationButtonText()}
           </button>

          {/* Information section */}
          <div>
            <h3 className="text-white text-lg font-medium mb-3">Informações</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {event.description || 'Sem descrição disponível.'}
            </p>
            
            <div className="inline-block bg-gray-800 px-3 py-1 rounded-full">
              <span className="text-white text-sm">{event.skill_level || 'Diversos níveis'}</span>
            </div>
          </div>

          {/* Attributes */}
           <div className="grid grid-cols-3 gap-3">
             <div className="text-center min-w-0">
               <p className="text-gray-400 text-xs mb-1 truncate">Nível</p>
               <p className="text-white font-medium text-sm truncate">{event.skill_level || 'Iniciante'}</p>
             </div>
            <div className="text-center min-w-0">
              <p className="text-gray-400 text-xs mb-1 truncate">Gênero</p>
              <p className="text-white font-medium text-sm truncate">{event.gender || 'Todos'}</p>
            </div>
            <div className="text-center min-w-0">
              <p className="text-gray-400 text-xs mb-1 truncate">Idade</p>
              <p className="text-white font-medium text-sm truncate">{event.age_group || 'Todas'}</p>
            </div>
          </div>

          {/* Players section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="text-white text-lg font-medium">Jogadores</h3>
                <span className="text-white font-bold">
                  {event.participant_count}
                  {event.max_participants && `/${event.max_participants}`}
                </span>
              </div>
              <button 
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="text-gray-400 text-sm underline hover:text-white transition-colors"
              >
                ver todos
              </button>
            </div>

            {/* Participants horizontal scroll */}
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {participants.length > 0 ? participants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => navigate(`/profile/${participant.user_id}`)}
                  className="flex-shrink-0 text-center hover:opacity-80 transition-opacity"
                >
                  <div className="w-16 h-16 bg-gray-600 rounded-lg mb-2 flex items-center justify-center">
                    {participant.user_profile?.profile_photo_url ? (
                      <img 
                        src={participant.user_profile.profile_photo_url} 
                        alt={participant.user_profile.full_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {participant.user_profile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-xs w-16 truncate">
                    {participant.user_profile?.full_name || 'Usuário'}
                  </p>
                </button>
              )) : (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">Nenhum participante ainda</p>
                </div>
              )}
             </div>
           </div>

           {/* Comments Section */}
           <EventComments eventId={eventId || "1"} />

           {/* Replicate Event Button - only for completed events by creator */}
           {/* This would be conditionally rendered in a real implementation */}
         </div>
      </main>

      {/* Confirmation Dialog for Canceling Participation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-[rgba(3,29,36,1)] border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-center">
              Cancelar inscrição?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-center">
              Tem certeza que quer cancelar sua inscrição neste evento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="bg-transparent border-gray-500 text-white hover:bg-gray-800 rounded-full">
              Não, manter inscrição
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelParticipation}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              Sim, cancelar inscrição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventProfile;