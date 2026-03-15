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
  if (!max) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  
  const ratio = current / max;
  if (ratio < 0.5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (ratio < 0.8) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
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
      className="w-full bg-dashboard-card rounded-xl overflow-hidden relative group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      {/* Background Image or Generated Cover */}
      <div className="h-48 relative overflow-hidden">
        {shouldUseGeneratedCover ? (
          <>
            {generateEventCover(event.sport, event.customSportName)}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </>
        ) : (
          <>
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${coverImage})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
          </>
        )}
        
        {/* Content Container */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          {/* Top Section - Status or Participant Badge */}
          <div className="flex justify-between items-start">
            {event.status ? (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm ${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
                <span className="text-xs font-medium">
                  {getStatusText(event.status)}
                </span>
              </div>
            ) : (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getParticipantBadgeColor(event.participants || 0, event.maxParticipants)}`}>
                <Users className="h-3 w-3 mr-1" />
                {event.participants || 0}
                {event.maxParticipants && `/${event.maxParticipants}`}
              </div>
            )}
          </div>

          {/* Bottom Section - Main Content */}
          <div className="space-y-3">
            {/* Date and Time - Prominent Display */}
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <Calendar className="h-4 w-4 text-white flex-shrink-0" />
              <span className="text-white font-semibold text-sm">{event.date}</span>
              <div className="h-3 w-px bg-white/40"></div>
              <span className="text-white font-semibold text-sm">{event.time}</span>
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
              {event.title}
            </h3>
            
            {/* Event Details */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-white/90 bg-black/20 backdrop-blur-sm rounded-md px-2.5 py-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[140px]">{event.location}</span>
              </div>
              
              {event.distance && (
                <div className="flex items-center gap-1.5 text-sm text-emerald-300 bg-emerald-500/20 backdrop-blur-sm rounded-md px-2.5 py-1 border border-emerald-400/30">
                  <LocateFixed className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{event.distance}</span>
                </div>
              )}
              
              {event.skillLevel && (
                <div className="flex items-center gap-1.5 text-sm text-white/90 bg-black/20 backdrop-blur-sm rounded-md px-2.5 py-1">
                  <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{event.skillLevel}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
              {getActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}