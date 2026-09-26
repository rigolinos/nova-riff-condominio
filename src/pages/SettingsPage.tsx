import React, { useState } from "react";
import { ArrowLeft, User, Settings, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      
      toast({
        title: "Conta excluída",
        description: "Seus dados foram removidos com sucesso.",
      });
      // Auth change will trigger redirect to /
      await signOut();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a conta. Contate o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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
        {/* Delete Account Button */}
        <div className="pt-8">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full bg-red-500/10 hover:bg-red-500/20 rounded-lg p-4 flex items-center space-x-4 transition-colors border border-red-500/20"
          >
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-red-400 font-medium">Excluir Conta</h3>
              <p className="text-red-400/70 text-sm">Apagar todos os seus dados</p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-500/50" />
          </button>
        </div>
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

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[rgba(3,29,36,0.98)] border-red-500/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">Excluir Conta Permanentemente</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Esta ação é irreversível. Todos os seus dados pessoais, histórico de eventos e reservas serão removidos permanentemente para cumprimento da LGPD. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="bg-[rgba(119,136,143,0.1)] text-white border-[rgba(119,136,143,0.3)] hover:bg-[rgba(119,136,143,0.2)]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Sim, Excluir Minha Conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;