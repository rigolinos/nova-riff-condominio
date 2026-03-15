import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ReplicateEventButtonProps {
  eventId: string;
  eventTitle: string;
  isCreator?: boolean;
  isEventCompleted?: boolean;
}

export function ReplicateEventButton({ 
  eventId, 
  eventTitle, 
  isCreator = false, 
  isEventCompleted = false 
}: ReplicateEventButtonProps) {
  const navigate = useNavigate();

  const handleReplicateEvent = async () => {
    try {
      // Navigate to create event with pre-filled data
      // In a real implementation, this would fetch the event data and pre-fill the form
      navigate(`/create-event?replicate=${eventId}`);
      
      toast({
        title: "Replicando evento",
        description: `Criando uma cópia de "${eventTitle}" para a próxima semana`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível replicar o evento",
        variant: "destructive",
      });
    }
  };

  // Only show for creators of completed events
  if (!isCreator || !isEventCompleted) {
    return null;
  }

  return (
    <Button
      onClick={handleReplicateEvent}
      variant="outline"
      className="w-full bg-[rgba(119,136,143,0.1)] border-[rgba(241,216,110,0.5)] text-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.1)] hover:border-[rgba(241,216,110,1)]"
    >
      <Copy className="w-4 h-4 mr-2" />
      Replicar evento para próxima semana
    </Button>
  );
}