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
                className="p-2.5 bg-white/10 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg group"
              >
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
              </button>
              {/* Edit button - only for event organizer and non-cancelled events */}
              {isOrganizer && !isEventCancelled && (
                <button 
                  onClick={() => navigate(`/event/${eventId}/edit`)}
                  className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-semibold tracking-wide">Editar</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={showUnderDevelopment}
                className="p-2.5 bg-black/20 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all shadow-lg"
                aria-label="Compartilhar evento"
              >
                <Share2 className="w-4 h-4 text-white/90" />
              </button>
              <button 
                onClick={showUnderDevelopment}
                className="p-2.5 bg-black/20 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all shadow-lg"
              >
                <Bookmark className="w-4 h-4 text-white/90" />
              </button>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative h-[380px] w-full">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#031d24] via-[#08313b] to-[#031d24]"></div>
            )}
            
            {/* Improved Dynamic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[rgba(3,29,36,1)]"></div>
            
            {/* Photos indicator */}
            <div className="absolute top-[5.5rem] right-4 flex items-center bg-white/10 border border-white/20 shadow-lg rounded-full px-4 py-1.5 backdrop-blur-md z-10 transition-transform hover:scale-105 cursor-pointer" onClick={showUnderDevelopment}>
              <button className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-bold tracking-wide">FOTOS</span>
              </button>
            </div>

            {/* Event title overlay */}
            <div className="absolute bottom-6 left-5 right-5 z-10">
              <h2 className="text-white text-3xl font-extrabold mb-3 drop-shadow-lg leading-tight">
                {event.title}
              </h2>
              
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-col">
                  <span className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">Organizador</span>
                  <span className="text-white font-bold text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[rgba(241,216,110,1)] to-orange-400 flex items-center justify-center text-[rgba(3,29,36,1)] text-[10px] font-black">
                      {event.creator_name ? event.creator_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    {event.creator_name && event.creator_name.length > 16 
                      ? `${event.creator_name.substring(0, 16)}...` 
                      : event.creator_name}
                  </span>
                </div>
                
                <div className={`flex flex-col items-end`}>
                  <span className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">Status</span>
                  <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isEventEnded ? 'bg-white/10 text-white/80 border border-white/20' :
                    isEventCancelled ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-[rgba(241,216,110,0.15)] text-[rgba(241,216,110,1)] border border-[rgba(241,216,110,0.3)] shadow-[0_0_15px_rgba(241,216,110,0.1)]'
                  }`}>
                    {!isEventEnded && !isEventCancelled && <span className="w-1.5 h-1.5 rounded-full bg-[rgba(241,216,110,1)] animate-pulse"></span>}
                    <span>
                      {isEventEnded ? 'Encerrado' : 
                       isEventCancelled ? 'Cancelado' : 
                       'Aberto'}
                    </span>
                  </div>
                </div>
              </div>
              
              {isOrganizer && !isEventCancelled && (
                 <button 
                   onClick={() => navigate(`/event/${eventId}/guests`)}
                   className="mt-4 w-full py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20 hover:shadow-lg transition-all"
                 >
                   <Users className="w-5 h-5" />
                   Gerenciar Lista na Portaria
                 </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6 pb-24 relative z-10 -mt-4 bg-[rgba(3,29,36,1)] rounded-t-3xl min-h-[50vh]">
          {/* Location and time cards */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start space-x-3 hover:bg-white/[0.07] transition-colors">
              <div className="bg-black/30 p-2 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{event.location}</p>
                {event.location_reference && (
                  <p className="text-gray-400 text-xs mt-0.5">{event.location_reference}</p>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/[0.07] transition-colors">
              <div className="bg-black/30 p-2 rounded-xl">
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-white text-sm font-semibold">{formatDate(event.date)}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/[0.07] transition-colors">
              <div className="bg-black/30 p-2 rounded-xl">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-white text-sm font-semibold">{formatTime(event.time)}</span>
            </div>
          </div>

           {/* Registration Button */}
           <div className="pt-2">
             <button 
               onClick={handleParticipation}
               disabled={isOrganizer || isEventEnded || isEventCancelled || isEventFull}
               className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 shadow-lg flex justify-center items-center gap-2 ${getParticipationButtonStyle()}`}
             >
               {getParticipationButtonText()}
             </button>
           </div>

          {/* Information section */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-[rgba(241,216,110,1)] rounded-full"></div>
              Informações
            </h3>
            <p className="text-gray-300 text-[15px] leading-relaxed mb-5">
              {event.description || 'Sem descrição disponível.'}
            </p>
            
            {/* Attributes Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="text-center min-w-0 bg-black/20 rounded-xl py-3 px-2">
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1 truncate">Nível</p>
                <p className="text-white font-semibold text-sm truncate">{event.skill_level || 'Iniciante'}</p>
              </div>
              <div className="text-center min-w-0 bg-black/20 rounded-xl py-3 px-2">
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1 truncate">Gênero</p>
                <p className="text-white font-semibold text-sm truncate">{event.gender || 'Todos'}</p>
              </div>
              <div className="text-center min-w-0 bg-black/20 rounded-xl py-3 px-2">
                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-1 truncate">Idade</p>
                <p className="text-white font-semibold text-sm truncate">{event.age_group || 'Todas'}</p>
              </div>
            </div>
          </div>

          {/* Players section */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold flex items-center gap-2">
                 <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
                 Jogadores
              </h3>
              <div className="flex items-center gap-3">
                <div className="bg-black/30 px-3 py-1 rounded-full border border-white/5">
                  <span className="text-white font-bold text-sm">
                    {event.participant_count}
                    <span className="text-white/40">
                      {event.max_participants && `/${event.max_participants}`}
                    </span>
                  </span>
                </div>
                <button 
                  onClick={() => navigate(`/event/${eventId}/participants`)}
                  className="text-[rgba(241,216,110,1)] text-sm font-semibold hover:underline"
                >
                  ver todos
                </button>
              </div>
            </div>

            {/* Participants horizontal scroll */}
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
              {participants.length > 0 ? participants.map((participant) => (
                <button
                  key={participant.id}
                  onClick={() => navigate(`/profile/${participant.user_id}`)}
                  className="flex-shrink-0 text-center hover:opacity-80 transition-opacity w-[72px]"
                >
                  <div className="w-[72px] h-[72px] bg-gradient-to-br from-gray-700 to-gray-900 rounded-[1.2rem] mb-2.5 flex items-center justify-center p-[2px] border border-white/10 shadow-md">
                    {participant.user_profile?.profile_photo_url ? (
                      <img 
                        src={participant.user_profile.profile_photo_url} 
                        alt={participant.user_profile.full_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[rgba(241,216,110,1)] to-orange-400 flex items-center justify-center">
                        <span className="text-[rgba(3,29,36,1)] text-xl font-bold">
                          {participant.user_profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/80 text-[11px] font-medium w-full truncate px-1">
                    {participant.user_profile?.full_name?.split(' ')[0] || 'Usuário'}
                  </p>
                </button>
              )) : (
                <div className="w-full flex flex-col items-center justify-center py-6 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                  <Users className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-sm text-white/40 font-medium">Nenhum participante ainda</p>
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