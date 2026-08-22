import React from 'react';
import { PassengerApp } from '../simulator/PassengerApp';

export const PublicPassengerPortal: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full bg-neutral-950 animate-in fade-in duration-300">
      {/* 
        DEVICE_SURFACE_POLICY: MOBILE_ONLY
        - In real mobile / installed PWA: PassengerApp renders 100dvh directly without bezel frame.
        - In desktop development browser: PassengerApp is enclosed in development test harness frame.
      */}
      <div className="relative w-full max-w-[370px] flex justify-center items-center">
        <div className="relative w-full z-10">
          <PassengerApp />
        </div>
      </div>
    </div>
  );
};



