import { useState, useEffect } from "react";
import { MessageCircle, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { sanitizeComment, validateComment } from "@/lib/security";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  parent_comment_id?: string;
  user_name?: string;
}

interface EventCommentsProps {
  eventId: string;
}

export function EventComments({ eventId }: EventCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          comment_text,
          created_at,
          user_id,
          parent_comment_id
        `)
        .eq('event_id', eventId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles for the comments using secure function
      const userIds = [...new Set(data?.map(comment => comment.user_id) || [])];
      const profiles: Array<{user_id: string, full_name: string}> = [];
      
      if (userIds.length > 0) {
        // Use the secure function to get public profile data
        for (const userId of userIds) {
          const { data: profile } = await supabase.rpc('get_public_profile', { target_user_id: userId });
          if (profile && profile.length > 0) {
            profiles.push({
              user_id: profile[0].user_id,
              full_name: profile[0].full_name
            });
          }
        }
      }

      const commentsWithNames = data?.map(comment => ({
        ...comment,
        user_name: profiles?.find(p => p.user_id === comment.user_id)?.full_name || 'Usuário'
      })) || [];

      setComments(commentsWithNames);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comentários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const postComment = async () => {
    if (!user || !newComment.trim()) return;

    // **SECURITY: Validate and sanitize comment input**
    const validation = validateComment(newComment);
    if (!validation.isValid) {
      toast({
        title: "Erro de validação",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    const sanitizedComment = sanitizeComment(newComment);
    if (!sanitizedComment) {
      toast({
        title: "Erro",
        description: "Comentário inválido após sanitização",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({
          event_id: eventId,
          user_id: user.id,
          comment_text: sanitizedComment
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível postar o comentário",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-[rgba(119,136,143,0.1)] rounded-lg p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Mural de Comentários
        </h3>
        <div className="text-[rgba(238,243,243,0.7)]">Carregando comentários...</div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(119,136,143,0.1)] rounded-lg p-6">
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        Mural de Comentários
      </h3>

      {/* Comment Form */}
      {user && (
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Faça uma pergunta ou deixe um comentário..."
            className="bg-[rgba(3,29,36,0.5)] border-[rgba(119,136,143,0.3)] text-white placeholder:text-[rgba(238,243,243,0.5)] mb-3 resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={postComment}
              disabled={!newComment.trim() || posting}
              className="bg-[rgba(241,216,110,1)] text-[rgba(3,29,36,1)] hover:bg-[rgba(241,216,110,0.9)] px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              {posting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-[rgba(238,243,243,0.7)] py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum comentário ainda.</p>
            <p className="text-sm">Seja o primeiro a fazer uma pergunta!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-[rgba(241,216,110,0.3)] pl-4 py-2">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-[rgba(241,216,110,0.2)] rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-[rgba(241,216,110,1)]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{comment.user_name}</p>
                  <p className="text-[rgba(238,243,243,0.5)] text-xs">{formatDate(comment.created_at)}</p>
                </div>
              </div>
              <p className="text-[rgba(238,243,243,0.9)] ml-11 leading-relaxed">
                {sanitizeComment(comment.comment_text)}
              </p>
            </div>
          ))
        )}
      </div>

      {!user && (
        <div className="text-center text-[rgba(238,243,243,0.7)] py-4">
          <p>Faça login para participar da conversa</p>
        </div>
      )}
    </div>
  );
}