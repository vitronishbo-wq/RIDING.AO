import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { LUANDA_LOCATIONS } from '../../data/luandaData';
import { getAdaptiveGpsInterval } from '../../utils/adaptiveGps';
import { Navigation, MapPin, Radio, Shield, Gauge } from 'lucide-react';

export const LuandaMapCanvas: React.FC = () => {
  const { drivers, activeTrip, selectedOrigin, selectedDestination, lastMatchingLatencyMs } = useSystem();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map Bounds for Luanda center
  // Lat range: -9.05 to -8.75 (approx 0.3 deg)
  // Lng range: 13.15 to 13.40 (approx 0.25 deg)
  const minLat = -9.05;
  const maxLat = -8.75;
  const minLng = 13.15;
  const maxLng = 13.40;

  const projectToCanvas = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    // Invert Y because Latitude goes north (up), Canvas Y goes down
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulse = 0;

    const render = () => {
      pulse = (pulse + 0.05) % (Math.PI * 2);
      const width = canvas.width;
      const height = canvas.height;

      // Dark background representing MapLibre / OpenStreetMap Night Style
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Coastline / Ocean (Luanda Atlantic Bay)
      ctx.fillStyle = '#091E3A';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width * 0.45, 0);
      ctx.quadraticCurveTo(width * 0.35, height * 0.25, width * 0.25, height * 0.5);
      ctx.quadraticCurveTo(width * 0.15, height * 0.75, width * 0.05, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Coastline glow
      ctx.strokeStyle = '#005A2B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Draw Geohash Grid Lines (Subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridCols = 8;
      const gridRows = 6;
      for (let i = 0; i <= gridCols; i++) {
        const x = (width / gridCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let j = 0; j <= gridRows; j++) {
        const y = (height / gridRows) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Draw Major Road Network of Luanda
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;

      // Avenida 4 de Fevereiro (Marginal) to Talatona
      const pMarginal = projectToCanvas(-8.8095, 13.2384, width, height);
      const pAirport = projectToCanvas(-8.8584, 13.2312, width, height);
      const pTalatona = projectToCanvas(-8.9182, 13.1802, width, height);
      const pKilamba = projectToCanvas(-8.995, 13.256, width, height);
      const pViana = projectToCanvas(-8.905, 13.372, width, height);
      const pMutamba = projectToCanvas(-8.8142, 13.2335, width, height);

      // Roads
      ctx.beginPath();
      ctx.moveTo(pMarginal.x, pMarginal.y);
      ctx.lineTo(pMutamba.x, pMutamba.y);
      ctx.lineTo(pAirport.x, pAirport.y);
      ctx.lineTo(pTalatona.x, pTalatona.y);
      ctx.lineTo(pKilamba.x, pKilamba.y);
      ctx.stroke();

      // Estrada de Catete (Airport to Viana)
      ctx.beginPath();
      ctx.moveTo(pAirport.x, pAirport.y);
      ctx.lineTo(pViana.x, pViana.y);
      ctx.stroke();

      // 4. Draw Active Trip Route Polyline
      if (activeTrip) {
        const pOrig = projectToCanvas(activeTrip.origin.lat, activeTrip.origin.lng, width, height);
        const pDest = projectToCanvas(activeTrip.destination.lat, activeTrip.destination.lng, width, height);

        // Animated dashed polyline
        ctx.save();
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -pulse * 10;
        ctx.beginPath();
        ctx.moveTo(pOrig.x, pOrig.y);

        // Curve slightly through Luanda road curvature
        const midX = (pOrig.x + pDest.x) / 2 + 25;
        const midY = (pOrig.y + pDest.y) / 2 - 15;
        ctx.quadraticCurveTo(midX, midY, pDest.x, pDest.y);
        ctx.stroke();
        ctx.restore();

        // Origin Marker (Verde Angola)
        ctx.fillStyle = '#005A2B';
        ctx.beginPath();
        ctx.arc(pOrig.x, pOrig.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Destination Marker (Yellow Angola)
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(pDest.x, pDest.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 5. Draw Key Luanda Landmarks
      LUANDA_LOCATIONS.forEach((loc) => {
        const pt = projectToCanvas(loc.lat, loc.lng, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(loc.name.split(' ')[0], pt.x + 6, pt.y + 3);
      });

      // 6. Draw Drivers & Status
      drivers.forEach((driver) => {
        const pt = projectToCanvas(driver.lat, driver.lng, width, height);
        const isMatched = activeTrip?.driverId === driver.id;

        // Pulse wave for matched driver or active driver
        if (isMatched || driver.status === 'online') {
          const pulseRadius = 12 + Math.sin(pulse) * 4;
          ctx.strokeStyle = isMatched ? 'rgba(255, 193, 7, 0.5)' : 'rgba(0, 90, 43, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Driver Car Icon Node
        ctx.fillStyle = isMatched ? '#FFC107' : driver.status === 'online' ? '#005A2B' : '#475569';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label Driver name & speed
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillStyle = isMatched ? '#FFC107' : '#E2E8F0';
        ctx.fillText(driver.name.split(' ')[0], pt.x + 9, pt.y - 4);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`${driver.speedKmH} km/h`, pt.x + 9, pt.y + 6);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [drivers, activeTrip, selectedOrigin, selectedDestination]);

  const activeDriver = drivers.find((d) => d.id === activeTrip?.driverId) || drivers[0];
  const gpsRule = getAdaptiveGpsInterval(activeDriver.speedKmH);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Map Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-200">MapLibre GL Native (OpenStreetMap Tiles)</span>
          <span className="text-slate-500 font-mono text-[11px]">| Luanda City Sub-Borders</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Motoristas Online: <strong className="text-emerald-400 font-mono">{drivers.filter(d => d.status === 'online').length}</strong></span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Geohash Grid: <strong className="text-amber-400 font-mono">kr7b (Luanda)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full h-[320px] lg:h-[380px] bg-slate-950">
        <canvas
          ref={canvasRef}
          width={700}
          height={380}
          className="w-full h-full object-cover block"
        />

        {/* Live Overlay: Adaptive GPS telemetry */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 shadow-lg max-w-[240px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Adaptativo (Cap. 5)</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Velocidade:</span>
              <span className="font-mono text-emerald-300 font-bold">{activeDriver.speedKmH} km/h</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Atualização:</span>
              <span className="font-mono text-amber-300 font-bold">{gpsRule.label.split('(')[0]}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
              <span>Impacto Bateria:</span>
              <span>Mínimo (&lt;1%)</span>
            </div>
          </div>
        </div>

        {/* Live Matching HUD */}
        {activeTrip && (
          <div className="absolute top-3 right-3 bg-[#005A2B]/95 text-white backdrop-blur-md border border-emerald-500/40 rounded-xl p-2.5 text-xs shadow-lg">
            <div className="flex items-center gap-1.5 font-bold text-[#FFC107]">
              <Navigation className="w-3.5 h-3.5" />
              <span>Viagem #{activeTrip.id}</span>
            </div>
            <div className="text-[11px] text-emerald-100 mt-1 space-y-0.5">
              <div>De: <strong>{activeTrip.origin.name.split(' ')[0]}</strong></div>
              <div>Para: <strong>{activeTrip.destination.name.split(' ')[0]}</strong></div>
              <div>Distância: <strong>{activeTrip.distanceKm} km</strong> | Preço: <strong className="text-[#FFC107]">{activeTrip.priceAOA} Kz</strong></div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#005A2B] border border-white" />
            <span>Motorista Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC107] border border-black" />
            <span>Em Viagem / Atribuído</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Embarque</span>
          </div>
        </div>
      </div>
    </div>
  );
};
