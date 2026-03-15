import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  MapPin, 
  Users, 
  Star, 
  MessageCircle, 
  AlertTriangle,
  Clock,
  CheckCircle,
  UserPlus,
  Check,
  X
} from 'lucide-react';
import { Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onUpdate?: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onUpdate }: NotificationItemProps) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_join':
        return <UserPlus className="w-5 h-5 text-green-400" />;
      case 'event_reminder':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'event_update':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'event_cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'new_review':
        return <Star className="w-5 h-5 text-yellow-400" />;
      case 'evaluation_reminder':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'new_comment':
        return <MessageCircle className="w-5 h-5 text-purple-400" />;
      case 'spots_available':
        return <Users className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type and data
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'event_join':
      case 'event_reminder':
      case 'event_update':
      case 'event_cancelled':
      case 'evaluation_reminder':
      case 'new_comment':
      case 'spots_available':
        if (data.event_id) {
          navigate(`/event/${data.event_id}`);
        }
        break;
      case 'new_review':
        navigate('/profile/current');
        break;
      default:
        // Generic notification, stay on notifications page
        break;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessing(true);

    try {
      const data = notification.data || {};
      const { error } = await supabase.rpc('approve_participant', {
        p_event_id: data.event_id,
        p_participant_id: data.participant_id
      });

      if (error) throw error;

      toast({
        title: "Participação aprovada",
        description: `${data.participant_name} foi aprovado para participar do evento.`,
      });

      // Mark notification as read and refresh
      if (onMarkAsRead) onMarkAsRead(notification.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving participant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a participação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessing(true);

    try {
      const data = notification.data || {};
      const { error } = await supabase.rpc('reject_participant', {
        p_event_id: data.event_id,
        p_participant_id: data.participant_id
      });

      if (error) throw error;

      toast({
        title: "Participação rejeitada",
        description: `A solicitação de ${data.participant_name} foi rejeitada.`,
      });

      // Mark notification as read and refresh
      if (onMarkAsRead) onMarkAsRead(notification.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting participant:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a participação.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div 
      className={`p-4 border-b border-gray-600 cursor-pointer transition-colors hover:bg-gray-800/30 ${
        !notification.read ? 'bg-blue-900/20 border-l-4 border-l-blue-400' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-white' : 'text-gray-300'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-300' : 'text-gray-400'
              }`}>
                {notification.message}
              </p>
            </div>
            
            {/* Timestamp */}
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formatDate(notification.created_at)}
            </span>
          </div>

          {/* Unread indicator */}
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
          )}

          {/* Action buttons for participation requests */}
          {notification.type === 'participation_request' && (
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleApprove}
                disabled={processing}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Aceitar
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing}
                size="sm"
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-1" />
                Recusar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}