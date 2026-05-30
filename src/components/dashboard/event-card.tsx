import { Calendar, MapPin, Users, Star, X, Check, Pause, ArrowRight, LocateFixed, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { generateEventCover, getEventCoverUrl } from "@/utils/eventCoverGenerator";

export interface EventData {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  image: string;
  coverImageUrl?: string;
  category?: string;
  sport?: string;
  customSportName?: string;
  status?: "inscrito" | "encerrado" | "cancelado" | "pausado";
  participants?: number;
  maxParticipants?: number;
  rating?: number;
  distance?: string;
  skillLevel?: string;
  userEvaluationStatus?: string;
}

interface EventCardProps {
  event: EventData;
  onAction?: (eventId: string, action: string) => void;
}

// This function is now replaced by the event cover generator

const getParticipantBadgeColor = (current: number, max?: number): string => {
  if (!max) return "bg-white/10 text-emerald-300 border-emerald-400/40";
  
  const ratio = current / max;
  if (ratio < 0.5) return "bg-white/10 text-emerald-300 border-emerald-400/40";
  if (ratio < 0.8) return "bg-white/10 text-amber-300 border-amber-400/40";
  return "bg-white/10 text-red-300 border-red-400/40";
};

export function EventCard({ event, onAction }: EventCardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "inscrito":
        return <Check className="h-4 w-4" />;
      case "cancelado":
        return <X className="h-4 w-4" />;
      case "pausado":
        return <Pause className="h-4 w-4" />;
      case "encerrado":
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inscrito":
        return "text-emerald-400";
      case "encerrado":
        return "text-dashboard-accent";
      case "cancelado":
        return "text-destructive";
      case "pausado":
        return "text-orange-400";
      default:
        return "text-dashboard-text";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "inscrito":
        return "Inscrito";
      case "encerrado":
        return "Encerrado";
      case "cancelado":
        return "Cancelado";
      case "pausado":
        return "Pausado";
      default:
        return "";
    }
  };

  const handleActionClick = async (action: string) => {
    setIsLoading(true);
    try {
      await onAction?.(event.id, action);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButton = () => {
    // Event has ended - show evaluation button if evaluation is available
    if (event.status === "encerrado") {
      const isEvaluationAvailable = event.userEvaluationStatus === "evaluation_available";
      const isAlreadyEvaluated = event.userEvaluationStatus === "evaluated";
      
      if (isAlreadyEvaluated) {
        return (
          <Button 
            size="sm" 
            variant="outline"
            disabled
            className="text-dashboard-text/50 border-dashboard-border/50 bg-dashboard/50"
          >
            <Check className="h-3 w-3 mr-1" />
            Avaliado
          </Button>
        );
      }
      
      if (isEvaluationAvailable) {
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="text-dashboard-text border-dashboard-border hover:bg-dashboard-card-bg bg-dashboard/80"
            onClick={() => handleActionClick("avaliar")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Star className="h-3 w-3 mr-1" />
            )}
            Avaliar
          </Button>
        );
      }
      
      return null;
    }
    
    // User is registered for this event
    if (event.status === "inscrito") {
      return (
        <Button 
          size="sm"
          variant="ghost"
          className="text-red-400 border border-red-400/50 hover:bg-red-400/10 hover:border-red-400"
          onClick={() => handleActionClick("cancelar")}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : null}
          Cancelar
        </Button>
      );
    }
    
    // Event is available for inscription
    if (!event.status) {
      return (
        <Button 
          size="sm"
          className="bg-[rgba(119,136,143,1)] text-white hover:bg-[rgba(119,136,143,0.8)] transition-all duration-200"
          onClick={() => handleActionClick("inscrever")}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <>
              Me inscrever
              <ArrowRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      );
    }
    
    return null;
  };

  const handleCardClick = () => {
    navigate(`/event/${event.id}`);
  };

  const shouldUseGeneratedCover = !getEventCoverUrl(event.coverImageUrl, event.sport, event.customSportName);
  const coverImage = getEventCoverUrl(event.coverImageUrl, event.sport, event.customSportName) || event.image;

  return (
    <div 
      className="w-full bg-dashboard-card rounded-[1.5rem] overflow-hidden relative group cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(241,216,110,0.15)] transition-all duration-500 hover:-translate-y-1.5 border border-white/5"
      onClick={handleCardClick}
    >
      {/* Background Image or Generated Cover */}
      <div className="h-56 relative overflow-hidden">
        {shouldUseGeneratedCover ? (
          <>
            {generateEventCover(event.sport, event.customSportName)}
            <div className="absolute inset-0 bg-gradient-to-t from-[#031d24]/95 via-[#031d24]/60 to-transparent transition-opacity duration-300" />
          </>
        ) : (
          <>
            <div 
              className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url(${coverImage})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031d24] via-[#031d24]/60 to-transparent/30" />
          </>
        )}
        
        {/* Content Container */}
        <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
          {/* Top Section - Status or Participant Badge */}
          <div className="flex justify-between items-start">
            {event.status ? (
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg ${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
                <span className="text-xs font-semibold tracking-wide uppercase">
                  {getStatusText(event.status)}
                </span>
              </div>
            ) : (
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${getParticipantBadgeColor(event.participants || 0, event.maxParticipants)}`}>
                <Users className="h-3.5 w-3.5 mr-1.5 stroke-[2.5]" />
                {event.participants || 0}
                {event.maxParticipants && `/${event.maxParticipants}`}
              </div>
            )}
          </div>

          {/* Bottom Section - Main Content */}
          <div className="space-y-3.5">
            {/* Title */}
            <h3 className="text-white font-extrabold text-[22px] leading-tight drop-shadow-md">
              {event.title}
            </h3>
            
            {/* Date and Time - New Glassmorphism Layout */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 shadow-inner w-fit">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[rgba(241,216,110,1)]" />
                <span className="text-white font-semibold text-sm tracking-wide">{event.date}</span>
              </div>
              <div className="h-3.5 w-[1px] bg-white/20"></div>
              <span className="text-white font-semibold text-sm tracking-wide">{event.time}</span>
            </div>

            {/* Event Info Tags */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/95 bg-black/30 backdrop-blur-md border border-white/5 rounded-lg px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-white/70" />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </div>
              
              {event.distance && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-lg px-3 py-1.5">
                  <LocateFixed className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">{event.distance}</span>
                </div>
              )}
              
              {event.skillLevel && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/95 bg-black/30 backdrop-blur-md border border-white/5 rounded-lg px-3 py-1.5">
                  <Trophy className="h-3.5 w-3.5 text-white/70" />
                  <span className="truncate">{event.skillLevel}</span>
                </div>
              )}
            </div>

            {/* Action Button - Floating styling */}
            <div onClick={(e) => e.stopPropagation()} className="absolute bottom-5 right-5">
              {getActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}