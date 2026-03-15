import React from "react";
import { X, Instagram, Facebook, MessageCircle, Link, Copy } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const EventCreatedShare = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");

  const handleClose = () => {
    navigate("/dashboard");
  };

  const handleCopyLink = async () => {
    const eventLink = `${window.location.origin}/event/${eventId}`;
    try {
      await navigator.clipboard.writeText(eventLink);
      toast({
        title: "Link copiado!",
        description: "O link do evento foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleShareInstagram = () => {
    // In a real app, this would open Instagram sharing
    toast({
      title: "Instagram",
      description: "Abrindo Instagram para compartilhar...",
    });
  };

  const handleShareFacebook = () => {
    const eventLink = `${window.location.origin}/event/${eventId}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventLink)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const eventLink = `${window.location.origin}/event/${eventId}`;
    const message = `Olá! Criei um evento esportivo e gostaria de te convidar. Confira os detalhes: ${eventLink}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-4 relative">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-800 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="flex flex-col items-center text-center pt-16">
          {/* Basketball illustration area */}
          <div className="w-80 h-80 mb-8 relative">
            <div className="w-full h-full bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-50 rounded-full flex items-center justify-center relative overflow-hidden">
              {/* Basketball court illustration */}
              <div className="absolute bottom-0 w-full h-32 bg-gray-300 rounded-b-full opacity-80"></div>
              
              {/* Basketball players silhouettes */}
              <div className="relative z-10 flex items-center justify-center space-x-8">
                {/* Player 1 */}
                <div className="relative">
                  <div className="w-12 h-16 bg-yellow-600 rounded-t-full"></div>
                  <div className="w-8 h-8 bg-yellow-700 rounded-full absolute -top-2 left-2"></div>
                  <div className="w-3 h-8 bg-yellow-700 absolute -right-1 top-4"></div>
                  <div className="text-white text-xs font-bold absolute top-2 left-4">5</div>
                </div>
                
                {/* Basketball */}
                <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-orange-600 relative -top-8"></div>
                
                {/* Player 2 */}
                <div className="relative">
                  <div className="w-12 h-16 bg-gray-600 rounded-t-full"></div>
                  <div className="w-8 h-8 bg-gray-700 rounded-full absolute -top-2 left-2"></div>
                  <div className="w-3 h-8 bg-gray-700 absolute -left-1 top-4"></div>
                </div>
              </div>
              
              {/* Basketball hoop */}
              <div className="absolute top-12 right-16">
                <div className="w-16 h-2 bg-gray-800 rounded"></div>
                <div className="w-12 h-8 border-2 border-gray-800 rounded-b-full ml-2"></div>
              </div>
              
              {/* Sparkles */}
              <div className="absolute top-20 left-16 text-yellow-400 text-2xl">✨</div>
              <div className="absolute bottom-24 right-12 text-yellow-400 text-lg">✨</div>
              <div className="absolute top-32 right-20 text-yellow-400 text-sm">✨</div>
            </div>
          </div>

          {/* Success message */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Evento criado.</h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Agora é só chamar a galera ou praticar um esporte com pessoas novas.
            </p>
          </div>

          {/* Share section */}
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-white mb-6 text-left">Compartilhe</h2>
            
            {/* Social media buttons */}
            <div className="flex justify-start space-x-4 mb-8">
              <button
                onClick={handleShareInstagram}
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Instagram className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleShareFacebook}
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Facebook className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              className="flex items-center text-white text-lg hover:text-gray-300 transition-colors"
            >
              <span className="mr-3">Copiar link do evento</span>
              <Link className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventCreatedShare;