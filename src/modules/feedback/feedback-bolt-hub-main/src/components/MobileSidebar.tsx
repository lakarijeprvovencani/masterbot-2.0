
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Lightbulb, Bug, Wrench, MessageSquare, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

type FeedbackCategory = 'Zahtev za alat' | 'Funkcionalnost' | 'Bug' | 'Generalni utisak';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: { [key: string]: number };
}

const MobileSidebar = ({ 
  open, 
  onOpenChange, 
  selectedCategory, 
  onCategoryChange, 
  categoryCounts 
}: MobileSidebarProps) => {
  const categories: { key: string; label: string; icon?: any }[] = [
    { key: 'all', label: 'Sve kategorije', icon: Home },
    { key: 'Zahtev za alat', label: 'Zahtevi za alate', icon: Wrench },
    { key: 'Funkcionalnost', label: 'Funkcionalnosti', icon: Lightbulb },
    { key: 'Bug', label: 'Bug prijave', icon: Bug },
    { key: 'Generalni utisak', label: 'Opšti utisci', icon: MessageSquare }
  ];

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] bg-gradient-to-b from-[#3b2f86] to-[#040A3E] border-white/20">
        <DrawerHeader className="border-b border-white/20 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white text-lg font-semibold">
              Kategorije
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="p-6 space-y-3 overflow-y-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = category.key === 'all' 
              ? Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
              : categoryCounts[category.key] || 0;
            
            return (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? "default" : "ghost"}
                className={`w-full justify-between text-left h-auto py-4 px-4 transition-all duration-300 ${
                  selectedCategory === category.key 
                    ? 'gradient-button text-white hover:gradient-button-hover shadow-lg' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                }`}
                onClick={() => handleCategorySelect(category.key)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-base">{category.label}</span>
                </div>
                <Badge variant="secondary" className="text-sm bg-black/20 text-white border-white/20">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileSidebar;
