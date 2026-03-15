import React, { useState } from "react";
import { ArrowLeft, MoreVertical, UserPlus, Edit, Star, Trophy, MessageCircle, Coffee, MapPin, AccessibilityIcon, Users, Flag, Home } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserSports } from "@/hooks/useUserSports";
import { UserSportsManager } from "@/components/user-sports-manager";
import { Loader2 } from "lucide-react";

const UserProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { id: paramUserId } = useParams();
  
  // Determine if viewing own profile or another user's profile
  const isCurrentUserProfile = !paramUserId || paramUserId === 'current';
  const targetUserId = isCurrentUserProfile ? undefined : paramUserId;
  
  const { profile, loading, error } = useUserProfile(targetUserId);
  const { userSports, allSports, loading: sportsLoading, addSport, removeSport } = useUserSports(
    isCurrentUserProfile ? user?.id : paramUserId
  );
  const [activeTab, setActiveTab] = useState<"mapa" | "buscar" | "eventos">("eventos");

  
  // Determine if this is the user's own profile
  const isOwnProfile = isCurrentUserProfile && user && profile?.user_id === user.id;

  const handleBack = () => {
    navigate('/dashboard');
  };

  const showUnderDevelopment = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

  const formatMemberSince = (dateString: string) => {
    if (!dateString) return 'out. de 2025'; // Fallback
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'out. de 2025'; // Fallback
    
    return date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Loading state
  if (loading || sportsLoading) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-text" />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
        <div className="p-6 text-center">
          <p className="text-dashboard-text/70">
            {error || "Perfil não encontrado"}
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

  // Count praise tags for display - mapping to actual tags from evaluations
  const praiseCounts = {
    habilidoso: profile.praise_tags?.filter(tag => tag === 'habilidoso').length || 0,
    comunicativo: profile.praise_tags?.filter(tag => tag === 'comunicativo').length || 0,
    trabalho_equipe: profile.praise_tags?.filter(tag => tag === 'trabalho_equipe').length || 0,
    amigavel: profile.praise_tags?.filter(tag => tag === 'amigavel').length || 0,
    esforcado: profile.praise_tags?.filter(tag => tag === 'esforcado').length || 0,
  };

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto pb-28">
      <main className="relative">
        {/* Header with navigation */}
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex items-center">
              <button 
                onClick={handleBack}
                className="w-10 h-10 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-md hover:bg-black/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-white font-medium ml-3 text-lg">{profile.full_name}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={showUnderDevelopment}
                className="p-2 bg-black/20 rounded-full backdrop-blur-sm"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
              {!isOwnProfile && (
                <button 
                  onClick={showUnderDevelopment}
                  className="w-10 h-10 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-md hover:bg-black/50 transition-colors"
                >
                  <UserPlus className="w-5 h-5 text-white" />
                </button>
              )}
              {isOwnProfile && (
                <button 
                  onClick={() => navigate('/profile/edit')}
                  className="w-10 h-10 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-md hover:bg-black/50 transition-colors"
                >
                  <Edit className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Hero background with profile */}
          <div className="relative h-72 bg-gradient-to-b from-[rgba(241,216,110,0.15)] to-[rgba(3,29,36,1)]">
            
            {/* Profile photo */}
            <div className="absolute -bottom-8 left-6">
              <div className="w-32 h-32 bg-[rgba(255,255,255,0.05)] rounded-full border-4 border-[rgba(3,29,36,1)] flex items-center justify-center overflow-hidden shadow-xl backdrop-blur-xl">
                {profile.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {getInitials(profile.full_name)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-12 space-y-8">
          <div className="flex items-center justify-between glass-card p-4 rounded-3xl">
            <div className="flex items-center space-x-2">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Vizinho desde</span>
              <span className="text-white font-bold">{formatMemberSince(profile.created_at)}</span>
            </div>
            {profile.total_reviews_received !== undefined && profile.total_reviews_received > 0 && (
              <div className="flex items-center gap-1.5 bg-[rgba(241,216,110,0.1)] py-1.5 px-3 rounded-full">
                <Star className="w-4 h-4 text-[rgba(241,216,110,1)] fill-[rgba(241,216,110,1)]" />
                <span className="text-[rgba(241,216,110,1)] text-xs font-bold uppercase tracking-wider">
                  Avaliado {profile.total_reviews_received}x
                </span>
              </div>
            )}
          </div>

          {/* User Sports - Replacing the old Interests section */}
          <UserSportsManager
            userSports={userSports}
            allSports={allSports}
            isOwnProfile={!!isOwnProfile}
            onAddSport={addSport}
            onRemoveSport={removeSport}
          />

          {/* Activity stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center">
              <span className="text-white text-3xl font-black mb-1 text-[rgba(241,216,110,1)]">{profile.events_participated}</span>
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Jogos Participados</span>
            </div>
            <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center">
              <span className="text-white text-3xl font-black mb-1">{profile.events_created}</span>
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Organizações</span>
            </div>
          </div>

          {/* Bio / Locality */}
          <div className="space-y-3">
              {(profile.block_number || profile.apt_number) && (
                <div className="flex items-center text-white/70 text-sm glass-card p-4 rounded-2xl justify-center">
                  <Home className="w-5 h-5 mr-3 text-[rgba(241,216,110,1)]" />
                  <span className="text-lg font-bold text-white">
                    {[
                      profile.block_number ? `Bloco/Torre ${profile.block_number}` : '',
                      profile.apt_number ? `Apt ${profile.apt_number}` : ''
                    ].filter(Boolean).join(' - ')}
                  </span>
                </div>
              )}
          </div>

          {/* Social Tags (Interesses do Condomínio) */}
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
              Interesses no Condomínio
              {isOwnProfile && <button onClick={showUnderDevelopment} className="text-[rgba(241,216,110,1)]"><Edit className="w-4 h-4"/></button>}
            </h3>
            <div className="flex flex-wrap gap-2">
               <span className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full text-white/80 text-xs font-semibold">🐶 Pai/Mãe de Pet</span>
               <span className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full text-white/80 text-xs font-semibold">🥩 Churrasco</span>
               <span className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full text-white/80 text-xs font-semibold">🎲 Boardgames</span>
               <span className="px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full text-white/80 text-xs font-semibold">☕ Café</span>
            </div>
          </div>

          {/* Elogios (Badges Positivas) */}
          <div className="glass-card p-5 rounded-3xl">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Medalhas & Elogios</h3>
            <div className="grid grid-cols-5 gap-3 w-full">
              <button
                onClick={showUnderDevelopment}
                className="flex flex-col items-center group relative cursor-help"
              >
                <div className="relative w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-[rgba(241,216,110,0.1)] transition-colors">
                  <Trophy className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  {praiseCounts.habilidoso > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-[0_0_10px_rgba(241,216,110,0.5)]">
                      {praiseCounts.habilidoso}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-2">Craque</span>
              </button>
              <button
                onClick={showUnderDevelopment}
                className="flex flex-col items-center group relative cursor-help"
              >
                <div className="relative w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-[rgba(241,216,110,0.1)] transition-colors">
                  <MessageCircle className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  {praiseCounts.comunicativo > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-[0_0_10px_rgba(241,216,110,0.5)]">
                      {praiseCounts.comunicativo}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-2">Broder</span>
              </button>
              <button
                onClick={showUnderDevelopment}
                className="flex flex-col items-center group relative cursor-help"
              >
                <div className="relative w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-[rgba(241,216,110,0.1)] transition-colors">
                  <Users className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  {praiseCounts.trabalho_equipe > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-[0_0_10px_rgba(241,216,110,0.5)]">
                      {praiseCounts.trabalho_equipe}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-2">Equipe</span>
              </button>
              <button
                onClick={showUnderDevelopment}
                className="flex flex-col items-center group relative cursor-help"
              >
                <div className="relative w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-[rgba(241,216,110,0.1)] transition-colors">
                  <Coffee className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  {praiseCounts.amigavel > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-[0_0_10px_rgba(241,216,110,0.5)]">
                      {praiseCounts.amigavel}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-2">Resenha</span>
              </button>
              <button
                onClick={showUnderDevelopment}
                className="flex flex-col items-center group relative cursor-help"
              >
                <div className="relative w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center group-hover:bg-[rgba(241,216,110,0.1)] transition-colors">
                  <Flag className="w-6 h-6 text-[rgba(241,216,110,1)]" />
                  {praiseCounts.esforcado > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[rgba(241,216,110,1)] text-[#031d24] text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-[0_0_10px_rgba(241,216,110,0.5)]">
                      {praiseCounts.esforcado}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mt-2">Focado</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;