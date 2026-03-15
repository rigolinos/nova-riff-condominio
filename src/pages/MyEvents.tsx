import { useState, useEffect } from "react";
import { ArrowLeft, Users, MoreVertical, Filter, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useEvaluations } from "@/hooks/useEvaluations";
import { supabase } from "@/integrations/supabase/client";
import basketballCourt from "@/assets/basketball-court.jpg";

// Interface para eventos organizados pelo usuário
interface OrganizedEvent {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  image: string;
  status: string;
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
    participants: number;
    maxParticipants: number;
    image: string;
    status: string;
    indicatedBy?: string;
    evaluationStatus?: string;
  };
}

function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  const handleEvaluateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/event-evaluation/${event.id}`);
  };
  
  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-3 p-3 glass-card rounded-2xl cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-all group"
        onClick={() => navigate(`/event/${event.id}`)}
      >
        {/* Event Image */}
        <div className="flex-shrink-0 relative overflow-hidden rounded-xl">
          <img 
            src={event.image}
            alt={event.title}
            className="w-16 h-16 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-base mb-1 truncate">
            {event.title}
          </h3>
          <p className="text-[rgba(238,243,243,0.7)] text-sm mb-2 truncate">
            {event.location}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">
              {event.date} {event.time}
            </span>
            <div className="flex items-center space-x-1 text-[rgba(238,243,243,0.8)] text-sm">
              <Users className="h-4 w-4" />
              <span>{event.participants}/{event.maxParticipants}</span>
            </div>
          </div>
          
          {/* Evaluation Button */}
          {event.evaluationStatus === 'evaluation_available' && (
            <div className="mt-3">
              <Button
                onClick={handleEvaluateClick}
                size="sm"
                className="bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.8)] font-medium"
              >
                <Star className="h-4 w-4 mr-1" />
                Avaliar Evento e Jogadores
              </Button>
            </div>
          )}
        </div>
        
        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="p-1 h-auto hover:bg-[rgba(255,255,255,0.1)] rounded-full">
              <MoreVertical className="h-5 w-5 text-white/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[rgba(3,29,36,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl">
            <DropdownMenuItem 
              onClick={showUnderDevelopment}
              className="text-[rgba(238,243,243,1)] hover:bg-[rgba(119,136,143,0.3)]"
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={showUnderDevelopment}
              className="text-[rgba(238,243,243,1)] hover:bg-[rgba(119,136,143,0.3)]"
            >
              Compartilhar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Indicator for "Indicados" tab */}
      {event.indicatedBy && (
        <div className="text-right mt-1 mr-3">
          <span className="text-[rgba(238,243,243,0.6)] text-xs underline">
            {event.indicatedBy} indicou
          </span>
        </div>
      )}
    </div>
  );
}

export default function MyEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<OrganizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkEvaluationAvailability } = useEvaluations();

  useEffect(() => {
    fetchUserEvents();
    fetchOrganizedEvents();
    checkEvaluationAvailability();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          evaluation_status,
          events:event_id (
            id,
            title,
            location,
            date,
            time,
            participant_count,
            max_participants,
            image_url,
            status
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const eventsWithStatus = data?.map((ep: any) => ({
        id: ep.events.id,
        title: ep.events.title,
        location: ep.events.location,
        date: new Date(ep.events.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        time: ep.events.time.substring(0, 5),
        participants: ep.events.participant_count || 0,
        maxParticipants: ep.events.max_participants || 0,
        image: ep.events.image_url || basketballCourt,
        status: ep.events.status,
        evaluationStatus: ep.evaluation_status
      })) || [];

      setUserEvents(eventsWithStatus);
    } catch (error) {
      console.error('Erro ao buscar eventos do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizedEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const eventsData = data?.map((event: any) => ({
        id: event.id,
        title: event.title,
        location: event.location,
        date: new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        time: event.time.substring(0, 5),
        participants: event.participant_count || 0,
        maxParticipants: event.max_participants || 0,
        image: event.image_url || basketballCourt,
        status: event.status
      })) || [];

      setOrganizedEvents(eventsData);
    } catch (error) {
      console.error('Erro ao buscar eventos organizados:', error);
    }
  };

  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto relative">
      
      {/* Page Header (Glassmorphism) */}
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4 bg-[rgba(3,29,36,0.85)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-white text-xl font-bold">Minhas Reservas</h1>
          </div>
          <button 
            onClick={showUnderDevelopment}
            className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-5 pb-28">
        {/* Tabs */}
        <Tabs defaultValue="inscritos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[rgba(255,255,255,0.05)] rounded-xl mb-6 p-1 h-auto">
            <TabsTrigger 
              value="inscritos" 
              className="py-2.5 rounded-lg text-white/50 data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-black font-semibold transition-all"
            >
              Suas Visitas/Inscritos
            </TabsTrigger>
            <TabsTrigger 
              value="organizando"
              className="py-2.5 rounded-lg text-white/50 data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-black font-semibold transition-all"
            >
              Suas Organizações
            </TabsTrigger>
          </TabsList>

          {/* Inscritos Tab */}
          <TabsContent value="inscritos" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-[rgba(238,243,243,0.7)]">Carregando eventos...</p>
              </div>
            ) : (
              <>
                {/* Active Events */}
                <div className="space-y-3">
                  {userEvents.filter(e => e.status === 'active').map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                  {userEvents.filter(e => e.status === 'active').length === 0 && (
                    <p className="text-[rgba(238,243,243,0.7)] text-center py-4">
                      Nenhum evento ativo encontrado
                    </p>
                  )}
                </div>

                {/* Encerrados Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-white font-medium">Encerrados</span>
                  </div>
                  <div className="space-y-3">
                    {userEvents.filter(e => e.status === 'completed' || e.evaluationStatus === 'completed').map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                    {userEvents.filter(e => e.status === 'completed' || e.evaluationStatus === 'completed').length === 0 && (
                      <p className="text-[rgba(238,243,243,0.7)] text-center py-4">
                        Nenhum evento encerrado
                      </p>
                    )}
                  </div>
                </div>

                {/* Pausados/Cancelados Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-white font-medium">Pausados Cancelados</span>
                  </div>
                  <div className="space-y-3">
                    {userEvents.filter(e => e.status === 'cancelled' || e.status === 'paused').map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                    {userEvents.filter(e => e.status === 'cancelled' || e.status === 'paused').length === 0 && (
                      <p className="text-[rgba(238,243,243,0.7)] text-center py-4">
                        Nenhum evento pausado/cancelado
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Organizando Tab */}
          <TabsContent value="organizando" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {loading ? (
              <div className="text-center py-8 text-white/50">Carregando eventos...</div>
            ) : (
              <div className="space-y-3">
                {organizedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
                {organizedEvents.length === 0 && (
                  <div className="glass-card p-8 rounded-3xl text-center">
                    <p className="text-white/60 mb-2 font-medium">Você ainda não tem reservas.</p>
                    <button onClick={() => navigate('/create-event')} className="text-[#F1D86E] text-sm font-bold mt-2">Fazer Reserva Agora</button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}