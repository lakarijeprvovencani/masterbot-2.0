import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
const Header = () => {
  const { user, signOut } = useAuth();
  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };
  return <header className="bg-gradient-to-r from-[#040A3E] via-[#0A1B5C] to-[#1A2B7A] shadow-xl border-b border-blue-800/30 sticky top-0 z-40">
      <div className="w-full px-4 md:px-6">
        <div className="flex justify-between items-center h-14 md:h-16 w-full">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="rounded-lg p-1.5 md:p-2 bg-white/10">
              <img src="/logo.png" alt="Masterbot Hub Logo" className="h-8 w-8 md:h-10 md:w-10 object-contain" onLoad={() => console.log('Logo loaded successfully from /logo.png')} onError={e => {
              console.log('Logo failed to load from:', e.currentTarget.src);
              console.log('Trying lovable-uploads fallback...');
              // Try the lovable-uploads version as fallback
              e.currentTarget.src = '/lovable-uploads/ccf601ce-35da-4d14-8cce-bdbf99f14b2f.png';
            }} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Masterbot Hub</h1>
              <p className="text-xs text-blue-200 hidden md:block"></p>
            </div>
          </div>

          {/* U embedded modu sakrij profil/odjavu ako nema korisnika iz spoljne app */}
          {user && <div className="flex-shrink-0 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-all duration-200 border border-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="User avatar" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-medium">
                        {getUserInitials(user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-white">Profil</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A2B7A] border border-blue-600/50 shadow-2xl rounded-lg min-w-[180px] p-2 backdrop-blur-sm">
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200">
                    <div className="bg-red-500/20 rounded-full p-1">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Odjavi se</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>}
        </div>
      </div>
    </header>;
};
export default Header;