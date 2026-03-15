import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import riffLogoFull from "@/assets/riff-logo-full.png";

export default function CollaboratePage() {
  const navigate = useNavigate();

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Riff - Plataforma de Esportes',
        text: 'Conheça o Riff, a melhor plataforma para encontrar eventos esportivos!',
        url: window.location.origin,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin);
      // You could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      {/* Header */}
      <header className="flex items-center p-6 border-b border-[rgba(119,136,143,0.3)]">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-white hover:text-[rgba(241,216,110,1)] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Colabore</h1>
      </header>

      {/* Content */}
      <div className="px-6 py-8 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={riffLogoFull} 
            alt="Riff Sports Logo" 
            className="w-80 h-auto object-contain"
          />
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Como ajudar:</h2>
            
            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                Se quiser colaborar, o melhor jeito é utilizando a plataforma e divulgando para amigos e conhecidos que gostam ou querem praticar algum tipo de esporte, fomentando nossa comunidade.
              </p>
              
              <p>
                Se gostaria de ajudar financeiramente o projeto temos essa vaquinha para ajudar o desenvolvimento.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-8">
            <Button
              onClick={() => window.open('https://www.kickante.com.br', '_blank')}
              className="w-full bg-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.8)] text-[rgba(3,29,36,1)] font-medium py-4 text-lg rounded-full transition-colors"
            >
              Acesse a vaquinha
            </Button>
            
            <div className="text-center">
              <span className="text-gray-300 text-lg">OU, </span>
              <button
                onClick={handleShareApp}
                className="text-gray-300 text-lg underline hover:text-white transition-colors"
              >
                compartilhe o app
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}