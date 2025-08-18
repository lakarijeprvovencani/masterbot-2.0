
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminControlsProps {
  feedbackId: string;
  currentStatus: string;
  onUpdate: () => void;
}

type FeedbackStatus = 'U razmatranju' | 'U izradi' | 'Gotovo';

const AdminControls = ({ feedbackId, currentStatus, onUpdate }: AdminControlsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const statuses: FeedbackStatus[] = ['U razmatranju', 'U izradi', 'Gotovo'];

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (newStatus === currentStatus) return;
    
    setLoading(true);
    console.log('Changing status for feedback:', feedbackId, 'from', currentStatus, 'to', newStatus);
    
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .update({ status: newStatus })
        .eq('id', feedbackId)
        .select();

      if (error) {
        console.error('Error updating feedback status:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from update operation');
        throw new Error('Feedback nije pronađen ili nemate dozvolu za ažuriranje');
      }

      console.log('Status updated successfully:', data);
      toast({
        title: "Status ažuriran",
        description: `Status je promenjen na "${newStatus}"`
      });
      
      // Immediately refresh the data to show the updated status
      onUpdate();
    } catch (error: any) {
      console.error('Status update failed:', error);
      
      let errorMessage = "Došlo je do greške pri ažuriranju statusa.";
      
      if (error.message?.includes('permission')) {
        errorMessage = "Nemate dozvolu za ažuriranje ovog feedback-a.";
      } else if (error.message?.includes('not found')) {
        errorMessage = "Feedback nije pronađen.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Greška",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    console.log('Deleting feedback:', feedbackId);
    
    try {
      // Prvo obriši sve glasove za ovaj feedback
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('feedback_id', feedbackId);

      if (votesError) {
        console.error('Error deleting votes:', votesError);
        throw votesError;
      }

      // Zatim obriši feedback
      const { error: feedbackError } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', feedbackId);

      if (feedbackError) {
        console.error('Error deleting feedback:', feedbackError);
        throw feedbackError;
      }

      console.log('Feedback deleted successfully');
      toast({
        title: "Feedback obrisan",
        description: "Feedback je uspešno obrisan."
      });
      
      onUpdate();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju feedback-a.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
      <Settings className="h-4 w-4 text-yellow-400" />
      <span className="text-xs text-yellow-400 font-medium">ADMIN</span>
      
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
        <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status} className="text-xs">
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 px-2"
            disabled={deleteLoading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Da li ste sigurni da želite da obrišete ovaj feedback? Ova akcija se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Brisanje...' : 'Obriši'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminControls;
