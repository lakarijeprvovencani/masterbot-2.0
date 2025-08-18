import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
interface FeedbackFormProps {
  onFeedbackCreated: () => void;
}
type FeedbackCategory = 'Zahtev za alat' | 'Funkcionalnost' | 'Bug' | 'Generalni utisak';
const FeedbackForm = ({
  onFeedbackCreated
}: FeedbackFormProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [loading, setLoading] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const categories: FeedbackCategory[] = ['Zahtev za alat', 'Funkcionalnost', 'Bug', 'Generalni utisak'];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('feedbacks').insert({
        title,
        description,
        category: category as FeedbackCategory,
        user_id: user.id
      });
      if (error) throw error;
      toast({
        title: "Uspešno",
        description: "Vaš feedback je uspešno poslat!"
      });
      setTitle('');
      setDescription('');
      setCategory('');
      setOpen(false);
      onFeedbackCreated();
    } catch (error: any) {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri slanju feedback-a.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isMobile ? <button 
            className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg text-sm mt-0.5" 
            style={{
              background: 'linear-gradient(135deg, #4776E6, #8E54E9)',
              filter: 'brightness(1)'
            }} 
            onMouseEnter={e => {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }} 
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Dodaj Feedback
          </button> : <button className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg" style={{
        background: 'linear-gradient(135deg, #4776E6, #8E54E9)',
        filter: 'brightness(1)'
      }} onMouseEnter={e => {
        e.currentTarget.style.filter = 'brightness(1.1)';
      }} onMouseLeave={e => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}>
            <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
            Dodaj Feedback
          </button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novi Feedback</DialogTitle>
          <DialogDescription>
            Podelite vaše predloge, prijave bugova ili opšte utiske.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Naslov</Label>
            <Input id="title" placeholder="Kratak opis vašeg predloga" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Kategorija</Label>
            <Select value={category} onValueChange={value => setCategory(value as FeedbackCategory)} required>
              <SelectTrigger>
                <SelectValue placeholder="Izaberite kategoriju" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea id="description" placeholder="Detaljno opišite vaš predlog ili problem..." value={description} onChange={e => setDescription(e.target.value)} rows={4} required />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Otkaži
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Slanje...' : 'Pošalji'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default FeedbackForm;
