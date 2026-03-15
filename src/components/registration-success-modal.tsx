import { CheckCircle, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
}

export function RegistrationSuccessModal({ 
  isOpen, 
  onClose, 
  eventTitle, 
  eventDate, 
  eventTime, 
  eventLocation 
}: RegistrationSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)] text-white max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Inscrição Confirmada!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-[rgba(238,243,243,0.8)] text-sm mb-4">
              Você se inscreveu com sucesso no evento:
            </p>
            <h3 className="text-[rgba(241,216,110,1)] font-semibold text-lg mb-6">
              {eventTitle}
            </h3>
          </div>

          {/* Event details */}
          <div className="space-y-3 bg-[rgba(119,136,143,0.1)] p-4 rounded-lg">
            {eventDate && (
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-[rgba(238,243,243,0.7)]" />
                <span className="text-[rgba(238,243,243,0.9)] text-sm">{eventDate}</span>
              </div>
            )}
            {eventTime && (
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-[rgba(238,243,243,0.7)]" />
                <span className="text-[rgba(238,243,243,0.9)] text-sm">{eventTime}</span>
              </div>
            )}
            {eventLocation && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-[rgba(238,243,243,0.7)]" />
                <span className="text-[rgba(238,243,243,0.9)] text-sm">{eventLocation}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[rgba(238,243,243,0.7)] text-sm">
            Você receberá notificações sobre atualizações do evento
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={onClose}
            className="bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.9)] px-8"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}