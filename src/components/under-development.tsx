import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UnderDevelopmentProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export function UnderDevelopment({ 
  title, 
  description = "Esta funcionalidade está sendo desenvolvida e estará disponível em breve.",
  showBackButton = true 
}: UnderDevelopmentProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-[rgba(119,136,143,0.2)] rounded-full flex items-center justify-center">
          <Construction className="w-12 h-12 text-[rgba(241,216,110,1)]" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            {description}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="text-sm text-gray-500">
            Fique ligado para novidades!
          </div>
          
          {showBackButton && (
            <Button
              onClick={() => navigate(-1)}
              className="bg-[rgba(119,136,143,1)] hover:bg-[rgba(119,136,143,0.8)] text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}