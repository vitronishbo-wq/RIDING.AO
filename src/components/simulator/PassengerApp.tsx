import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/geohashUtils';
import {
  parseProgressiveIntent,
  getActiveHabitSuggestion,
  generateMulticaixaReference,
  ProgressiveResolution
} from '../../utils/intentEngine';
import {
  Mic,
  MicOff,
  Navigation,
  Sparkles,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Phone,
  Shield,
  Star,
  UserCheck,
  RotateCcw,
  Compass,
  Building2,
  HeartHandshake,
  CreditCard,
  Wallet,
  Copy,
  Check,
  Sliders,
  MapPin,
  Car,
  Move
} from 'lucide-react';
import { URBAN_ANCHORS, REGISTERED_ENTITIES } from '../../data/urbanAnchorsData';
import { UrbanAnchor } from '../../types/intentTypes';

export const PassengerApp: React.FC = () => {
  const {
    passengerGpsLocation,
    pricingConfig,
    activeTrip,
    passengerWalletAOA,
    requestIntentTrip,
    updateLiveDestination,
    cancelTrip,
    rateTrip,
    setTriggerDialpadOpen,
    drivers
  } = useSystem();

  // Progressive UI States
  // state 1: Map + Clean Question Capsule + Habit Pill
  // state 2: Intent Input Active (Text / Voice / Anchor Chips)
  // state 3: Clarification / Region Confirmation / Ready
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(false);
  const [searchPhase, setSearchPhase] = useState<'DESTINATION' | 'ORIGIN' | 'CONFIRMATION'>('DESTINATION');
  const [intentInput, setIntentInput] = useState<string>('');
  const [originInput, setOriginInput] = useState<string>('');
  const [chosenDestination, setChosenDestination] = useState<UrbanAnchor | null>(null);
  const [chosenOrigin, setChosenOrigin] = useState<LuandaLocation | UrbanAnchor | null>(null);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Progressive resolution state
  const [resolution, setResolution] = useState<ProgressiveResolution>(() =>
    parseProgressiveIntent('', passengerGpsLocation, pricingConfig)
  );

  // 3-Tier Payment selection
  const [selectedPaymentTier, setSelectedPaymentTier] = useState<
    'TIER_1_INVISIBLE' | 'TIER_2_REFERENCE' | 'TIER_3_MANUAL'
  >('TIER_1_INVISIBLE');

  // Destino Vivo Pin adjustment state
  const [isAdjustingLivePin, setIsAdjustingLivePin] = useState<boolean>(false);
  const [pinOffsetMeters, setPinOffsetMeters] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rating State
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // Current Habit routine suggestion based on time of day
  const currentHabit = getActiveHabitSuggestion(new Date().getHours(), new Date().getDay());

  // Canvas map reference
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Recompute intent resolution when input changes
  useEffect(() => {
    if (intentInput.trim()) {
      const res = parseProgressiveIntent(intentInput, passengerGpsLocation, pricingConfig);
      setResolution(res);
    } else {
      setResolution({
        query: '',
        step: 'STATE_1_REST',
        plan: null,
        needsClarification: false
      });
    }
  }, [intentInput, passengerGpsLocation, pricingConfig]);

  // Live Map Canvas Rendering for Passenger View
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let pulse = 0;

    const minLat = -9.05;
    const maxLat = -8.75;
    const minLng = 13.15;
    const maxLng = 13.40;

    const project = (lat: number, lng: number) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * canvas.width;
      const y = ((maxLat - lat) / (maxLat - minLat)) * canvas.height;
      return { x, y };
    };

    const render = () => {
      pulse = (pulse + 0.04) % (Math.PI * 2);
      const w = canvas.width;
      const h = canvas.height;

      // Map background (Luanda MapLibre style)
      ctx.fillStyle = '#0B1320';
      ctx.fillRect(0, 0, w, h);

      // 1. Luanda Bay / Coastline (Baía de Luanda & Ilha)
      ctx.fillStyle = '#06172D';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.48, 0);
      ctx.quadraticCurveTo(w * 0.38, h * 0.28, w * 0.28, h * 0.52);
      ctx.quadraticCurveTo(w * 0.18, h * 0.78, w * 0.08, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Coastline subtle neon emerald stroke
      ctx.strokeStyle = '#005A2B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Road Network Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 2.5;

      const pMarginal = project(-8.8095, 13.2384);
      const pMutamba = project(-8.8142, 13.2335);
      const pMaianga = project(-8.831, 13.232);
      const pAirport = project(-8.8584, 13.2312);
      const pNovaVida = project(-8.882, 13.228);
      const pTalatona = project(-8.9182, 13.1802);
      const pKilamba = project(-8.995, 13.256);
      const pViana = project(-8.905, 13.372);

      // Main Arteries
      ctx.beginPath();
      ctx.moveTo(pMarginal.x, pMarginal.y);
      ctx.lineTo(pMutamba.x, pMutamba.y);
      ctx.lineTo(pMaianga.x, pMaianga.y);
      ctx.lineTo(pAirport.x, pAirport.y);
      ctx.lineTo(pNovaVida.x, pNovaVida.y);
      ctx.lineTo(pTalatona.x, pTalatona.y);
      ctx.lineTo(pKilamba.x, pKilamba.y);
      ctx.stroke();

      // Viana Express Way
      ctx.beginPath();
      ctx.moveTo(pAirport.x, pAirport.y);
      ctx.lineTo(pViana.x, pViana.y);
      ctx.lineTo(pKilamba.x, pKilamba.y);
      ctx.stroke();

      // 3. Urban Anchors Landmarks (Subtle dots)
      Object.values(URBAN_ANCHORS).forEach((anc) => {
        const pt = project(anc.lat, anc.lng);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Route if Active Trip or Resolved Plan
      const activeOrPlanRoute = activeTrip
        ? activeTrip.routeCoordinates
        : resolution.plan
        ? [
            [resolution.plan.pickupLocation.lat, resolution.plan.pickupLocation.lng],
            [
              (resolution.plan.pickupLocation.lat + resolution.plan.dropoffLocation.lat) / 2 + 0.004,
              (resolution.plan.pickupLocation.lng + resolution.plan.dropoffLocation.lng) / 2 - 0.003
            ],
            [resolution.plan.dropoffLocation.lat, resolution.plan.dropoffLocation.lng]
          ]
        : null;

      if (activeOrPlanRoute && activeOrPlanRoute.length > 1) {
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        activeOrPlanRoute.forEach(([lat, lng], idx) => {
          const pt = project(lat, lng);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Pickup point
        const startPt = project(activeOrPlanRoute[0][0], activeOrPlanRoute[0][1]);
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Dropoff point (or Destino Vivo Pin)
        const endCoord = activeOrPlanRoute[activeOrPlanRoute.length - 1];
        const endPt = project(endCoord[0], endCoord[1]);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing circle around Destino Vivo
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 10 + Math.sin(pulse) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Passenger Current Contextual GPS
      const passPt = project(passengerGpsLocation.lat, passengerGpsLocation.lng);
      ctx.fillStyle = 'rgba(0, 90, 43, 0.3)';
      ctx.beginPath();
      ctx.arc(passPt.x, passPt.y, 14 + Math.sin(pulse) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#005A2B';
      ctx.beginPath();
      ctx.arc(passPt.x, passPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 6. Online Driver Vehicles
      drivers
        .filter((d) => d.status !== 'offline')
        .forEach((driver) => {
          const dPt = project(driver.lat, driver.lng);
          ctx.fillStyle = driver.status === 'in_trip' ? '#EF4444' : '#FFC107';
          ctx.beginPath();
          ctx.arc(dPt.x, dPt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [drivers, activeTrip, resolution.plan, passengerGpsLocation]);

  // Voice Simulation Mic Toggle
  const handleToggleMic = () => {
    if (!isListeningMic) {
      setIsListeningMic(true);
      setIsInputExpanded(true);
      // Simulate recognized voice command
      setTimeout(() => {
        if (searchPhase === 'DESTINATION') {
          handleSelectDestinationText('Kikolo');
        } else {
          handleSelectOriginGps();
        }
        setIsListeningMic(false);
      }, 1400);
    } else {
      setIsListeningMic(false);
    }
  };

  // Select destination by text/chip
  const handleSelectDestinationText = (destText: string) => {
    const matched = matchAnchorFromText(destText);
    const destAnchor: UrbanAnchor = matched || {
      id: `anc_custom_${Date.now()}`,
      name: destText,
      type: 'OUTRO',
      municipio: 'Luanda',
      bairro: destText,
      popularReference: `Destino: ${destText}`,
      lat: -8.825 + (Math.random() - 0.5) * 0.05,
      lng: 13.245 + (Math.random() - 0.5) * 0.05,
      radiusMeters: 300,
      isRegionOnly: false
    };

    setChosenDestination(destAnchor);
    setIntentInput(destAnchor.name);
    setSearchPhase('ORIGIN');
    setIsInputExpanded(true);
  };

  // Select GPS as Origin (Default 1-Touch)
  const handleSelectOriginGps = () => {
    if (!chosenDestination) return;
    const originLoc: LuandaLocation = {
      lat: passengerGpsLocation.lat,
      lng: passengerGpsLocation.lng,
      name: passengerGpsLocation.name
    };
    setChosenOrigin(originLoc);
    finalizeTripPlan(originLoc, chosenDestination);
  };

  // Select Custom Origin
  const handleSelectOriginText = (origText: string) => {
    if (!chosenDestination) return;
    const matched = matchAnchorFromText(origText);
    const origLoc: LuandaLocation = matched
      ? anchorToLocation(matched)
      : {
          lat: -8.835 + (Math.random() - 0.5) * 0.05,
          lng: 13.235 + (Math.random() - 0.5) * 0.05,
          name: origText
        };
    setChosenOrigin(origLoc);
    finalizeTripPlan(origLoc, chosenDestination);
  };

  // Build final trip plan and move to confirmation
  const finalizeTripPlan = (origin: LuandaLocation, destination: UrbanAnchor) => {
    const destLoc = anchorToLocation(destination);
    const distKm = Math.max(0.5, calculateHaversineDistanceKm(origin.lat, origin.lng, destLoc.lat, destLoc.lng));
    const durationMin = Math.round(distKm * 2.8 + 4);
    
    // Base 500 AOA minimum floor + elastic distance growth (50 AOA / 50m = 1000 AOA / km)
    const priceAOA = Math.max(500, Math.round(500 + Math.max(0, distKm - 0.5) * 1000));

    const plan: OperationalTripPlan = {
      actionTitle: `Corrida para ${destination.name}`,
      actionType: 'SOLO_TAXI',
      pickupLocation: origin,
      dropoffLocation: destLoc,
      destinationAnchor: destination,
      estimatedDistanceKm: parseFloat(distKm.toFixed(2)),
      estimatedDurationMinutes: durationMin,
      calculatedPriceAOA: priceAOA,
      isScheduled: false,
      confidenceScore: 0.98,
      explanation: 'Viagem resolvida com tarifa dinâmica por GPS.'
    };

    setResolution({
      query: `${origin.name} -> ${destination.name}`,
      step: 'STATE_5_READY',
      plan,
      needsClarification: false
    });
    setSearchPhase('CONFIRMATION');
  };

  // Reset search back to step 1
  const handleResetSearch = () => {
    setSearchPhase('DESTINATION');
    setChosenDestination(null);
    setChosenOrigin(null);
    setIntentInput('');
    setOriginInput('');
    setResolution({
      query: '',
      step: 'STATE_1_REST',
      plan: null,
      needsClarification: false
    });
    setIsInputExpanded(false);
  };

  // Habit quick 1-touch trigger
  const handleSelectHabit = () => {
    handleSelectDestinationText(currentHabit.targetAnchor.name);
  };

  // Clarification selection click
  const handleClarificationOption = (opt: { anchor?: UrbanAnchor; entity?: any }) => {
    if (opt.anchor) {
      handleSelectDestinationText(opt.anchor.name);
    }
  };

  // Confirm Region (Destino em aberto)
  const handleConfirmRegion = () => {
    if (resolution.plan) {
      setResolution((prev) => ({
        ...prev,
        step: 'STATE_5_READY'
      }));
    }
  };

  // Confirm and launch trip request
  const handleConfirmOrder = () => {
    if (resolution.plan) {
      const paymentMethod =
        selectedPaymentTier === 'TIER_1_INVISIBLE'
          ? 'WALLET'
          : selectedPaymentTier === 'TIER_2_REFERENCE'
          ? 'MULTICAIXA_EXPRESS'
          : 'CASH';

      requestIntentTrip(resolution.plan, paymentMethod, selectedPaymentTier);
      setIsInputExpanded(false);
    }
  };

  // Handle Dragging Pin in Destino Vivo (Live Dynamic Destination)
  const handleLivePinAdjust = (deltaLat: number, deltaLng: number) => {
    if (!activeTrip) return;
    const newCoord = {
      lat: activeTrip.destination.lat + deltaLat,
      lng: activeTrip.destination.lng + deltaLng
    };
    updateLiveDestination(newCoord, `${activeTrip.destination.name.split('(')[0].trim()} (Pino Refinado)`);
    setIsAdjustingLivePin(false);
  };

  // Copy Multicaixa Reference Code
  const handleCopyReference = (ref: string) => {
    navigator.clipboard?.writeText(ref.replace(/\s/g, ''));
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="w-full max-w-[360px] mx-auto bg-neutral-950 border-[7px] border-neutral-700/90 ring-1 ring-white/15 rounded-[40px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col h-[680px] relative text-white select-none">
      {/* 1. Mobile Top Notch & Status Bar */}
      <div className="absolute top-0 inset-x-0 z-30 bg-neutral-950/85 backdrop-blur-md px-5 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-300 border-b border-white/5">
        <span className="font-bold">09:41</span>
        <div className="w-20 h-3.5 bg-neutral-900 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-[10px]">
          {/* Disguised trigger dot next to 4G */}
          <button
            onClick={() => setTriggerDialpadOpen(true)}
            className="w-2.5 h-2.5 rounded-full bg-neutral-700/60 hover:bg-neutral-400 transition-colors cursor-pointer"
            aria-label="Status indicator"
            title="System Trigger"
          />
          <span className="font-semibold text-emerald-400">• 4G</span>
          <span>🔋</span>
        </div>
      </div>

      {/* 2. Top Brand Title Bar (Minimalist Floating Pill) */}
      <div className="absolute top-10 inset-x-0 z-20 px-4 flex items-center justify-between pointer-events-none">
        <div className="bg-neutral-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 pointer-events-auto shadow-md">
          <div className="w-4 h-4 rounded-full bg-[#005A2B] text-[#FFC107] flex items-center justify-center font-black text-[9px]">
            G
          </div>
          <span className="font-black tracking-widest text-[11px] text-white">GO.BRO.AAO</span>
        </div>

        <div className="bg-neutral-950/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-mono text-[#FFC107] pointer-events-auto">
          <Wallet className="w-3 h-3" />
          <span>{formatAOA(passengerWalletAOA)}</span>
        </div>
      </div>

      {/* 3. MAP CANVAS OCCUPYING FULL SCREEN (85%+) */}
      <div className="absolute inset-0 z-0">
        <canvas ref={mapCanvasRef} width={360} height={680} className="w-full h-full block" />
      </div>

      {/* 4. PASSENGER INTERACTIVE OVERLAYS */}

      {/* ========================================================================= */}
      {/* ESTADO 1 & 2: NO ACTIVE TRIP -> PROGRESSIVE FLOATING NAVIGATION BOTTOM SHEET */}
      {/* ========================================================================= */}
      {!activeTrip && (
        <div className="absolute bottom-0 inset-x-0 z-30 p-3.5 space-y-2.5 flex flex-col justify-end pointer-events-none">
          {/* HABIT ROUTINE DISCREET SUGGESTION PILL (1-Touch Habit Action) */}
          {!isInputExpanded && (
            <button
              onClick={handleSelectHabit}
              className="pointer-events-auto self-start bg-neutral-950/90 hover:bg-neutral-900 backdrop-blur-md border border-emerald-500/40 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs shadow-xl transition-all active:scale-95 text-left animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="w-6 h-6 rounded-xl bg-[#005A2B] text-[#FFC107] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 font-semibold block">{currentHabit.greeting}</span>
                <span className="text-white font-bold text-[11px] leading-tight">{currentHabit.promptText}</span>
              </div>
            </button>
          )}

          {/* MAIN FLOATING CAPSULE / INPUT EXPANSION */}
          <div className="pointer-events-auto bg-neutral-950/95 backdrop-blur-xl border border-white/10 rounded-[28px] p-3.5 shadow-2xl space-y-3 transition-all">
            
            {/* ETAPA 1: "Pra onde vamos?" (Destino) */}
            {searchPhase === 'DESTINATION' && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (intentInput.trim()) {
                      handleSelectDestinationText(intentInput.trim());
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div
                    onClick={() => setIsInputExpanded(true)}
                    className="flex-1 flex items-center bg-neutral-900/90 border border-neutral-700/80 rounded-2xl px-3 py-2.5 cursor-pointer focus-within:border-[#005A2B] transition-colors"
                  >
                    <input
                      type="text"
                      value={intentInput}
                      onFocus={() => setIsInputExpanded(true)}
                      onChange={(e) => setIntentInput(e.target.value)}
                      placeholder="Pra onde vamos?"
                      className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none font-medium"
                    />
                  </div>

                  {intentInput.trim() ? (
                    <button
                      type="submit"
                      className="py-2.5 px-3 rounded-2xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-lg transition-all active:scale-95 shrink-0"
                    >
                      <span>Enviar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className={`p-2.5 rounded-2xl border transition-all shrink-0 ${
                        isListeningMic
                          ? 'bg-red-600 text-white border-red-500 animate-pulse'
                          : 'bg-neutral-900 border-neutral-700 text-[#FFC107] hover:border-neutral-500'
                      }`}
                      title="Comando por voz"
                    >
                      {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </form>

                {/* Quick Destination Chips */}
                {isInputExpanded && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                      Sugestões & Destinos Frequentes:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {[
                        'Kikolo',
                        'Mercado do Quilamba',
                        'Mutamba',
                        'Hospital Maria Pia',
                        'Vila de Cacuaco',
                        'Mercado de Benfica',
                        'Casa',
                        'Colégio São Francisco',
                        'Pumangol Talatona'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDestinationText(chip)}
                          className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold bg-neutral-900 border border-neutral-700 text-neutral-200 hover:border-emerald-500 hover:text-white transition-colors text-left"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ETAPA 2: "Ponto de partida?" (Origem) */}
            {searchPhase === 'ORIGIN' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                {/* Destination Badge */}
                <div className="flex items-center justify-between bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-red-400 font-bold text-[10px]">DESTINO:</span>
                    <span className="text-white font-semibold truncate">{chosenDestination?.name}</span>
                  </div>
                  <button
                    onClick={handleResetSearch}
                    className="text-[10px] text-neutral-400 hover:text-white underline ml-2 shrink-0"
                  >
                    Alterar
                  </button>
                </div>

                {/* Form Ponto de Partida */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (originInput.trim()) {
                      handleSelectOriginText(originInput.trim());
                    } else {
                      handleSelectOriginGps();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center bg-neutral-900/90 border border-emerald-500/50 rounded-2xl px-3 py-2.5 transition-colors focus-within:border-emerald-400">
                    <input
                      type="text"
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                      placeholder="Ponto de partida?"
                      autoFocus
                      className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-3 rounded-2xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-lg transition-all active:scale-95 shrink-0"
                  >
                    <span>Confirmar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Default 1-Tap Option: GPS Location */}
                <button
                  type="button"
                  onClick={handleSelectOriginGps}
                  className="w-full p-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-left flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xl bg-[#005A2B] text-emerald-300 flex items-center justify-center font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">Usar minha localização atual (GPS)</div>
                      <div className="text-[10px] text-neutral-400">{passengerGpsLocation.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
                    PADRÃO
                  </span>
                </button>

                {/* Quick Origin Anchors */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Mutamba', 'Talatona Metrópolis', 'Aeroporto', 'Casa (Nova Vida)'].map((anchor, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOriginText(anchor)}
                      className="px-2 py-1 rounded-xl text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-300 hover:border-emerald-500 hover:text-white"
                    >
                      {anchor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ETAPA 3: CONFIRMAÇÃO & AJUSTE OPCIONAL */}
            {searchPhase === 'CONFIRMATION' && resolution.plan && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                {/* Route Summary Pill */}
                <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800">
                    <span className="font-bold text-white">{resolution.plan.actionTitle}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatAOA(resolution.plan.calculatedPriceAOA)}
                    </span>
                  </div>

                  {/* De / Para concise view */}
                  <div className="text-[11px] space-y-1 text-neutral-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-400 font-bold">DE:</span>
                        <span className="truncate">{resolution.plan.pickupLocation.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-red-400 font-bold">PARA:</span>
                        <span className="truncate">{resolution.plan.dropoffLocation.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Opcional: Ajuste de Pino no GPS */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-800/80">
                    <span>Ajuste da seta do GPS:</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Optional micro-refine
                        if (chosenDestination) {
                          const refinedLoc: LuandaLocation = {
                            lat: chosenDestination.lat + 0.002,
                            lng: chosenDestination.lng + 0.002,
                            name: `${chosenDestination.name} (Ponto Refinado)`
                          };
                          finalizeTripPlan(
                            chosenOrigin
                              ? 'lat' in chosenOrigin
                                ? (chosenOrigin as LuandaLocation)
                                : anchorToLocation(chosenOrigin as UrbanAnchor)
                              : passengerGpsLocation,
                            { ...chosenDestination, lat: refinedLoc.lat, lng: refinedLoc.lng, name: refinedLoc.name }
                          );
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 transition-colors"
                    >
                      Ajustar no mapa (Opcional)
                    </button>
                  </div>
                </div>

                {/* 3-Tier Payment Selector */}
                <div className="bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-2xl space-y-1.5">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Forma de Pagamento:</div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentTier('TIER_1_INVISIBLE')}
                      className={`p-1.5 rounded-xl border text-center transition-colors ${
                        selectedPaymentTier === 'TIER_1_INVISIBLE'
                          ? 'bg-[#005A2B] border-emerald-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Carteira/Express
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentTier('TIER_2_REFERENCE')}
                      className={`p-1.5 rounded-xl border text-center transition-colors ${
                        selectedPaymentTier === 'TIER_2_REFERENCE'
                          ? 'bg-[#005A2B] border-emerald-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Referência
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentTier('TIER_3_MANUAL')}
                      className={`p-1.5 rounded-xl border text-center transition-colors ${
                        selectedPaymentTier === 'TIER_3_MANUAL'
                          ? 'bg-[#005A2B] border-emerald-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Dinheiro
                    </button>
                  </div>
                </div>

                {/* Confirmation Action Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-all active:scale-95"
                    title="Recomeçar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="flex-1 py-3 rounded-2xl bg-[#005A2B] text-white font-bold text-xs hover:bg-[#004822] shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <span>Pedir Go.Bro</span>
                    <span className="text-[#FFC107] font-mono font-bold">
                      • {formatAOA(resolution.plan.calculatedPriceAOA)}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>
                </div>
              </div>
            )}

            {/* PROGRESSIVE RESOLVER: ONDE ELA ESTÁ? (Clarification without forms) */}
            {resolution.needsClarification && resolution.clarificationOptions && searchPhase === 'DESTINATION' && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3 space-y-2">
                <div className="text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span>{resolution.clarificationQuestion}</span>
                </div>

                <div className="space-y-1.5">
                  {resolution.clarificationOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleClarificationOption(opt)}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-[#005A2B] text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{opt.label}</div>
                        {opt.sublabel && <div className="text-[10px] text-neutral-400">{opt.sublabel}</div>}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTADO 3: ACTIVE TRIP IN PROGRESS (MATCHED / EN ROUTE / IN FLIGHT) */}
      {/* ========================================================================= */}
      {activeTrip && activeTrip.status !== 'completed' && (
        <div className="absolute bottom-0 inset-x-0 z-30 p-3.5 space-y-2 flex flex-col justify-end">
          {/* DESTINO VIVO PIN ADJUSTER FLOATING BUTTON */}
          {activeTrip.isDestinoVivo && ['driver_en_route', 'in_progress'].includes(activeTrip.status) && (
            <div className="bg-neutral-950/90 backdrop-blur-md border border-[#FFC107]/40 rounded-2xl p-2.5 flex items-center justify-between text-xs shadow-xl animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFC107] text-neutral-950 flex items-center justify-center font-bold">
                  <Move className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white text-[11px]">Destino Vivo Ativo</div>
                  <div className="text-[10px] text-amber-300/90">Ajuste o pino a qualquer momento</div>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleLivePinAdjust(0.002, 0.002)}
                  className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[10px] font-bold border border-neutral-700 text-neutral-200"
                  title="Refinar localização no mapa"
                >
                  Mover Pino
                </button>
              </div>
            </div>
          )}

          {/* MAIN ACTIVE TRIP STATUS CARD */}
          <div className="bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-[28px] p-3.5 shadow-2xl space-y-3">
            {/* Status Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#005A2B] text-[#FFC107] flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">
                    {activeTrip.status === 'requesting' && 'Despachando Veículo...'}
                    {activeTrip.status === 'driver_en_route' && 'Motorista a Caminho'}
                    {activeTrip.status === 'driver_arrived' && 'Motorista no Local de Recolha'}
                    {activeTrip.status === 'in_progress' && 'Viagem em Andamento'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {activeTrip.isDestinoVivo ? 'Destino Aberto (Ao Vivo)' : 'Rota Fixada'}
                  </div>
                </div>
              </div>

              <span className="font-mono font-bold text-[#FFC107] text-xs">
                {formatAOA(activeTrip.priceAOA)}
              </span>
            </div>

            {/* Driver Profile (When matched) */}
            {activeTrip.driver && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeTrip.driver.photoUrl}
                    alt={activeTrip.driver.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#FFC107]"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white">{activeTrip.driver.name}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span className="font-mono text-[#FFC107] font-bold">{activeTrip.driver.vehiclePlate}</span>
                      <span>• {activeTrip.driver.vehicleModel}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${activeTrip.driver.phone}`}
                  className="p-2.5 rounded-xl bg-[#005A2B] text-white hover:bg-emerald-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* LEVEL 2 MULTICAIXA REFERENCE GENERATION (If Tier 2) */}
            {activeTrip.multicaixaRef && activeTrip.paymentTier === 'TIER_2_REFERENCE' && (
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-700 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-neutral-400 text-[10px]">
                  <span>PAGAMENTO POR REFERÊNCIA MULTICAIXA</span>
                  <span className="text-emerald-400 font-bold">EMIS</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-neutral-400">Entidade:</span>
                  <span className="font-bold text-white">{activeTrip.multicaixaRef.entidade}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-neutral-400">Referência:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#FFC107]">{activeTrip.multicaixaRef.referencia}</span>
                    <button
                      onClick={() => handleCopyReference(activeTrip.multicaixaRef!.referencia)}
                      className="p-0.5 text-neutral-400 hover:text-white"
                      title="Copiar Referência"
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Action */}
            {activeTrip.status === 'requesting' && (
              <button
                onClick={cancelTrip}
                className="w-full py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Cancelar Pedido
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTADO 4: TRIP COMPLETED & RECEIPT */}
      {/* ========================================================================= */}
      {activeTrip && activeTrip.status === 'completed' && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-3.5 space-y-3 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 rounded-t-[32px] animate-in slide-in-from-bottom-4">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Chegada ao Destino</h3>
            <p className="text-[11px] text-neutral-400">Viagem liquidada com sucesso</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-neutral-400 text-[10px]">
              <span>TOTAL PAGO</span>
              <span>85% MOTORISTA / 15% GO.BRO</span>
            </div>
            <div className="text-base font-black text-[#FFC107]">{formatAOA(activeTrip.priceAOA)}</div>
            <div className="text-[10px] text-neutral-400">{activeTrip.distanceKm} km percorridos</div>
          </div>

          {/* Rating */}
          {!ratingSubmitted ? (
            <div className="space-y-2 text-center">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRatingStars(star)} className="p-1">
                    <Star
                      className={`w-5 h-5 ${
                        star <= ratingStars ? 'text-[#FFC107] fill-[#FFC107]' : 'text-neutral-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  rateTrip(ratingStars, ratingComment);
                  setRatingSubmitted(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#005A2B] text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
              >
                Confirmar Avaliação
              </button>
            </div>
          ) : (
            <button
              onClick={cancelTrip}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 border border-neutral-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nova Viagem</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
