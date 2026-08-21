import React from 'react';
import { PassengerApp } from '../simulator/PassengerApp';

export const PublicPassengerPortal: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-6 px-4 bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 animate-in fade-in duration-300">
      {/* Clean Public Smartphone Frame Container with subtle ambient highlight */}
      <div className="relative w-full max-w-[370px] flex justify-center items-center">
        {/* Subtle device ambient glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/10 via-amber-500/10 to-emerald-600/10 rounded-[44px] blur-xl opacity-70 pointer-events-none" />
        
        {/* The Live Public Smartphone */}
        <div className="relative w-full z-10">
          <PassengerApp />
        </div>
      </div>
    </div>
  );
};


