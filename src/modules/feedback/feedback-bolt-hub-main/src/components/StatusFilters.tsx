
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle } from 'lucide-react';

type FeedbackStatus = 'U razmatranju' | 'U izradi' | 'Gotovo';

interface StatusFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusCounts: { [key: string]: number };
}

const StatusFilters = ({ selectedStatus, onStatusChange, statusCounts }: StatusFiltersProps) => {
  const statuses: { key: string; label: string; icon?: any }[] = [
    { key: 'all', label: 'Svi statusi' },
    { key: 'U razmatranju', label: 'U razmatranju', icon: Clock },
    { key: 'U izradi', label: 'U izradi', icon: Play },
    { key: 'Gotovo', label: 'Gotovo', icon: CheckCircle }
  ];

  return (
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 min-w-max px-1">
          {statuses.map((status) => {
            const Icon = status.icon;
            const count = status.key === 'all' 
              ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
              : statusCounts[status.key] || 0;
            
            return (
              <Button
                key={status.key}
                variant={selectedStatus === status.key ? "default" : "outline"}
                className={`flex items-center gap-2 whitespace-nowrap transition-all duration-300 text-sm md:text-base px-3 py-2 md:px-4 md:py-2 flex-shrink-0 ${
                  selectedStatus === status.key 
                    ? 'gradient-button text-white hover:gradient-button-hover border-none shadow-lg' 
                    : 'bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                }`}
                onClick={() => onStatusChange(status.key)}
              >
                {Icon && <Icon className="h-3 w-3 md:h-4 md:w-4" />}
                <span className="text-xs md:text-sm">{status.label}</span>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-black/20 text-white border-white/20 px-1.5 py-0.5"
                >
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

export default StatusFilters;
