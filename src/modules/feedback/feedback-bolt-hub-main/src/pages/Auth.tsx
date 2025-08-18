import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Form submitted:', { isLogin, isPasswordReset, email, name });

    try {
      if (isPasswordReset) {
        console.log('Password reset for:', email);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        
        if (error) {
          console.error('Password reset error:', error);
          toast({
            title: "Greška",
            description: "Došlo je do greške prilikom slanja email-a za reset lozinke.",
            variant: "destructive"
          });
        } else {
          console.log('Password reset email sent');
          toast({
            title: "Email poslat",
            description: "Proverite vaš email za instrukcije za reset lozinke."
          });
          setIsPasswordReset(false);
          setIsLogin(true);
          resetForm();
        }
      } else if (isLogin) {
        console.log('Login attempt for:', email);
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          toast({
            title: "Greška pri prijavi",
            description: error.message || "Neispravni podaci za prijavu.",
            variant: "destructive"
          });
        } else {
          console.log('Login successful');
          toast({
            title: "Uspešno",
            description: "Uspešno ste se ulogovali!"
          });
          resetForm();
        }
      } else {
        console.log('Signup attempt for:', email, 'with name:', name);
        const { error } = await signUp(email, password, name);
        if (error) {
          console.error('Signup error:', error);
          toast({
            title: "Greška pri registraciji",
            description: error.message || "Došlo je do greške prilikom registracije.",
            variant: "destructive"
          });
        } else {
          console.log('Signup successful');
          toast({
            title: "Uspešno",
            description: "Nalog je uspešno kreiran! Možete se ulogovati.",
          });
          setIsLogin(true);
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "Neočekivana greška",
        description: "Došlo je do neočekivane greške. Pokušajte ponovo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isPasswordReset) return 'Reset lozinke';
    return isLogin ? 'Prijavite se' : 'Registrujte se';
  };

  const getDescription = () => {
    if (isPasswordReset) return 'Unesite email adresu za reset lozinke';
    return isLogin ? 'Unesite vaše podatke za prijavu' : 'Kreirajte novi nalog';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#040A3E] via-[#0A1B5C] to-[#1A2B7A] p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="rounded-lg p-2 bg-white/10">
              <img 
                src="/logobotprovidan.png" 
                alt="Masterbot Hub Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Masterbot Hub</h1>
              <p className="text-xs text-blue-200">AI-powered platform</p>
            </div>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-blue-200">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isPasswordReset && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Ime</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Vaše ime"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin && !isPasswordReset}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/50"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/50"
                />
              </div>
              
              {!isPasswordReset && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Lozinka</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/50"
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-200" 
                disabled={loading}
              >
                {loading ? 'Molim sačekajte...' : (
                  isPasswordReset ? 'Pošalji reset email' : 
                  (isLogin ? 'Prijavite se' : 'Registrujte se')
                )}
              </Button>
            </form>
            
            <div className="mt-6 space-y-3 text-center">
              {!isPasswordReset && (
                <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetForm();
                  }}
                  className="text-sm text-blue-200 hover:text-white transition-colors"
                >
                  {isLogin 
                    ? 'Nemate nalog? Registrujte se' 
                    : 'Već imate nalog? Prijavite se'
                  }
                </Button>
              )}
              
              {isLogin && !isPasswordReset && (
                <Button
                  variant="link"
                  onClick={() => {
                    setIsPasswordReset(true);
                    resetForm();
                  }}
                  className="text-sm text-blue-200 hover:text-white transition-colors block mx-auto"
                >
                  Zaboravili ste lozinku?
                </Button>
              )}
              
              {isPasswordReset && (
                <Button
                  variant="link"
                  onClick={() => {
                    setIsPasswordReset(false);
                    setIsLogin(true);
                    resetForm();
                  }}
                  className="text-sm text-blue-200 hover:text-white transition-colors"
                >
                  Nazad na prijavu
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
