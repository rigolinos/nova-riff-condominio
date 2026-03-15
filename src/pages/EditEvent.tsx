import React, { useState, useEffect } from "react";
import { ArrowLeft, Camera, ChevronDown, UserMinus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEventDetails } from "@/hooks/useEventDetails";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const EditEvent = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const { toast } = useToast();
  const { event, participants, loading, error } = useEventDetails(eventId || "");
  
  const [eventData, setEventData] = useState({
    title: "",
    location: "",
    location_reference: "",
    date: "",
    time: "",
    description: "",
    age_group: "",
    gender: "",
    skill_level: "",
    max_participants: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Pre-fill form when event data loads
  useEffect(() => {
    if (event) {
      setEventData({
        title: event.title || "",
        location: event.location || "",
        location_reference: event.location_reference || "",
        date: event.date || "",
        time: event.time || "",
        description: event.description || "",
        age_group: event.age_group || "Todas",
        gender: event.gender || "Todos",
        skill_level: event.skill_level || "Iniciante",
        max_participants: event.max_participants?.toString() || ""
      });
      setImagePreview(event.image_url || "");
    }
  }, [event]);

  const handleBack = () => {
    navigate(`/event/${eventId}`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${eventId}-${Date.now()}.${fileExt}`;
      
      // First, create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage
        .from('event-images')
        .list('', { limit: 1 });
      
      if (bucketError && bucketError.message.includes('not found')) {
        await supabase.storage.createBucket('event-images', { public: true });
      }

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!event) return;
    
    setSaving(true);
    try {
      let imageUrl = event.image_url;
      
      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload da imagem.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      // Update event in database
      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          location: eventData.location,
          location_reference: eventData.location_reference,
          date: eventData.date,
          time: eventData.time,
          description: eventData.description,
          age_group: eventData.age_group,
          gender: eventData.gender,
          skill_level: eventData.skill_level,
          max_participants: eventData.max_participants ? parseInt(eventData.max_participants) : null,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Evento atualizado com sucesso.",
      });
      
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar evento.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePauseEvent = async () => {
    if (!event) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'paused' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Evento pausado",
        description: "O evento foi pausado com sucesso.",
      });
      
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error pausing event:', error);
      toast({
        title: "Erro",
        description: "Erro ao pausar evento.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Evento cancelado",
        description: "O evento foi cancelado com sucesso.",
      });
      
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar evento.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Participante removido",
        description: "Participante removido com sucesso.",
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover participante.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-text" />
      </div>
    );
  }

  // Redirect if event is cancelled
  if ((event?.status as string) === 'cancelled') {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
        <div className="p-6 text-center">
          <p className="text-dashboard-text/70">
            Este evento foi cancelado e não pode ser editado.
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

  // Error or no event
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-lg font-medium">Editar evento</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.9)] text-[rgba(3,29,36,1)] font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 mx-4 mt-4">
          <TabsTrigger value="settings" className="text-white data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-[rgba(3,29,36,1)]">
            Configurações
          </TabsTrigger>
          <TabsTrigger value="participants" className="text-white data-[state=active]:bg-[rgba(241,216,110,1)] data-[state=active]:text-[rgba(3,29,36,1)]">
            Participantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="p-4 space-y-6">
          {/* Event Image */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Foto do evento</label>
            <div className="relative">
              <div className="w-full h-48 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Event Name */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Nome do evento</label>
            <Input
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Digite o nome do evento"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Endereço</label>
            <Textarea
              value={eventData.location}
              onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
              placeholder="Digite o endereço do evento"
            />
          </div>

          {/* Reference Point */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Ponto de referência</label>
            <Input
              value={eventData.location_reference}
              onChange={(e) => setEventData({ ...eventData, location_reference: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Ex: Próximo ao shopping"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Data</label>
              <Input
                type="date"
                value={eventData.date}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Horário</label>
              <Input
                type="time"
                value={eventData.time}
                onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={4}
              placeholder="Descreva o evento"
            />
          </div>

          {/* Event Criteria */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-medium">Critérios do evento</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Idade</label>
                <Select value={eventData.age_group} onValueChange={(value) => setEventData({ ...eventData, age_group: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    <SelectItem value="18-25">18-25</SelectItem>
                    <SelectItem value="26-35">26-35</SelectItem>
                    <SelectItem value="36+">36+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">Gênero</label>
                <Select value={eventData.gender} onValueChange={(value) => setEventData({ ...eventData, gender: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Nível</label>
              <Select value={eventData.skill_level} onValueChange={(value) => setEventData({ ...eventData, skill_level: value })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Competitivo">Competitivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Máximo de jogadores</label>
              <Input
                type="number"
                value={eventData.max_participants}
                onChange={(e) => setEventData({ ...eventData, max_participants: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Ex: 10"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                  Pausar evento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Pausar evento</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    Tem certeza que deseja pausar este evento? Os participantes serão notificados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePauseEvent} className="bg-yellow-600 hover:bg-yellow-700">
                    Pausar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(event.status as string) === 'cancelled' || event.status === 'completed'}
                >
                  {(event.status as string) === 'cancelled' ? 'Evento já cancelado' : 'Cancelar evento'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Cancelar evento</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    Tem certeza que deseja cancelar este evento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelEvent} className="bg-red-600 hover:bg-red-700">
                    Cancelar evento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        <TabsContent value="participants" className="p-4">
          <div className="space-y-4">
            <h3 className="text-white text-lg font-medium">
              Participantes ({participants.length})
            </h3>
            
            {participants.length > 0 ? (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        {participant.user_profile?.profile_photo_url ? (
                          <img 
                            src={participant.user_profile.profile_photo_url} 
                            alt={participant.user_profile.full_name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {participant.user_profile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                          </span>
                        )}
                      </div>
                      <span className="text-white font-medium">
                        {participant.user_profile?.full_name || 'Usuário'}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Remover participante</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Tem certeza que deseja remover {participant.user_profile?.full_name} do evento?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveParticipant(participant.user_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Nenhum participante inscrito ainda</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditEvent;