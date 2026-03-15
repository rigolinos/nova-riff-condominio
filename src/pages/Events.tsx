import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/dashboard/header";
import { EventSection } from "@/components/dashboard/event-section";
import { EventFiltersImproved, ActiveFilters } from "@/components/event-filters-improved";
import { EventData } from "@/components/dashboard/event-card";
import { useEvents } from "@/hooks/useEvents";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function Events() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");
  const { events, loading, error, joinEvent, leaveEvent } = useEvents();
  const { toast } = useToast();
  const { requireAuth } = useAuthAction();
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ sports: [], dates: [] });

  // Transform events to EventData format with participation logic
  const transformedEvents: EventData[] = events.map(event => {
    let eventStatus: EventData['status'] = undefined;
    
    // Determine event status based on event state and user participation
    if (event.status === "cancelled") {
      eventStatus = "cancelado";
    } else if (event.status === "completed") {
      eventStatus = "encerrado";
    } else if (event.status === "paused") {
      eventStatus = "pausado";
    } else if (event.is_participant) {
      eventStatus = "inscrito";
    }
    
    return {
      id: event.id,
      title: event.title,
      location: event.location,
      date: event.date,
      time: event.time,
      image: event.image_url || "/src/assets/soccer-field.jpg",
      status: eventStatus,
      participants: event.participant_count || 0,
      maxParticipants: event.max_participants,
      rating: undefined,
      distance: "a 2km de você", // Mock distance - will be calculated with geolocation later
      skillLevel: event.skill_level || "Iniciante",
      userEvaluationStatus: event.user_evaluation_status
    };
  });

  // Categorize events into different sections
  const availableEvents = transformedEvents.filter(event => 
    // Events available for inscription (excluding finished/cancelled)
    (!event.status || event.status === "pausado") && 
    event.status !== "inscrito" &&
    event.status !== "encerrado" &&
    event.status !== "cancelado"
  );
  
  const userEvents = transformedEvents.filter(event => 
    event.status === "inscrito" // Events user is registered for
  );
  
  // Finished events should NOT be shown in /events page
  // They will only appear in /my-events if user was inscribed
  const finishedEvents = transformedEvents.filter(event => 
    event.status === "encerrado" || event.status === "cancelado" // Finished/cancelled events
  );

  // Apply filters only to available events with multi-select support
  const filteredAvailableEvents = availableEvents.filter(event => {
    // Sport filter (multi-select)
    if (activeFilters.sports.length > 0) {
      const eventSport = event.sport || event.customSportName || "outros";
      const normalizedEventSport = eventSport.toLowerCase();
      
      const matchesSport = activeFilters.sports.some(filterSport => {
        const normalizedFilter = filterSport.toLowerCase();
        
        // If filter is "outros", check if event doesn't have registered sport
        if (normalizedFilter === "outros") {
          return !event.sport || event.customSportName;
        }
        
        // Otherwise check if sport matches
        return normalizedEventSport.includes(normalizedFilter);
      });
      
      if (!matchesSport) return false;
    }
    
    // Date filter (multi-select) - Note: Would require actual date parsing in production
    // For now, we're keeping it simple
    if (activeFilters.dates.length > 0) {
      // TODO: Implement actual date filtering logic
      // This would parse event.date and check against selected date ranges
    }
    
    return true;
  });
  
  const handleEventAction = async (eventId: string, action: string) => {
    const executeAction = async () => {
      if (action === "inscrever") {
        const result = await joinEvent(eventId);
        if (result.success) {
          toast({
            title: "Sucesso!",
            description: "Você se inscreveu no evento.",
          });
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao se inscrever no evento.",
            variant: "destructive",
          });
        }
      } else if (action === "cancelar") {
        const result = await leaveEvent(eventId);
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
      } else if (action === "avaliar") {
        navigate(`/event/${eventId}/evaluation`);
      }
    };

    requireAuth(executeAction, "Você precisa estar logado para interagir com eventos.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard max-w-[480px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-text" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard max-w-[480px] mx-auto">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-6 text-center">
          <p className="text-dashboard-text/70">Erro ao carregar eventos: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard max-w-[480px] mx-auto">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="p-6 space-y-6">
        {/* Improved Filters with Multi-Selection and Apply Button */}
        <EventFiltersImproved
          onApplyFilters={setActiveFilters}
          onClearFilters={() => setActiveFilters({ sports: [], dates: [] })}
        />

        <div className="space-y-8">
        {/* Available Events Section */}
        <EventSection
          title="Eventos Disponíveis"
          events={filteredAvailableEvents}
          onSeeAll={() => {}} 
          onEventAction={handleEventAction}
        />

        {/* User Registered Events Section */}
        {userEvents.length > 0 && (
          <EventSection
            title="Eventos Inscritos"
            events={userEvents}
            onSeeAll={() => {}} 
            onEventAction={handleEventAction}
          />
        )}

        {/* Finished/Cancelled Events removed from /events page */}
        {/* They will only appear in /my-events if user was inscribed */}

        {/* Enhanced Empty State */}
        {filteredAvailableEvents.length === 0 && userEvents.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 bg-dashboard-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-dashboard-accent" />
            </div>
            <h3 className="text-2xl font-semibold text-dashboard-text mb-3">
              Nenhum evento ainda
            </h3>
            <p className="text-dashboard-text/70 mb-8 leading-relaxed">
              Seja o primeiro a organizar um evento esportivo em sua região!
            </p>
            <button
              onClick={() => navigate("/create-event")}
              className="bg-dashboard-accent text-dashboard hover:bg-dashboard-accent/90 px-8 py-3 rounded-full font-semibold transition-all duration-300 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Criar o primeiro evento!</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Floating Action Button with Shadow */}
      <button
        onClick={() => requireAuth(() => navigate("/create-event"), "Você precisa estar logado para criar eventos.")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-dashboard-accent hover:bg-dashboard-accent/90 text-dashboard rounded-full shadow-[0_4px_12px_rgba(241,216,110,0.4)] hover:shadow-[0_6px_16px_rgba(241,216,110,0.5)] transition-all duration-300 flex items-center justify-center group z-50"
        aria-label="Criar novo evento"
      >
        <Plus className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
      </button>
    </div>
  );
}

export default Events;