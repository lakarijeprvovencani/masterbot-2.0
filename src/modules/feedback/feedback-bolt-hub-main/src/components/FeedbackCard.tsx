
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVoting } from '@/hooks/useVoting';
import { getStatusColor, getCategoryColor } from '@/utils/feedbackUtils';
import VoteButton from '@/components/VoteButton';
import AdminControls from '@/components/AdminControls';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackCardProps {
  feedback: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    created_at: string;
    votes: { id: string; user_id: string }[];
    profiles: { name: string } | null;
  };
  onVoteUpdate: () => void;
}

const FeedbackCard = ({ feedback, onVoteUpdate }: FeedbackCardProps) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  const initialHasVoted = feedback.votes.some(vote => vote.user_id === user?.id);
  const initialVoteCount = feedback.votes.length;

  const { handleVote, loading, hasVoted, voteCount } = useVoting({
    feedbackId: feedback.id,
    userId: user?.id,
    initialHasVoted,
    initialVoteCount,
    onVoteUpdate
  });

  // Proveri da li je korisnik admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Admin check failed:', error);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Poboljšana logika za prikaz imena korisnika
  const getUserDisplayName = () => {
    if (feedback.profiles?.name) {
      return feedback.profiles.name;
    }
    return 'Nepoznat korisnik';
  };

  return (
    <Card 
      className="w-full transition-all duration-300 rounded-xl hover:shadow-xl hover:-translate-y-1" 
      style={{
        background: 'linear-gradient(145deg, rgba(25, 30, 60, 0.8), rgba(50, 60, 100, 0.6))',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-white mb-3 leading-tight">
              {feedback.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={`${getCategoryColor(feedback.category)} text-xs font-medium`}>
                {feedback.category}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(feedback.status)} text-xs font-medium`}>
                {feedback.status}
              </Badge>
            </div>
          </div>
          <VoteButton
            hasVoted={hasVoted}
            voteCount={voteCount}
            loading={loading}
            onVote={handleVote}
          />
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
          {feedback.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{getUserDisplayName()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(feedback.created_at).toLocaleDateString('sr-RS')}</span>
          </div>
        </div>
        
        {isAdmin && (
          <AdminControls
            feedbackId={feedback.id}
            currentStatus={feedback.status}
            onUpdate={onVoteUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackCard;
