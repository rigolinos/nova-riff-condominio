import { useState, useEffect } from "react";
import { X, Star, Users, Calendar, MapPin, MoreVertical, Search as SearchIcon, Loader2 } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSearch, SearchResult } from "@/hooks/useSearch";

const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'events' | 'profiles'>('all');
  
  const { results, loading, error, searchAll, clearResults } = useSearch();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchAll(searchTerm, activeFilter);
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeFilter, searchAll, clearResults]);

  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  const clearSearch = () => {
    setSearchTerm("");
    clearResults();
  };

  const navigateToProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const navigateToEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(date));
  };

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${time}`));
  };

  const renderProfileCard = (result: SearchResult) => (
    <div 
      key={result.id} 
      className="flex items-center justify-between p-4 bg-transparent cursor-pointer hover:bg-gray-800/20 transition-colors"
      onClick={() => navigateToProfile(result.id)}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-lg bg-gray-300 overflow-hidden">
          {result.image ? (
            <img 
              src={result.image} 
              alt={result.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-white text-lg font-medium">
                {result.title?.split(' ').map(n => n[0]).join('') || '?'}
              </span>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-white text-lg font-medium">{result.title}</h3>
            {result.rating && (
              <div className="flex items-center space-x-1">
                <span className="text-white text-sm">{result.rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm">{result.subtitle}</p>
        </div>
      </div>
      <MoreVertical className="w-5 h-5 text-gray-400" />
    </div>
  );

  const renderEventCard = (result: SearchResult) => (
    <div 
      key={result.id} 
      className="flex items-center justify-between p-4 bg-transparent cursor-pointer hover:bg-gray-800/20 transition-colors"
      onClick={() => navigateToEvent(result.id)}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-lg bg-gray-300 overflow-hidden">
          {result.image ? (
            <img 
              src={result.image} 
              alt={result.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-white text-xs text-center">
                {result.title?.substring(0, 2) || 'EV'}
              </span>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-white text-lg font-medium">{result.title}</h3>
          <div className="flex items-center space-x-1 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{result.location}</span>
          </div>
          {result.date && result.time && (
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(result.date)}, {formatTime(result.time)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{result.participants} participantes</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <MoreVertical className="w-5 h-5 text-gray-400" />
    </div>
  );

  const renderResult = (result: SearchResult) => {
    switch (result.type) {
      case 'profile':
        return renderProfileCard(result);
      case 'event':
        return renderEventCard(result);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      <Header 
        activeTab="buscar" 
        onTabChange={(tab) => {
          if (tab === "eventos") {
            navigate("/events");
          } else if (tab === "mapa") {
            navigate("/dashboard");
          }
        }} 
      />
      <div className="p-4 space-y-6">
        <div className="relative">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar eventos, esportistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-full pl-12 pr-12 text-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter as (value: string) => void} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-12">
            <TabsTrigger 
              value="all" 
              className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="profiles"
              className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none"
            >
              Esportistas
            </TabsTrigger>
            <TabsTrigger 
              value="events"
              className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none"
            >
              Eventos
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Buscando...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && searchTerm && results.length === 0 && (
            <div className="text-center py-8">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
              <p className="text-gray-400">Nenhum resultado encontrado</p>
              <p className="text-gray-500 text-sm">Tente usar palavras-chave diferentes</p>
            </div>
          )}

          {!loading && !error && !searchTerm && (
            <div className="text-center py-8">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
              <p className="text-gray-400">Digite para buscar</p>
              <p className="text-gray-500 text-sm">Encontre eventos e esportistas</p>
            </div>
          )}

          <TabsContent value="all" className="mt-6">
            <div className="space-y-2">
              {results.map(renderResult)}
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="mt-6">
            <div className="space-y-2">
              {results.filter(r => r.type === 'profile').map(renderResult)}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="space-y-2">
              {results.filter(r => r.type === 'event').map(renderResult)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Search;