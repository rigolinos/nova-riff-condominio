import { useState, useEffect } from "react";
import { Plus, Users, Dumbbell, Waves, Grip, ChevronRight, Activity, CalendarPlus, Bell, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RegistrationSuccessModal } from "@/components/registration-success-modal";
import { Header } from "@/components/dashboard/header";
import { EventSection } from "@/components/dashboard/event-section";
import { EventData } from "@/components/dashboard/event-card";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useAmenityStore } from "@/store/amenityStore";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import soccerField from "@/assets/soccer-field.jpg";

// Helper function to pick icon based on amenity name/type
const getIconForAmenity = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('academia') || n.includes('fitness')) return Dumbbell;
  if (n.includes('piscina') || n.includes('clube')) return Waves;
  if (n.includes('quadra') || n.includes('society')) return Activity;
  return Grip;
};

// Helper function to pick color based on amenity status
const getColorForAmenityStatus = (status: string) => {
  if (status === 'Livre') return "bg-emerald-500/10 text-emerald-500 text-emerald-400";
  if (status === 'Ocupado') return "bg-blue-500/10 text-blue-500 text-blue-400";
  if (status === 'Lotado') return "bg-red-500/10 text-red-500 text-red-400";
  return "bg-orange-500/10 text-orange-500 text-orange-400";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { joinEvent } = useEvents(); // Separated for clarity
  const { amenities, fetchAmenities, checkIn, checkOut, loading: amenitiesLoading } = useAmenityStore();
  const { requests, fetchRequests, loading: matchmakingLoading } = useMatchmakingStore();
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successEventData, setSuccessEventData] = useState<any>(null);

  // Redirect to login if not authenticated 
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch initial data based on user's condominium
  useEffect(() => {
    if (user?.user_metadata?.condominium_id) {
      fetchAmenities(user.user_metadata.condominium_id);
      fetchRequests(user.user_metadata.condominium_id);
    }
  }, [user, fetchAmenities, fetchRequests]);

  // Convert real events to EventData format
  const convertToEventData = (events: any[]): EventData[] => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      location: event.location,
      date: new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      time: event.time,
      image: soccerField,
      coverImageUrl: event.image_url,
      sport: event.sports?.name,
      customSportName: event.custom_sport_name,
      participants: event.participant_count || 0,
      maxParticipants: event.max_participants,
      status: event.status === 'completed' ? 'encerrado' : undefined,
      distance: "No seu condomínio", 
      skillLevel: event.skill_level || "Amigável"
    }));
  };

  const handleEventAction = async (eventId: string, action: string) => {
    if (action === "inscrever") {
      const result = await joinEvent(eventId);
      if (result.success) {
        setSuccessEventData(result.eventData);
        setShowSuccessModal(true);
      } else {
        toast.error(result.error || "Erro ao se inscrever");
      }
    } else if (action === "avaliar") {
      navigate(`/event/${eventId}`);
    }
  };

  const renderContent = () => {
    if (authLoading || eventsLoading || amenitiesLoading || (matchmakingLoading && requests.length === 0)) {
      return (
        <div className="flex items-center justify-center h-96 text-[rgba(238,243,243,1)]">
          <p className="text-xl animate-pulse">Carregando Condomínio...</p>
        </div>
      );
    }

    const eventData = convertToEventData(events);
    const availableEvents = eventData.filter(event => event.status !== 'encerrado');
    
    // Find next event created by user
    const rawMyNextEvent = events.find(e => e.created_by === user?.id && e.status !== 'completed');
    const myNextEventData = rawMyNextEvent ? eventData.find(e => e.id === rawMyNextEvent.id) : null;

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* Welcome Hero - Clean Design */}
        <section className="bg-gradient-to-br from-[rgba(241,216,110,0.15)] to-transparent p-6 rounded-3xl border border-[rgba(241,216,110,0.2)] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Vizinho'}! 👋
            </h2>
            <p className="text-white/70 text-sm">
              Bloco {user?.user_metadata?.block_number || 'A'} • Apto {user?.user_metadata?.apt_number || '000'}
            </p>
          </div>
        </section>

        {/* Quick Actions (Row) */}
        <section className="flex justify-between items-start gap-2">
          <button onClick={() => navigate("/create-event")} className="flex flex-col items-center gap-2 group w-1/4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[rgba(241,216,110,1)] group-hover:bg-[rgba(241,216,110,0.1)] group-hover:border-[rgba(241,216,110,0.3)] transition-all">
              <CalendarPlus size={24} />
            </div>
            <span className="text-white/80 text-xs font-medium text-center leading-tight">Reservar<br/>Espaço</span>
          </button>
          
          <button onClick={() => navigate("/my-events")} className="flex flex-col items-center gap-2 group w-1/4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-blue-400 group-hover:bg-blue-400/10 group-hover:border-blue-400/30 transition-all">
              <Users size={24} />
            </div>
            <span className="text-white/80 text-xs font-medium text-center leading-tight">Minhas<br/>Visitas</span>
          </button>

          <button onClick={() => toast.info('Em Breve: Mural do Síndico')} className="flex flex-col items-center gap-2 group w-1/4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400/10 group-hover:border-emerald-400/30 transition-all">
              <Bell size={24} />
            </div>
            <span className="text-white/80 text-xs font-medium text-center leading-tight">Avisos do<br/>Prédio</span>
          </button>

          <button onClick={() => navigate('/matchmaking')} className="flex flex-col items-center gap-2 group w-1/4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-orange-400 group-hover:bg-orange-400/10 group-hover:border-orange-400/30 transition-all">
              <Dumbbell size={24} />
            </div>
            <span className="text-white/80 text-xs font-medium text-center leading-tight">Tô<br/>Disponível</span>
          </button>
        </section>

        {/* My Next Reservations Highlight */}
        {myNextEventData && (
          <section className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-5 relative overflow-hidden group cursor-pointer hover:border-[rgba(241,216,110,0.3)] transition-all" onClick={() => navigate(`/event/${myNextEventData.id}`)}>
             <div className="absolute top-0 left-0 w-1 h-full bg-[rgba(241,216,110,1)]"></div>
             <p className="text-[rgba(241,216,110,1)] text-[10px] font-bold uppercase tracking-wider mb-2">Sua Próxima Reserva</p>
             <h3 className="text-white font-bold text-lg mb-1">{myNextEventData.title}</h3>
             <div className="flex items-center text-white/60 text-xs mt-3 gap-4">
                <div className="flex items-center gap-1"><CalendarIcon size={14} /> {myNextEventData.date}</div>
                <div className="flex items-center gap-1"><Clock size={14} /> {myNextEventData.time.substring(0,5)}</div>
                <div className="flex items-center gap-1"><MapPin size={14} /> {myNextEventData.location}</div>
             </div>
             <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-white/80 transition-colors" size={20} />
          </section>
        )}

        {/* Feed em Abas (Glassmorphism) */}
        <section>
          <Tabs defaultValue="areas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[rgba(255,255,255,0.05)] text-white/60 rounded-xl mb-6 p-1">
              <TabsTrigger value="areas" className="data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-black rounded-lg font-semibold">Áreas Comuns</TabsTrigger>
              <TabsTrigger value="eventos" className="data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-black rounded-lg font-semibold">Acontecendo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="areas" className="animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-3">
                {amenities.map(amenity => {
                  const Icon = getIconForAmenity(amenity.name);
                  const statusColorClass = getColorForAmenityStatus(amenity.status || 'Livre');
                  const bgClass = statusColorClass.split(' ')[0]; // extract bg-...
                  const textClass = statusColorClass.split(' ')[1]; // extract text-...
                  const badgeClass = statusColorClass.split(' ')[2]; // extract active text-...

                  return (
                    <div 
                      key={amenity.id} 
                      onClick={() => navigate('/amenities')}
                      className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors group relative overflow-hidden backdrop-blur-md"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${bgClass} ${textClass}`}>
                        <Icon size={20} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-white text-sm font-bold mb-1 leading-tight">{amenity.name}</h4>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-white/50 text-xs flex items-center gap-1">
                          <Users size={12} /> {amenity.occupancy}/{amenity.capacity || '∞'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                          {amenity.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="eventos" className="animate-in fade-in slide-in-from-bottom-2">
              {availableEvents.length > 0 ? (
                <div className="space-y-4">
                  <EventSection
                    title=""
                    events={availableEvents.slice(0, 5)}
                    onSeeAll={() => navigate('/events')}
                    onEventAction={handleEventAction}
                  />
                  <div className="text-center pt-2">
                    <button onClick={() => navigate('/events')} className="text-[rgba(241,216,110,1)] text-xs font-bold uppercase tracking-wider hover:underline">
                      Ver Todos os Eventos
                    </button>
                  </div>
                </div>
              ) : (
                <section className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-8 text-center backdrop-blur-md">
                  <div className="w-16 h-16 bg-[rgba(241,216,110,0.1)] rounded-full flex items-center justify-center mx-auto mb-4 text-[rgba(241,216,110,1)]">
                    <CalendarIcon size={32} />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2">Nenhum evento rolando</h3>
                  <p className="text-white/60 text-sm mb-6 max-w-[250px] mx-auto">
                    A galera tá desanimada hoje. Seja o primeiro a reservar uma quadra!
                  </p>
                  <button onClick={() => navigate("/create-event")} className="text-black font-bold text-sm bg-[rgba(241,216,110,1)] px-6 py-3 rounded-full hover:bg-[rgba(241,216,110,0.9)] transition-colors">
                    Fazer Reserva Agora
                  </button>
                </section>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto relative overflow-hidden font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-5 pb-24">
        {renderContent()}
      </main>

      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        eventTitle={successEventData?.title || ""}
        eventDate={successEventData?.date ? new Date(successEventData.date).toLocaleDateString('pt-BR') : ""}
        eventTime={successEventData?.time || ""}
        eventLocation={successEventData?.location || ""}
      />
    </div>
  );
};

export default Dashboard;