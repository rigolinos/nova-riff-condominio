import React, { useState } from "react";
import { ArrowLeft, MoreVertical, CheckCheck, Loader2, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/NotificationItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    getFilteredNotifications,
    refreshNotifications
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const handleBack = () => {
    navigate("/dashboard");
  };

  const filteredNotifications = getFilteredNotifications(activeFilter);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-text" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
        <header className="flex items-center p-6 border-b border-[rgba(119,136,143,0.3)]">
          <button
            onClick={handleBack}
            className="mr-4 text-white hover:text-[rgba(241,216,110,1)] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl font-semibold">Notificações</h1>
        </header>
        <div className="p-6 text-center">
          <p className="text-dashboard-text/70">Erro ao carregar notificações: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(3,29,36,1)] max-w-[480px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-[rgba(119,136,143,0.3)]">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-white hover:text-[rgba(241,216,110,1)] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl font-semibold">Notificações</h1>
        </div>
        
        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
            title="Marcar todas como lidas"
          >
            <CheckCheck className="w-5 h-5" />
            <span className="text-sm">Marcar todas</span>
          </button>
        )}
      </header>

      {/* Tabs Navigation */}
      <div className="px-6 pt-4">
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "unread")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto mb-6">
            <TabsTrigger 
              value="all" 
              className="text-[rgba(238,243,243,0.6)] data-[state=active]:text-[rgba(241,216,110,1)] data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-[rgba(241,216,110,1)] rounded-none pb-2 bg-transparent"
            >
              Tudo
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="text-[rgba(238,243,243,0.6)] data-[state=active]:text-[rgba(241,216,110,1)] data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-[rgba(241,216,110,1)] rounded-none pb-2 bg-transparent"
            >
              Não lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - All Notifications */}
          <TabsContent value="all" className="mt-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center py-12">
                <div className="w-16 h-16 bg-[rgba(119,136,143,0.2)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-[rgba(238,243,243,0.5)]" />
                </div>
                <p className="text-[rgba(238,243,243,0.6)] text-base">
                  Nenhuma notificação ainda
                </p>
              </div>
            ) : (
              <div className="pb-6">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onUpdate={refreshNotifications}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab Content - Unread Notifications */}
          <TabsContent value="unread" className="mt-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center py-12">
                <div className="w-16 h-16 bg-[rgba(119,136,143,0.2)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellOff className="h-8 w-8 text-[rgba(238,243,243,0.5)]" />
                </div>
                <p className="text-[rgba(238,243,243,0.6)] text-base">
                  Nenhuma notificação não lida
                </p>
              </div>
            ) : (
              <div className="pb-6">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onUpdate={refreshNotifications}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationsPage;