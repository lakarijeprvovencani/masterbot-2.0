
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Create profile when user signs up or signs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (!profile && !error) {
                // Profile doesn't exist, create it
                const userName = session.user.user_metadata?.name || 
                               session.user.user_metadata?.full_name || 
                               session.user.email?.split('@')[0] || 
                               'Korisnik';
                               
                console.log('Creating profile for user:', session.user.id, 'with name:', userName);
                
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    name: userName
                  });
                
                if (insertError) {
                  console.error('Error creating profile:', insertError);
                } else {
                  console.log('Profile created successfully');
                }
              }
            } catch (error) {
              console.error('Error checking/creating profile:', error);
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Attempting signup for:', email, 'with name:', name);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
            full_name: name
          }
        }
      });
      
      console.log('Signup result:', { data, error });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          return { error: { message: 'Korisnik sa ovim email-om već postoji. Pokušajte sa prijavom.' } };
        }
        if (error.message.includes('Invalid email')) {
          return { error: { message: 'Neispravna email adresa.' } };
        }
        if (error.message.includes('Password')) {
          return { error: { message: 'Lozinka mora imati najmanje 6 karaktera.' } };
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: { message: 'Došlo je do greške prilikom registracije.' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting signin for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Signin result:', { data, error });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Neispravni podaci za prijavu. Proverite email i lozinku.' } };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Molimo potvrdite vaš email pre prijave.' } };
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { error: { message: 'Došlo je do greške prilikom prijave.' } };
    }
  };

  const signOut = async () => {
    console.log('Attempting to sign out user');
    
    try {
      // First, try to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) {
        console.error('Supabase signout error:', error);
      }
      
      console.log('Signout completed, clearing local state');
    } catch (error) {
      console.error('Unexpected signout error:', error);
    } finally {
      // Always clear local state regardless of API response
      console.log('Forcing local state reset');
      setSession(null);
      setUser(null);
      
      // Clear any local storage items that might persist
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      
      // Force redirect to auth page
      console.log('Redirecting to auth page');
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
