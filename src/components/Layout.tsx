import React from 'react';
import { Music, Github } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-hidden relative selection:bg-[#1DB954] selection:text-black">
      {/* Abstract Background Shapes */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1DB954]/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-[#1DB954] p-1.5 rounded-full">
            <Music className="w-5 h-5 text-black" />
          </div>
          <span>Spoti<span className="text-[#1DB954]">Quiz</span></span>
        </div>
        
        <a 
          href="#" 
          className="text-white/50 hover:text-white transition-colors"
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Github className="w-6 h-6" />
        </a>
      </header>

      {/* Main Content */}
      <main className="relative z-0 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
