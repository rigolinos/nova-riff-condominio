import React, { useState } from "react";
import { ArrowLeft, User, Settings, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleAppSettings = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve!",
      duration: 3000,
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const settingsOptions = [
    {
      icon: User,
      title: "Editar Perfil",
      description: "Altere suas informações pessoais",
      onClick: handleEditProfile,
    },
    {
      icon: Settings,
      title: "Configurações do App",
      description: "Notificações, privacidade e preferências",
      onClick: handleAppSettings,
    },
  ];

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      {/* Header */}
      <header className="flex items-center p-6 border-b border-[rgba(119,136,143,0.3)]">
        <button
          onClick={handleBack}
          className="mr-4 text-white hover:text-[rgba(241,216,110,1)] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-semibold">Configurações</h1>
      </header>

      {/* Settings Options */}
      <div className="p-6 space-y-4">
        {settingsOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.onClick}
            className="w-full bg-[rgba(119,136,143,0.1)] hover:bg-[rgba(119,136,143,0.2)] rounded-lg p-4 flex items-center space-x-4 transition-colors"
          >
            <div className="w-12 h-12 bg-[rgba(241,216,110,0.2)] rounded-full flex items-center justify-center">
              <option.icon className="w-6 h-6 text-[rgba(241,216,110,1)]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">{option.title}</h3>
              <p className="text-gray-400 text-sm">{option.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
        
        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="w-full bg-[rgba(119,136,143,0.1)] hover:bg-[rgba(119,136,143,0.2)] rounded-lg p-4 flex items-center space-x-4 transition-colors"
        >
          <div className="w-12 h-12 bg-[rgba(241,216,110,0.2)] rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 text-[rgba(241,216,110,1)]" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-white font-medium">Sair da Conta</h3>
            <p className="text-gray-400 text-sm">Desconectar do aplicativo</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[rgba(3,29,36,0.98)] border-[rgba(119,136,143,0.5)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sair da Conta</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja sair da conta? Você precisará fazer login novamente para acessar o aplicativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[rgba(119,136,143,0.1)] text-white border-[rgba(119,136,143,0.3)] hover:bg-[rgba(119,136,143,0.2)]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutConfirm}
              className="bg-[rgba(241,216,110,1)] text-black hover:bg-[rgba(241,216,110,0.8)]"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;