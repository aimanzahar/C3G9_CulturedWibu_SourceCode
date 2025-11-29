'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  SparklesIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserIcon,
  HomeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/navigation/Navbar';
import HealthProfileForm from '@/components/health/HealthProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface HealthInsight {
  id: string;
  type: 'warning' | 'tip' | 'prediction' | 'achievement';
  title: string;
  description: string;
  confidence?: number;
  timestamp: string;
  actionable?: string;
}

interface PollutantPrediction {
  name: string;
  current: number;
  predicted: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high';
}

interface VulnerableGroupAdvisory {
  group: string;
  icon: string;
  risk: 'low' | 'moderate' | 'high';
  recommendation: string;
}

interface HealthPredictionResponse {
  healthScore: number;
  exposureReduction: number;
  insights: HealthInsight[];
  pollutantPredictions: PollutantPrediction[];
  vulnerableGroups: VulnerableGroupAdvisory[];
  modelAccuracy: number;
  dataPointsToday: number;
  lastUpdated: string;
}

export default function AIHealthPage() {
  const { user } = useAuth();
  const userKey = user?.email || '';

  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false); // Start with false, only true when actually fetching
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [predictions, setPredictions] = useState<HealthPredictionResponse | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Check if user has completed health profile
  const healthProfileCheck = useQuery(api.healthProfile.isHealthProfileComplete, userKey ? { userKey } : 'skip');
  
  // Mutation to delete/reset health profile
  const deleteHealthProfile = useMutation(api.healthProfile.deleteHealthProfile);

  // Handle reset profile
  const handleResetProfile = async () => {
    if (!userKey) return;
    setIsResetting(true);
    try {
      await deleteHealthProfile({ userKey });
      setShowResetConfirm(false);
      setPredictions(null); // Clear predictions when resetting
      setShowProfileForm(true); // Show the form again to refill
    } catch (err) {
      console.error('Error resetting profile:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchPredictions = useCallback(async (lat: number, lng: number, profile?: typeof healthProfileCheck) => {
    // Don't fetch if profile is not complete
    if (!profile?.exists || !profile?.isComplete) {
      console.log('[AI-Health] Skipping AI generation - profile not complete');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody: { lat: number; lng: number; healthProfile?: typeof profile.profile } = { lat, lng };

      // Include health profile data
      if (profile?.profile) {
        requestBody.healthProfile = profile.profile;
        console.log('[AI-Health] Including health profile in request:', profile.profile.name || 'Anonymous');
      }

      const response = await fetch('/api/ai-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data: HealthPredictionResponse = await response.json();
      setPredictions(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Unable to load AI predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check health profile completion and show form if needed
  useEffect(() => {
    if (healthProfileCheck === undefined) {
      // Still loading
      return;
    }
    
    if (!healthProfileCheck.exists || !healthProfileCheck.isComplete) {
      setShowProfileForm(true);
    }
  }, [healthProfileCheck]);

  // Get location only once on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Default to Kuala Lumpur
          setLocation({ lat: 3.139, lng: 101.6869 });
        }
      );
    } else {
      // Default to Kuala Lumpur
      setLocation({ lat: 3.139, lng: 101.6869 });
    }
  }, []);

  // Fetch predictions only when profile is complete AND we have location
  useEffect(() => {
    if (location && healthProfileCheck?.exists && healthProfileCheck?.isComplete && !predictions) {
      console.log('[AI-Health] Profile complete, fetching predictions...');
      fetchPredictions(location.lat, location.lng, healthProfileCheck);
    }
  }, [location, healthProfileCheck, predictions, fetchPredictions]);

  const handleRefresh = () => {
    if (location && healthProfileCheck?.exists && healthProfileCheck?.isComplete) {
      fetchPredictions(location.lat, location.lng, healthProfileCheck);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileForm(false);
    // Refetch predictions with updated profile after a short delay to let the query update
    setTimeout(() => {
      if (location) {
        // Force refetch by clearing predictions first
        setPredictions(null);
      }
    }, 500);
  };

  const healthScore = predictions?.healthScore ?? 0;
  const exposureReduction = predictions?.exposureReduction ?? 0;
  const healthInsights = predictions?.insights ?? [];
  const pollutantPredictions = predictions?.pollutantPredictions ?? [];
  const vulnerableGroups = predictions?.vulnerableGroups ?? [];

  const getTimeSinceUpdate = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] pt-20">
        {/* Health Profile Form Modal */}
        {showProfileForm && userKey && (
          <HealthProfileForm onComplete={handleProfileComplete} />
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-rose-100 rounded-full">
                  <TrashIcon className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Reset Health Profile?</h3>
              </div>
              <p className="text-slate-600 mb-6">
                This will delete your current health profile and you&apos;ll need to fill in your information again. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProfile}
                  disabled={isResetting}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isResetting ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      Reset Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
          {/* Hero Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="font-medium">AI-Powered Health Intelligence</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Smart Air Health Predictions
                </h1>
                <p className="text-slate-600 max-w-2xl">
                  Our AI analyzes air quality, traffic patterns, weather data, and health statistics to provide personalized recommendations for healthier living in Malaysian cities.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </section>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Profile Required State - Show when profile is not complete */}
          {!loading && !predictions && healthProfileCheck !== undefined && (!healthProfileCheck.exists || !healthProfileCheck.isComplete) && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="card rounded-2xl p-8 max-w-lg text-center bg-gradient-to-br from-purple-50 to-sky-50 border border-purple-100">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-sky-500 rounded-full flex items-center justify-center mb-6">
                  <UserIcon className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Complete Your Health Profile
                </h2>
                <p className="text-slate-600 mb-6">
                  To provide personalized AI health insights and recommendations, we need to know a bit about your health. Please complete your health profile to unlock:
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span>Personalized risk assessment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span>Condition-specific advice</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span>Activity recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span>Air quality alerts</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-sky-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <UserIcon className="h-5 w-5" />
                  {healthProfileCheck?.exists ? 'Complete Profile' : 'Create Health Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !predictions && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                {/* Outer rotating ring */}
                <div className="w-24 h-24 rounded-full border-4 border-purple-100 border-t-purple-500 animate-spin" />
                {/* Middle pulsing ring */}
                <div className="absolute inset-2 rounded-full border-4 border-sky-100 border-b-sky-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                {/* Inner icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-sky-500 rounded-full flex items-center justify-center animate-pulse">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-lg font-medium text-slate-700">AI is analyzing your health profile...</p>
                <p className="text-sm text-slate-500 mt-1">Generating personalized health insights for {healthProfileCheck?.profile?.name || 'you'}</p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {predictions && (
            <>
          {/* Health Score Card */}
          <section className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Main Health Score */}
            <div className="card rounded-2xl p-6 md:col-span-2">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Your AI Health Score</h2>
                  <p className="text-sm text-slate-500">Based on your exposure patterns and local air quality</p>
                </div>
                <div className="flex gap-2">
                  {(['24h', '7d', '30d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                        selectedTimeframe === tf
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* Score Circle */}
                <div className="relative">
                  <svg className="w-32 h-32 -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(healthScore / 100) * 352} 352`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{healthScore}</span>
                    <span className="text-xs text-slate-500">
                      {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Moderate' : 'Poor'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Exposure</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {exposureReduction > 0 ? '-' : '+'}{Math.abs(exposureReduction)}%
                    </p>
                    <p className="text-xs text-emerald-600">vs last week</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sky-600 mb-1">
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Protected</span>
                    </div>
                    <p className="text-2xl font-bold text-sky-700">8 days</p>
                    <p className="text-xs text-sky-600">low exposure streak</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <ChartBarIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Avg AQI</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {pollutantPredictions.length > 0 ? Math.round(pollutantPredictions[0].current) : '--'}
                    </p>
                    <p className="text-xs text-purple-600">current</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <BellAlertIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Alerts</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      {healthInsights.filter(i => i.type === 'warning').length}
                    </p>
                    <p className="text-xs text-amber-600">active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Confidence */}
            <div className="card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-sky-50">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">AI Model Status</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Prediction Accuracy</span>
                    <span className="font-medium text-purple-700">{predictions?.modelAccuracy ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-sky-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${predictions?.modelAccuracy ?? 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Data Points Today</span>
                    <span className="font-medium text-purple-700">{(predictions?.dataPointsToday ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(((predictions?.dataPointsToday ?? 0) / 2000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-purple-100">
                  <p className="text-xs text-slate-500">
                    Model trained on 2.3M+ air quality readings from DOE Malaysia, WAQI, and OpenAQ.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Last updated: {getTimeSinceUpdate()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Health Profile - Self Reference (prominently placed after score) */}
          {healthProfileCheck?.exists && healthProfileCheck?.profile && (
            <section className="mb-8">
              <div className="card rounded-2xl p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-teal-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Your Health Profile</h2>
                    {healthProfileCheck.isComplete && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Your health profile helps our AI provide personalized air quality recommendations.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Basic Info */}
                  <div className="bg-white/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserIcon className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-semibold text-slate-700">Basic Info</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {healthProfileCheck.profile.name && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name</span>
                          <span className="text-slate-900 font-medium">{healthProfileCheck.profile.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Age Group</span>
                        <span className="text-slate-900 font-medium capitalize">
                          {healthProfileCheck.profile.age || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gender</span>
                        <span className="text-slate-900 font-medium capitalize">
                          {healthProfileCheck.profile.gender?.replace('-', ' ') || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Health Conditions */}
                  <div className="bg-white/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HeartIcon className="h-4 w-4 text-rose-500" />
                      <span className="text-sm font-semibold text-slate-700">Health Conditions</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Respiratory</span>
                        <span className={`font-medium ${healthProfileCheck.profile.hasRespiratoryCondition ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {healthProfileCheck.profile.hasRespiratoryCondition ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {healthProfileCheck.profile.conditions && healthProfileCheck.profile.conditions.length > 0 && (
                        <div>
                          <span className="text-slate-500">Conditions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {healthProfileCheck.profile.conditions.map((condition: string) => (
                              <span key={condition} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {healthProfileCheck.profile.conditionSeverity && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Severity</span>
                          <span className="text-slate-900 font-medium capitalize">
                            {healthProfileCheck.profile.conditionSeverity}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Heart Condition</span>
                        <span className={`font-medium ${healthProfileCheck.profile.hasHeartCondition ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {healthProfileCheck.profile.hasHeartCondition ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle & Environment */}
                  <div className="bg-white/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HomeIcon className="h-4 w-4 text-sky-500" />
                      <span className="text-sm font-semibold text-slate-700">Lifestyle & Environment</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Activity Level</span>
                        <span className="text-slate-900 font-medium capitalize">
                          {healthProfileCheck.profile.activityLevel || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Outdoor Exposure</span>
                        <span className="text-slate-900 font-medium capitalize">
                          {healthProfileCheck.profile.outdoorExposure || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Near Traffic</span>
                        <span className={`font-medium ${healthProfileCheck.profile.livesNearTraffic ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {healthProfileCheck.profile.livesNearTraffic ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Air Purifier</span>
                        <span className={`font-medium ${healthProfileCheck.profile.hasAirPurifier ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {healthProfileCheck.profile.hasAirPurifier ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medications if any */}
                {healthProfileCheck.profile.medications && healthProfileCheck.profile.medications.length > 0 && (
                  <div className="mt-4 bg-white/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheckIcon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-semibold text-slate-700">Medications</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {healthProfileCheck.profile.medications.map((med: string) => (
                        <span key={med} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Assessment based on profile */}
                <div className="mt-4 p-4 bg-gradient-to-r from-teal-100/50 to-cyan-100/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <SparklesIcon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Personalized Risk Assessment</h4>
                      <p className="text-sm text-slate-600">
                        {healthProfileCheck.profile.hasRespiratoryCondition
                          ? `Based on your respiratory conditions (${healthProfileCheck.profile.conditions?.join(', ') || 'various'}), we recommend extra caution when AQI exceeds 100. ${healthProfileCheck.profile.outdoorExposure === 'high' ? 'Your high outdoor exposure increases risk - consider reducing outdoor time during peak pollution hours.' : ''}`
                          : healthProfileCheck.profile.age === 'senior' || healthProfileCheck.profile.age === 'child'
                          ? `As a ${healthProfileCheck.profile.age === 'senior' ? 'senior adult' : 'child'}, you may be more sensitive to air pollution. We will prioritize alerts when conditions worsen.`
                          : 'Your profile indicates normal sensitivity to air pollution. We will provide standard recommendations based on current air quality.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Pollutant Predictions */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">24-Hour Pollutant Forecast</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                <SparklesIcon className="h-3 w-3" />
                AI Generated
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pollutantPredictions.map((pollutant) => (
                <div key={pollutant.name} className="card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-900">{pollutant.name}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      pollutant.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700' :
                      pollutant.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {pollutant.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-slate-900">{pollutant.current}</span>
                    <span className="text-sm text-slate-500 mb-1">{pollutant.unit}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {pollutant.trend === 'up' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-rose-500" />
                    ) : pollutant.trend === 'down' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="w-4 h-0.5 bg-slate-400" />
                    )}
                    <span className={pollutant.trend === 'up' ? 'text-rose-600' : pollutant.trend === 'down' ? 'text-emerald-600' : 'text-slate-600'}>
                      → {pollutant.predicted} {pollutant.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Insights */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Health Insights</h2>
            <div className="space-y-4">
              {healthInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`card rounded-xl p-5 border-l-4 ${
                    insight.type === 'warning' ? 'border-l-amber-500 bg-amber-50/50' :
                    insight.type === 'prediction' ? 'border-l-purple-500 bg-purple-50/50' :
                    insight.type === 'tip' ? 'border-l-sky-500 bg-sky-50/50' :
                    'border-l-emerald-500 bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      insight.type === 'prediction' ? 'bg-purple-100 text-purple-600' :
                      insight.type === 'tip' ? 'bg-sky-100 text-sky-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {insight.type === 'warning' ? <ExclamationTriangleIcon className="h-5 w-5" /> :
                       insight.type === 'prediction' ? <ChartBarIcon className="h-5 w-5" /> :
                       insight.type === 'tip' ? <LightBulbIcon className="h-5 w-5" /> :
                       <CheckCircleIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                        {insight.confidence && (
                          <span className="text-xs bg-white px-2 py-0.5 rounded-full text-purple-600 font-medium">
                            {insight.confidence}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                      {insight.actionable && (
                        <div className="flex items-start gap-2 bg-white/80 rounded-lg p-3">
                          <LightBulbIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700">{insight.actionable}</p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2">{insight.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vulnerable Groups Advisory */}
          <section className="mb-8">
            <div className="card rounded-2xl p-6 bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100">
              <div className="flex items-center gap-2 mb-4">
                <UserGroupIcon className="h-5 w-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-slate-900">Vulnerable Groups Advisory</h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                AI-generated recommendations for sensitive populations based on current and predicted air quality.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {vulnerableGroups.map((group) => (
                  <div key={group.group} className="bg-white/80 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl">{group.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{group.group}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          group.risk === 'high' ? 'bg-rose-100 text-rose-700' :
                          group.risk === 'moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {group.risk} risk
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{group.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Health Mission Section */}
          <section className="card rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <HeartIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">
                  Building Healthier Cities
                </h3>
                <p className="text-slate-600 mb-4">
                  Our AI integrates air quality, traffic density, and health data to support evidence-based decision making for healthier Malaysian cities. By analyzing patterns and predicting risks, we help reduce respiratory illness exposure and support vulnerable communities.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Real-time air quality integration
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Traffic pattern analysis
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Health risk predictions
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Community health alerts
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-sky-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <MapPinIcon className="h-5 w-5" />
              View Live Air Quality Map
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
