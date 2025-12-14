import React, { useState, useEffect } from 'react';
import { LayoutGrid, MessageSquare, Settings as SettingsIcon, Image as ImageIcon, Mic, Sparkles } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { Settings } from './components/Settings';
import { MinerList } from './components/MinerList';
import { RigStudio } from './components/RigStudio';
import { VoiceMode } from './components/VoiceMode';
import { MinerStats, AppView, AppConfig, MinerConfig, MinerProfile } from './types';

// Profile Constants
const PROFILE_SPECS: Record<MinerProfile, { baseHash: number; basePower: number; varHash: number; defaultFreq: number }> = {
  'Bitaxe Gamma': { baseHash: 500, basePower: 15, varHash: 20, defaultFreq: 485 },
  'Bitaxe Supra': { baseHash: 750, basePower: 20, varHash: 30, defaultFreq: 700 },
  'Bitaxe Hex': { baseHash: 900, basePower: 25, varHash: 40, defaultFreq: 850 },
  'Bitaxe GT 800': { baseHash: 800, basePower: 22, varHash: 35, defaultFreq: 800 },
  'Bitaxe Turbo': { baseHash: 1100, basePower: 35, varHash: 50, defaultFreq: 950 },
};

const createInitialStats = (profile: MinerProfile): MinerStats => {
  const specs = PROFILE_SPECS[profile];
  return {
    hashrate: specs.baseHash,
    frequency: specs.defaultFreq,
    temp: 60,
    power: specs.basePower,
    fanSpeed: 65,
    voltage: 1210,
    efficiency: 28,
    wifiQuality: 98,
    bestDiff: "4.1K",
    sharesAccepted: 1402,
    sharesRejected: 2,
    uptime: "2d 4h 12m",
    dailyRevenue: Math.floor(specs.baseHash * 1.25),
    stabilityScore: 99.8,
    thermalHeadroom: 20.0,
    anomalyProbability: 0.5,
    
    history: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: specs.baseHash })),
    tempHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 60 })),
    powerHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: specs.basePower })),
    fanHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 65 })),
    efficiencyHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 28 })),
    wifiHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 95 })),
    revenueHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: specs.baseHash * 1.25 })),
    stabilityHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 99 })),
    headroomHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 20 })),
    anomalyHistory: Array.from({ length: 15 }, (_, i) => ({ time: `${10 + i}:00`, value: 0.5 })),
  };
};

