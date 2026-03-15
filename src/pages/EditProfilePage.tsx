import React, { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    city: "",
    gender: "",
    birthDate: "",
    blockNumber: "",
    aptNumber: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        gender: profile.gender || "",
        birthDate: profile.birth_date || "",
        blockNumber: profile.block_number || "",
        aptNumber: profile.apt_number || "",
      });
    }
  }, [profile]);

  const handleBack = () => {
    navigate("/profile/current");
  };

  const handleSave = async () => {
    try {
      const result = await updateProfile({
        full_name: profileData.fullName,
        phone: profileData.phone,
        city: profileData.city,
        gender: profileData.gender,
        birth_date: profileData.birthDate,
        block_number: profileData.blockNumber,
        apt_number: profileData.aptNumber,
      });
      
      if (result?.success) {
        // O toast de sucesso já é mostrado pelo hook useProfile
        navigate("/profile/current");
      } else {
        // Só mostra toast de erro se não foi mostrado pelo hook
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível atualizar o perfil. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        <h1 className="text-white text-xl font-semibold">Editar Perfil</h1>
      </header>

      <div className="p-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center">
              {profile?.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profileData.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[rgba(241,216,110,1)] rounded-full flex items-center justify-center">
              <Camera className="w-4 h-4 text-black" />
            </button>
          </div>
          <button className="text-[rgba(241,216,110,1)] text-sm">
            Alterar foto do perfil
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-white">Nome completo</Label>
            <Input
              id="full_name"
              name="full-name"
              autoComplete="name"
              value={profileData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              autoComplete="tel"
              value={profileData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-white">Cidade</Label>
            <Input
              id="city"
              name="city"
              autoComplete="address-level2"
              value={profileData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blockNumber" className="text-white">Bloco / Torre</Label>
              <Input
                id="blockNumber"
                value={profileData.blockNumber}
                onChange={(e) => handleInputChange("blockNumber", e.target.value)}
                placeholder="Ex: A, 2"
                className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="aptNumber" className="text-white">Apartamento</Label>
              <Input
                id="aptNumber"
                value={profileData.aptNumber}
                onChange={(e) => handleInputChange("aptNumber", e.target.value)}
                placeholder="Ex: 402"
                className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender" className="text-white">Gênero</Label>
            <Select value={profileData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white">
                <SelectValue placeholder="Selecione seu gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="birthDate" className="text-white">Data de nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={profileData.birthDate}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
              className="mt-1 bg-[rgba(119,136,143,0.1)] border-[rgba(119,136,143,0.3)] text-white"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            className="w-full bg-[rgba(241,216,110,1)] hover:bg-[rgba(241,216,110,0.8)] text-black py-6 text-base font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;