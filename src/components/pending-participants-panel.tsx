import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PendingParticipant {
  user_id: string;
  full_name: string;
  profile_photo_url?: string;
  city?: string;
}

interface PendingParticipantsPanelProps {
  eventId: string;
  pendingParticipants: PendingParticipant[];
  onUpdate: () => void;
}

export function PendingParticipantsPanel({ 
  eventId, 
  pendingParticipants, 
  onUpdate 
}: PendingParticipantsPanelProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (participantId: string) => {
    setProcessing(participantId);
    try {
      const { error } = await supabase.rpc('approve_participant', {
        p_event_id: eventId,
        p_participant_id: participantId
      });

      if (error) throw error;

      toast({
        title: "Participação aprovada",
        description: "Participante aprovado com sucesso!",
      });

      onUpdate();
    } catch (error) {
      console.error('Error approving participant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a participação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (participantId: string) => {
    setProcessing(participantId);
    try {
      const { error } = await supabase.rpc('reject_participant', {
        p_event_id: eventId,
        p_participant_id: participantId
      });

      if (error) throw error;

      toast({
        title: "Participação rejeitada",
        description: "Solicitação rejeitada.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error rejecting participant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a participação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (pendingParticipants.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-white text-lg font-semibold mb-4">
        Solicitações Pendentes ({pendingParticipants.length})
      </h3>
      <div className="space-y-3">
        {pendingParticipants.map((participant) => (
          <div 
            key={participant.user_id}
            className="bg-[rgba(42,69,78,1)] rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={participant.profile_photo_url} alt={participant.full_name} />
                <AvatarFallback className="bg-[rgba(119,136,143,1)] text-white">
                  {getInitials(participant.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium">{participant.full_name}</p>
                {participant.city && (
                  <p className="text-[rgba(119,136,143,1)] text-sm">{participant.city}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(participant.user_id)}
                disabled={processing === participant.user_id}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {processing === participant.user_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={() => handleReject(participant.user_id)}
                disabled={processing === participant.user_id}
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                {processing === participant.user_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