// Mock Data Generator
const generateMockStats = (prev: MinerStats, profile: MinerProfile): MinerStats => {
  const specs = PROFILE_SPECS[profile];
  
  // Physics Simulation for Overclocking
  const freqMultiplier = prev.frequency / specs.defaultFreq; // e.g. 1.1x
  const voltMultiplier = prev.voltage / 1210; // e.g. 1.05x
  
  // Hashrate scales with frequency
  const baseHash = specs.baseHash * freqMultiplier;
  const newHash = baseHash + (Math.random() * specs.varHash * 2 - specs.varHash);

  // Power scales with square of voltage and linearly with frequency
  const powerScale = freqMultiplier * (voltMultiplier * voltMultiplier);
  const newPower = (specs.basePower * powerScale) + (Math.random() * 1);
  
  // Temperature scales aggressively with both
  // Base temp 58 + random flux + penalty for overclocking + penalty for overvolting
  const overclockPenalty = Math.max(0, (freqMultiplier - 1) * 20); // +20C if double freq
  const overvoltPenalty = Math.max(0, (voltMultiplier - 1) * 30); // +30C if double volt
  const newTemp = 58 + (Math.random() * 4) + overclockPenalty + overvoltPenalty;
  
  const newFan = Math.min(100, 65 + (newTemp - 60) * 2 + Math.floor(Math.random() * 5)); 
  const newTime = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
  const newWifi = Math.min(100, Math.max(80, prev.wifiQuality + (Math.random() * 6 - 3)));

  // AI Metric Calculations
  const maxTemp = 80;
  const headroom = Math.max(0, maxTemp - newTemp);
  const stabilityNoise = Math.random() * 2 - 1; 
  // Stability drops as temp rises
  const stabilityPenalty = Math.max(0, (newTemp - 70) * 2);
  const newStability = Math.min(100, Math.max(10, prev.stabilityScore + stabilityNoise - (stabilityPenalty * 0.1)));
  
  // Anomaly Risk increases drastically with Temp and Stability loss
  const anomalyRisk = newTemp > 65 ? (newTemp - 60) * 3 : Math.random() * 2;
  
  const estRevenue = Math.floor(newHash * 1.25);
  const newEfficiency = Number((newPower / (newHash/1000)).toFixed(1));

  const updateHistory = (hist: { time: string; value: number }[], val: number) => {
    const h = [...hist, { time: newTime, value: val }];
    if (h.length > 20) h.shift();
    return h;
  };
  
  return {
    ...prev,
    hashrate: newHash,
    frequency: prev.frequency, 
    voltage: prev.voltage,
    temp: newTemp,
    power: newPower,
    fanSpeed: newFan,
    efficiency: newEfficiency,
    wifiQuality: Math.floor(newWifi),
    sharesAccepted: prev.sharesAccepted + (Math.random() > 0.5 ? 1 : 0),
    dailyRevenue: estRevenue,
    stabilityScore: Number(newStability.toFixed(1)),
    thermalHeadroom: Number(headroom.toFixed(1)),
    anomalyProbability: Number(anomalyRisk.toFixed(1)),
    
    history: updateHistory(prev.history, newHash),
    tempHistory: updateHistory(prev.tempHistory || [], newTemp),
    powerHistory: updateHistory(prev.powerHistory || [], newPower),
    fanHistory: updateHistory(prev.fanHistory || [], newFan),
    efficiencyHistory: updateHistory(prev.efficiencyHistory || [], newEfficiency),
    wifiHistory: updateHistory(prev.wifiHistory || [], newWifi),
    revenueHistory: updateHistory(prev.revenueHistory || [], estRevenue),
    stabilityHistory: updateHistory(prev.stabilityHistory || [], newStability),
    headroomHistory: updateHistory(prev.headroomHistory || [], headroom),
    anomalyHistory: updateHistory(prev.anomalyHistory || [], anomalyRisk),
  };
};

