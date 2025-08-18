import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import FeedbackCard from '@/components/FeedbackCard';
import FeedbackForm from '@/components/FeedbackForm';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import StatusFilters from '@/components/StatusFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Menu } from 'lucide-react';

type FeedbackCategory = 'Zahtev za alat' | 'Funkcionalnost' | 'Bug' | 'Generalni utisak';
type FeedbackStatus = 'U razmatranju' | 'U izradi' | 'Gotovo';

const Dashboard = () => {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most_voted');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const categories: FeedbackCategory[] = ['Zahtev za alat', 'Funkcionalnost', 'Bug', 'Generalni utisak'];
  const statuses: FeedbackStatus[] = ['U razmatranju', 'U izradi', 'Gotovo'];

  const fetchFeedbacks = async () => {
    try {
      // Prvo učitaj sve feedback-ove za brojanje
      const allFeedbacksQuery = supabase
        .from('feedbacks')
        .select(`
          *,
          profiles(name),
          votes(id, user_id)
        `)
        .order('created_at', {
          ascending: false
        });
      
      const {
        data: allData,
        error: allError
      } = await allFeedbacksQuery;
      
      if (allError) {
        console.error('Error fetching all feedbacks:', allError);
        throw allError;
      }

      console.log('All feedbacks data:', allData);

      // Sortiraj sve feedback-ove po glasovima
      const sortedAllData = (allData || []).sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
      setAllFeedbacks(sortedAllData);

      // Zatim učitaj filtrirane feedback-ove za prikaz
      let filteredQuery = supabase
        .from('feedbacks')
        .select(`
          *,
          profiles(name),
          votes(id, user_id)
        `);
        
      if (filterCategory !== 'all') {
        filteredQuery = filteredQuery.eq('category', filterCategory as FeedbackCategory);
      }
      if (filterStatus !== 'all') {
        filteredQuery = filteredQuery.eq('status', filterStatus as FeedbackStatus);
      }

      // Add search filter
      if (searchQuery) {
        filteredQuery = filteredQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Always order by created_at first, then sort by votes in JavaScript
      filteredQuery = filteredQuery.order('created_at', {
        ascending: false
      });
      
      const {
        data: filteredData,
        error: filteredError
      } = await filteredQuery;
      
      if (filteredError) {
        console.error('Error fetching filtered feedbacks:', filteredError);
        throw filteredError;
      }

      console.log('Filtered feedbacks data:', filteredData);

      // Always sort by vote count
      const sortedFilteredData = (filteredData || []).sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
      setFeedbacks(sortedFilteredData);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filterCategory, filterStatus, searchQuery, sortBy]);

  const getCategoryCounts = () => {
    const counts: {
      [key: string]: number;
    } = {};
    categories.forEach(category => {
      // Ako je odabran specifičan status, broji samo iz tog statusa
      const feedbacksToCount = filterStatus !== 'all' ? allFeedbacks.filter(f => f.status === filterStatus) : allFeedbacks;
      counts[category] = feedbacksToCount.filter(f => f.category === category).length;
    });
    return counts;
  };

  const getStatusCounts = () => {
    const counts: {
      [key: string]: number;
    } = {};
    statuses.forEach(status => {
      // Ako je odabrana specifična kategorija, broji samo iz te kategorije
      const feedbacksToCount = filterCategory !== 'all' ? allFeedbacks.filter(f => f.category === filterCategory) : allFeedbacks;
      counts[status] = feedbacksToCount.filter(f => f.status === status).length;
    });
    return counts;
  };

  // U embedded modu dozvoli prikaz i bez lokalne supabase sesije (čitanje je javno; dodavanje ograniceno)
  return (
    <div className="min-h-screen gradient-primary">
      <Header />
      
      <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
        {isMobile ? (
          <MobileSidebar 
            open={sidebarOpen} 
            onOpenChange={setSidebarOpen} 
            selectedCategory={filterCategory} 
            onCategoryChange={setFilterCategory} 
            categoryCounts={getCategoryCounts()} 
          />
        ) : (
          <Sidebar 
            selectedCategory={filterCategory} 
            onCategoryChange={setFilterCategory} 
            categoryCounts={getCategoryCounts()} 
          />
        )}
        
        <main className="flex-1 overflow-auto">
          <div className={`max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-8`}>
            {/* Header Section - Mobile Optimized */}
            <div className="mb-4 md:mb-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 md:mb-6 space-y-4 md:space-y-0">
                <div className="flex-1">
                  {isMobile && (
                    <div className="flex justify-between items-center mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSidebarOpen(true)} 
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                      >
                        <Menu className="h-4 w-4 mr-2" />
                        Kategorije
                      </Button>
                      {user && <FeedbackForm onFeedbackCreated={fetchFeedbacks} />}
                    </div>
                  )}
                  <div className="hidden md:block mobile-hero-content backdrop-blur-sm bg-white/5 rounded-xl p-4 md:p-0 md:bg-transparent md:backdrop-blur-none">
                    <h1 className="hidden md:block text-xl md:text-3xl font-bold text-white mb-2 text-center md:text-left">Masterbot Hub</h1>
                    <p className="text-white/90 text-sm md:text-base text-center md:text-left leading-relaxed max-w-md md:max-w-none mx-auto md:mx-0">
                      Podelite vaše ideje i glasajte za predloge koji vam se sviđaju
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex justify-center md:justify-end md:ml-4">
                  {user && <FeedbackForm onFeedbackCreated={fetchFeedbacks} />}
                </div>
              </div>

              {/* Search - Mobile Optimized */}
              <div className="flex gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200 z-20 drop-shadow-lg" />
                  <Input 
                    placeholder="Pretražite feedback..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-sm md:text-base" 
                  />
                </div>
              </div>

              {/* Status Filters */}
              <StatusFilters 
                selectedStatus={filterStatus} 
                onStatusChange={setFilterStatus} 
                statusCounts={getStatusCounts()} 
              />
            </div>

            {/* Feedback List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/40"></div>
                <p className="text-white/80 mt-4">Učitavanje...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-12">
                <div className="gradient-card rounded-lg p-6 md:p-8">
                  <h3 className="text-lg font-medium text-white mb-2">Nema rezultata</h3>
                  <p className="text-white/80 mb-4 text-sm md:text-base">
                    {searchQuery ? 'Nema feedback-a koji odgovara vašoj pretrazi.' : 'Nema feedback-a za prikaz.'}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery('')} 
                      className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                    >
                      Obriši pretragu
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.map((feedback) => (
                  <FeedbackCard 
                    key={feedback.id} 
                    feedback={feedback} 
                    onVoteUpdate={fetchFeedbacks} 
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
