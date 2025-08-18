
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';

interface VoteButtonProps {
  hasVoted: boolean;
  voteCount: number;
  loading: boolean;
  onVote: () => void;
}

const VoteButton = ({ hasVoted, voteCount, loading, onVote }: VoteButtonProps) => {
  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={onVote}
      disabled={loading}
      className={`flex flex-col items-center gap-1 px-3 py-2 h-auto min-w-[60px] transition-all duration-300 ${
        hasVoted 
          ? 'gradient-button text-white hover:gradient-button-hover border-none shadow-lg' 
          : 'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/40'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''} ${loading ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-semibold">{loading ? '...' : voteCount}</span>
    </Button>
  );
};

export default VoteButton;
