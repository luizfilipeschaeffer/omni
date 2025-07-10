"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Zap, ArrowRight, Star, Rocket, Shield } from "lucide-react";
import { BottomBar } from "@/components/BottomBar";
import { LoginDrawer } from "@/components/LoginDrawer";
import { ChatView } from "../components/ChatModal";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function Home() {
  const { data: session } = useSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Listener para o evento de abertura do chat da barra inferior
  useEffect(() => {
    const handleOpenChat = () => {
      console.log('Evento openChat disparado, session:', session);
      if (!session) {
        toast.error("Você precisa estar autenticado para acessar o chat.");
        setShowDrawer(true);
        return;
      }
      console.log('Abrindo modal de chat');
      setChatOpen(true);
    };

    window.addEventListener('openChat', handleOpenChat);
    
    return () => {
      window.removeEventListener('openChat', handleOpenChat);
    };
  }, [session]);

  const handleChatClick = () => {
    if (!session) {
      toast.error("Você precisa estar autenticado para acessar o chat.");
      setShowDrawer(true);
      return;
    }
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-yellow-400/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-yellow-400/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-yellow-400 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                OmniChat
              </h1>
            </div>
            <Button 
              onClick={handleChatClick}
              className="bg-gradient-to-r from-blue-500 to-yellow-400 hover:from-blue-600 hover:to-yellow-500 text-white border-0"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Beta
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Sistema em Desenvolvimento Contínuo
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
            O Futuro do Chat
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Uma plataforma moderna e inovadora que está sendo continuamente aprimorada 
            para oferecer a melhor experiência de comunicação digital.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold"
              onClick={() => setShowDrawer(true)}
            >
              <Users className="w-5 h-5 mr-2" />
              Cadastre-se Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/20 px-8 py-4 text-lg font-semibold"
              onClick={handleChatClick}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Testar Chat Beta
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 dark:border-blue-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Tecnologia Avançada</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Utilizamos as mais modernas tecnologias para garantir uma experiência fluida e responsiva.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-yellow-100 dark:border-yellow-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Segurança Garantida</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Suas conversas são protegidas com criptografia de ponta a ponta e autenticação segura.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 dark:border-purple-900 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Chat em Tempo Real</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sistema de mensagens instantâneas com interface intuitiva e recursos avançados.
            </p>
          </div>
        </div>

        {/* Beta Section */}
        <div className="bg-gradient-to-r from-blue-500 to-yellow-400 rounded-3xl p-8 md:p-12 text-white text-center mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              Beta Testing
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Chat em Fase de Testes
            </h3>
            
            <p className="text-lg mb-8 opacity-90">
              Nossa funcionalidade de chat já está disponível para testes! 
              Experimente a nova interface e nos ajude a melhorar a experiência.
            </p>
            
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              onClick={handleChatClick}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Acessar Chat Beta
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">100%</div>
            <div className="text-gray-600 dark:text-gray-300">Seguro</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-300">Disponível</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">∞</div>
            <div className="text-gray-600 dark:text-gray-300">Possibilidades</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 dark:text-green-400 mb-2">🚀</div>
            <div className="text-gray-600 dark:text-gray-300">Futuro</div>
          </div>
        </div>
      </main>

      {/* Chat Modal - Só abre se estiver autenticado */}
      {chatOpen && session && <ChatView onClose={() => setChatOpen(false)} />}

      {/* Login Drawer */}
      {showDrawer && <LoginDrawer open={showDrawer} onOpenChange={setShowDrawer} />}

      {/* Bottom Bar */}
      <BottomBar />
    </div>
  );
}