const INITIAL_CONFIG: AppConfig = {
  userName: '',
  miners: [
    { id: '1', name: 'Bitaxe Gamma', ipAddress: '192.168.1.100', profile: 'Bitaxe Gamma' }
  ],
  refreshRate: 5,
  aiConfig: {
    personality: 'balanced',
    analysisInterval: 15,
    proactiveAlerts: true
  },
  theme: 'default'
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [activeMinerId, setActiveMinerId] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState(false);
  
  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', config.theme);
  }, [config.theme]);

  // Show welcome toast on mount if username exists
  useEffect(() => {
    if (config.userName) {
      setWelcomeToast(true);
      const timer = setTimeout(() => setWelcomeToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [config.userName]);

  // Map of minerId -> MinerStats
  const [statsMap, setStatsMap] = useState<Record<string, MinerStats>>(() => {
    const initial: Record<string, MinerStats> = {};
    INITIAL_CONFIG.miners.forEach(m => {
      initial[m.id] = createInitialStats(m.profile);
    });
    return initial;
  });

  // Ensure stats exist for all configured miners
  useEffect(() => {
    setStatsMap(prev => {
        const next = { ...prev };
        config.miners.forEach(m => {
            if (!next[m.id]) {
                next[m.id] = createInitialStats(m.profile);
            }
        });
        return next;
    });
  }, [config.miners]);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStatsMap(prev => {
        const next = { ...prev };
        config.miners.forEach(miner => {
           if (next[miner.id]) {
             next[miner.id] = generateMockStats(next[miner.id], miner.profile);
           }
        });
        return next;
      });
    }, config.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [config.miners, config.refreshRate]);

  const handleSelectMiner = (id: string) => {
    setActiveMinerId(id);
    setView(AppView.DASHBOARD);
  };

  const handleBackToFleet = () => {
    setActiveMinerId(null);
  };

  const handleUpdateMinerStats = (id: string, newStats: Partial<MinerStats>) => {
    setStatsMap(prev => ({
      ...prev,
      [id]: { ...prev[id], ...newStats }
    }));
  };

  const renderDashboard = () => {
      if (activeMinerId) {
          const minerStats = statsMap[activeMinerId];
          const minerConfig = config.miners.find(m => m.id === activeMinerId);
          if (minerStats && minerConfig) {
              return (
                <Dashboard 
                  stats={minerStats} 
                  minerConfig={minerConfig} 
                  userName={config.userName}
                  onBack={handleBackToFleet} 
                  onUpdateStats={(newStats) => handleUpdateMinerStats(activeMinerId, newStats)}
                  onOpenVoice={() => setShowVoiceMode(true)}
                />
              );
          }
      }
      return (
        <MinerList 
            userName={config.userName}
            miners={config.miners} 
            statsMap={statsMap} 
            onSelectMiner={handleSelectMiner} 
            onGoToSettings={() => setView(AppView.SETTINGS)}
        />
      );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans selection:bg-orange-500/30">
      
      {showVoiceMode && <VoiceMode onClose={() => setShowVoiceMode(false)} userName={config.userName} />}

      {/* Welcome Toast */}
      {welcomeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/95 backdrop-blur-md border border-orange-500/30 text-white pl-4 pr-6 py-3 rounded-full shadow-2xl shadow-orange-900/20 flex items-center gap-3 animate-slide-up">
            <div className="bg-orange-500/20 p-1.5 rounded-full">
                <Sparkles size={16} className="text-orange-400" />
            </div>
            <div>
                <span className="text-sm font-bold block leading-none mb-0.5">Welcome back, {config.userName}</span>
                <span className="text-[10px] text-gray-400 block leading-none">Sentry is online.</span>
            </div>
        </div>
      )}

      {/* Content Area */}
      <main className="max-w-md mx-auto min-h-screen bg-gray-950 relative shadow-2xl overflow-hidden">
        
        {view === AppView.DASHBOARD && renderDashboard()}
        {view === AppView.CHAT && <ChatInterface userName={config.userName} miners={config.miners} statsMap={statsMap} />}
        {view === AppView.STUDIO && <RigStudio />}
        {view === AppView.SETTINGS && <Settings config={config} onSave={setConfig} statsMap={statsMap} />}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-md mx-auto bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 pb-safe">
            <div className="flex justify-around items-center h-[60px]">
              
              <button 
                onClick={() => { setView(AppView.DASHBOARD); setActiveMinerId(null); }}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === AppView.DASHBOARD ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <LayoutGrid size={22} strokeWidth={view === AppView.DASHBOARD ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Fleet</span>
              </button>

              <button 
                onClick={() => setView(AppView.CHAT)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === AppView.CHAT ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <MessageSquare size={22} strokeWidth={view === AppView.CHAT ? 2.5 : 2} />
                <span className="text-[10px] font-medium">AI Sentry</span>
              </button>

              <button 
                onClick={() => setShowVoiceMode(true)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${showVoiceMode ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Mic size={22} strokeWidth={showVoiceMode ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Live</span>
              </button>

              <button 
                onClick={() => setView(AppView.STUDIO)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === AppView.STUDIO ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <ImageIcon size={22} strokeWidth={view === AppView.STUDIO ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Studio</span>
              </button>

              <button 
                onClick={() => setView(AppView.SETTINGS)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${view === AppView.SETTINGS ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <SettingsIcon size={22} strokeWidth={view === AppView.SETTINGS ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Config</span>
              </button>

            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default App;