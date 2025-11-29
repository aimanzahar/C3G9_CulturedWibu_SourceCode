import type { AirQualityStation } from './airQuality';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    airQualityData?: AirQualityContext;
    healthProfile?: HealthProfile;
  };
}

export interface HealthProfile {
  hasRespiratoryCondition: boolean;
  conditions?: string[];
  sensitivityLevel: 'normal' | 'sensitive' | 'very_sensitive';
}

export interface AirQualityContext {
  location: { lat: number; lng: number; name?: string };
  aqi: number;
  riskLevel: 'low' | 'moderate' | 'high';
  pollutants: Record<string, number>;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  location?: { lat: number; lng: number };
  healthProfile?: HealthProfile;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  airQualityData?: AirQualityContext;
  suggestions?: string[];
}

export interface Recommendation {
  type: 'health' | 'route' | 'activity' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  actionableSteps?: string[];
  relatedAQI?: number;
}

export interface ChatSession {
  id: string;
  userId?: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  messageCount: number;
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  recommendations?: Recommendation[];
  airQualityData?: AirQualityContext;
  followUpQuestions?: string[];
  needsLocationPermission?: boolean;
  healthProfileUpdated?: boolean;
}

export interface ChatContextType {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  healthProfile: HealthProfile | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  updateHealthProfile: (profile: Partial<HealthProfile>) => Promise<void>;
  clearSession: () => void;
  hasLocationPermission: boolean;
  requestLocationPermission: () => Promise<boolean>;
}

// Type for air quality data from existing airQuality service
export type AirQualityDataForChat = Pick<AirQualityStation, 
  'location' | 'city' | 'country' | 'aqi' | 'pm25' | 'no2' | 'co' | 'o3' | 'so2' | 'lat' | 'lng'
>;