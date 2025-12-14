
export type MinerProfile = 'Bitaxe Gamma' | 'Bitaxe Supra' | 'Bitaxe Hex' | 'Bitaxe GT 800' | 'Bitaxe Turbo';

export interface MinerConfig {
  id: string;
  name: string;
  ipAddress: string;
  profile: MinerProfile;
  isRemote?: boolean;
  remoteUrl?: string;
}

export interface AIConfig {
  personality: 'concise' | 'balanced' | 'detailed';
  analysisInterval: number; // minutes
  proactiveAlerts: boolean;
}

export type AppTheme = 'default' | 'blue' | 'purple' | 'emerald' | 'crimson';

export interface AppConfig {
  userName?: string;
  miners: MinerConfig[];
  refreshRate: number;
  aiConfig: AIConfig;
  theme: AppTheme;
}

export interface MinerStats {
  hashrate: number; // GH/s
  frequency: number; // MHz
  temp: number; // Celsius
  power: number; // Watts
  fanSpeed: number; // %
  voltage: number; // mV
  efficiency: number; // J/TH
  wifiQuality: number; // % Signal Strength
  bestDiff: string;
  sharesAccepted: number;
  sharesRejected: number;
  uptime: string;
  // AI/Advanced Metrics
  dailyRevenue: number; // Sats
  stabilityScore: number; // 0-100
  thermalHeadroom: number; // Celsius remaining before throttle
  anomalyProbability: number; // 0-100% chance of failure
  
  history: { time: string; value: number }[];
  tempHistory: { time: string; value: number }[];
  powerHistory: { time: string; value: number }[];
  fanHistory: { time: string; value: number }[];
  efficiencyHistory: { time: string; value: number }[];
  wifiHistory: { time: string; value: number }[];
  revenueHistory: { time: string; value: number }[];
  stabilityHistory: { time: string; value: number }[];
  headroomHistory: { time: string; value: number }[];
  anomalyHistory: { time: string; value: number }[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  groundingSources?: GroundingSource[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  CHAT = 'CHAT',
  STUDIO = 'STUDIO',
  SETTINGS = 'SETTINGS'
}