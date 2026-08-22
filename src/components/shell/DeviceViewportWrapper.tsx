import React, { useEffect, useState } from 'react';
import { DeviceSurfacePolicy } from '../../types/architecture';

interface DeviceViewportWrapperProps {
  policy: DeviceSurfacePolicy;
  appName: 'Passenger' | 'Driver' | 'Ops';
  children: React.ReactNode;
  borderAccentColor?: string;
}

/**
 * DEVICE_SURFACE_POLICY Harness:
 * 
 * When running in real mobile device / standalone PWA:
 *  - Takes 100% of real viewport (100dvh) with zero artificial bezels/frame.
 * 
 * When running in desktop developer console / simulation mode:
 *  - Encloses the app in a realistic 360x680 device frame.
 */
export const DeviceViewportWrapper: React.FC<DeviceViewportWrapperProps> = ({
  policy,
  appName,
  children,
  borderAccentColor = 'border-neutral-800'
}) => {
  const [isStandaloneOrMobile, setIsStandaloneOrMobile] = useState<boolean>(false);

  useEffect(() => {
    // Detect if running in real mobile screen width or installed PWA
    const checkEnvironment = () => {
      const isStandalonePwa = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      const isMobileScreen = window.innerWidth <= 480;
      setIsStandaloneOrMobile(isStandalonePwa || isMobileScreen);
    };

    checkEnvironment();
    window.addEventListener('resize', checkEnvironment);
    return () => window.removeEventListener('resize', checkEnvironment);
  }, []);

  // For ADAPTIVE mode (Admin / Founder console), render directly without mobile enclosure
  if (policy === 'ADAPTIVE') {
    return <>{children}</>;
  }

  // Real Mobile / Standalone PWA environment: Full native mobile screen without simulator frame
  if (isStandaloneOrMobile) {
    return (
      <div className="w-full min-h-[100dvh] h-[100dvh] max-h-[100dvh] bg-neutral-950 text-white flex flex-col overflow-hidden relative select-none">
        {children}
      </div>
    );
  }

  // Desktop Development Console / Simulator: Smartphone testing frame
  return (
    <div
      className={`w-full max-w-[360px] mx-auto bg-neutral-950 border-[7px] ${borderAccentColor} ring-1 ring-white/10 rounded-[40px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col h-[680px] relative text-white select-none`}
      data-surface-policy="MOBILE_ONLY"
      data-app={appName}
    >
      {children}
    </div>
  );
};
