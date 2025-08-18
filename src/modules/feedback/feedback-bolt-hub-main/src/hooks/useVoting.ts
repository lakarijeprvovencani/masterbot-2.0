
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVotingProps {
  feedbackId: string;
  userId: string | undefined;
  initialHasVoted: boolean;
  initialVoteCount: number;
  onVoteUpdate: () => void;
}

export const useVoting = ({ feedbackId, userId, initialHasVoted, initialVoteCount, onVoteUpdate }: UseVotingProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);

  // Sinhronizuj lokalni state sa novim podacima iz baze
  useEffect(() => {
    setHasVoted(initialHasVoted);
    setVoteCount(initialVoteCount);
  }, [initialHasVoted, initialVoteCount]);

  const handleVote = async () => {
    if (!userId) {
      console.log('User not authenticated, cannot vote');
      return;
    }
    
    setLoading(true);
    console.log('Starting vote operation. Current hasVoted:', hasVoted);
    console.log('FeedbackId:', feedbackId, 'UserId:', userId);
    
    // Optimistic updates - odmah ažuriraj UI
    const previousHasVoted = hasVoted;
    const previousVoteCount = voteCount;
    
    if (hasVoted) {
      setHasVoted(false);
      setVoteCount(prev => prev - 1);
    } else {
      setHasVoted(true);
      setVoteCount(prev => prev + 1);
    }
    
    try {
      if (previousHasVoted) {
        console.log('Removing vote for feedback:', feedbackId, 'user:', userId);
        
        const { error, count } = await supabase
          .from('votes')
          .delete({ count: 'exact' })
          .eq('feedback_id', feedbackId)
          .eq('user_id', userId);

        console.log('Delete operation result - error:', error, 'count:', count);

        if (error) {
          console.error('Delete vote error:', error);
          // Revert optimistic update
          setHasVoted(previousHasVoted);
          setVoteCount(previousVoteCount);
          throw error;
        }
        
        if (count === 0) {
          console.log('No votes were deleted, this might indicate the vote was already removed');
          // Ne revertuj optimistic update jer možda je vote već uklonjen
        }
        
        console.log('Vote removed successfully from database, deleted count:', count);
        
        toast({
          title: "Glas uklonjen",
          description: "Uspešno ste uklonili glas."
        });
      } else {
        console.log('Adding vote for feedback:', feedbackId, 'user:', userId);
        const { error } = await supabase
          .from('votes')
          .insert({
            feedback_id: feedbackId,
            user_id: userId
          });

        if (error) {
          console.error('Insert vote error:', error);
          
          if (error.code === '23505') {
            console.log('Vote already exists (duplicate), treating as success');
            toast({
              title: "Uspešno ste glasali",
              description: "Vaš glas je već registrovan."
            });
          } else {
            // Revert optimistic update
            setHasVoted(previousHasVoted);
            setVoteCount(previousVoteCount);
            throw error;
          }
        } else {
          console.log('Vote added successfully to database');
          
          toast({
            title: "Uspešno ste glasali",
            description: "Vaš glas je uspešno dodat."
          });
        }
      }
      
      console.log('Calling onVoteUpdate to refresh data');
      onVoteUpdate();
    } catch (error: any) {
      console.error('Vote operation failed:', error);
      
      toast({
        title: "Greška",
        description: "Došlo je do greške pri glasanju.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleVote, loading, hasVoted, voteCount };
};
