
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Filter, Lightbulb, Bug, Wrench, MessageSquare } from 'lucide-react';

type FeedbackCategory = 'Zahtev za alat' | 'Funkcionalnost' | 'Bug' | 'Generalni utisak';

interface SidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: { [key: string]: number };
}

const Sidebar = ({ selectedCategory, onCategoryChange, categoryCounts }: SidebarProps) => {
  const categoryIcons = {
    'Zahtev za alat': Wrench,
    'Funkcionalnost': Lightbulb,
    'Bug': Bug,
    'Generalni utisak': MessageSquare
  };

  const categories: { key: string; label: string; icon?: any }[] = [
    { key: 'all', label: 'Sve kategorije', icon: Home },
    { key: 'Zahtev za alat', label: 'Zahtevi za alate', icon: Wrench },
    { key: 'Funkcionalnost', label: 'Funkcionalnosti', icon: Lightbulb },
    { key: 'Bug', label: 'Bug prijave', icon: Bug },
    { key: 'Generalni utisak', label: 'Opšti utisci', icon: MessageSquare }
  ];

  return (
    <div className="w-64 dark-sidebar p-6 h-full">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Kategorije</h2>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = category.key === 'all' 
              ? Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
              : categoryCounts[category.key] || 0;
            
            return (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? "default" : "ghost"}
                className={`w-full justify-between text-left h-auto py-3 px-4 transition-all duration-300 ${
                  selectedCategory === category.key 
                    ? 'gradient-button text-white hover:gradient-button-hover shadow-lg' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                }`}
                onClick={() => onCategoryChange(category.key)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{category.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-black/20 text-white border-white/20">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
