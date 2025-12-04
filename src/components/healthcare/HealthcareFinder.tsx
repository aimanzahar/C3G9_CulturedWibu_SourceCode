'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  type HealthcareFacility,
  type HealthcareSearchResult,
  formatDistance,
  getDirectionsUrl,
  getWazeUrl,
} from '@/lib/healthcareService';
import './HealthcareFinder.css';

interface HealthcareFinderProps {
  lat: number;
  lng: number;
  isVisible?: boolean;
}

type FacilityFilter = 'all' | 'hospital' | 'clinic' | 'pharmacy';

const HealthcareFinder: React.FC<HealthcareFinderProps> = ({
  lat,
  lng,
  isVisible = true,
}) => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FacilityFilter>('all');
  const [radius, setRadius] = useState(5000); // 5km default
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResult, setSearchResult] = useState<HealthcareSearchResult | null>(null);

  const fetchFacilities = useCallback(async () => {
    if (!lat || !lng) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/healthcare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          type: filter === 'all' ? undefined : filter,
          radius,
          limit: 15,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch healthcare facilities');
      }

      setFacilities(data.facilities || []);
      setSearchResult({
        facilities: data.facilities,
        searchRadius: data.searchRadius,
        totalFound: data.facilities?.length || 0,
        timestamp: new Date(data.timestamp),
      });
    } catch (err) {
      console.error('Healthcare fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load healthcare facilities');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, filter, radius]);

  // Fetch on mount and when params change
  useEffect(() => {
    if (isExpanded && lat && lng) {
      fetchFacilities();
    }
  }, [isExpanded, lat, lng, filter, radius, fetchFacilities]);

  const getFacilityIcon = (type: HealthcareFacility['type']) => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'clinic':
        return '🏨';
      case 'pharmacy':
        return '💊';
      case 'health_center':
        return '🏛️';
      default:
        return '⚕️';
    }
  };

  const getFacilityTypeLabel = (type: HealthcareFacility['type']) => {
    switch (type) {
      case 'hospital':
        return 'Hospital';
      case 'clinic':
        return 'Clinic';
      case 'pharmacy':
        return 'Pharmacy';
      case 'health_center':
        return 'Health Center';
      default:
        return 'Healthcare';
    }
  };

  if (!isVisible) return null;

  if (!isExpanded) {
    return (
      <div className="hf-collapsed">
        <button 
          className="hf-expand-btn"
          onClick={() => setIsExpanded(true)}
        >
          <span className="hf-expand-icon">🏥</span>
          <span>Find Nearby Healthcare</span>
          <span className="hf-expand-arrow">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="hf-container">
      <div className="hf-header">
        <div className="hf-header-left">
          <h3>
            <span className="hf-header-icon">🏥</span>
            Nearby Healthcare Facilities
          </h3>
          <p className="hf-subtitle">
            Hospitals, clinics & pharmacies within {radius / 1000}km
          </p>
        </div>
        <div className="hf-header-right">
          <button 
            className="hf-close-btn"
            onClick={() => setIsExpanded(false)}
            title="Minimize"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="hf-filters">
        <div className="hf-filter-group">
          <label>Type:</label>
          <div className="hf-filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'hospital' ? 'active' : ''}
              onClick={() => setFilter('hospital')}
            >
              🏥 Hospital
            </button>
            <button
              className={filter === 'clinic' ? 'active' : ''}
              onClick={() => setFilter('clinic')}
            >
              🏨 Clinic
            </button>
            <button
              className={filter === 'pharmacy' ? 'active' : ''}
              onClick={() => setFilter('pharmacy')}
            >
              💊 Pharmacy
            </button>
          </div>
        </div>
        <div className="hf-filter-group">
          <label>Radius:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="hf-radius-select"
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>
        <button 
          className="hf-refresh-btn"
          onClick={fetchFacilities}
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {/* Results */}
      <div className="hf-results">
        {loading && (
          <div className="hf-loading">
            <div className="hf-spinner"></div>
            <p>Searching for healthcare facilities...</p>
          </div>
        )}

        {error && (
          <div className="hf-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={fetchFacilities}>Try Again</button>
          </div>
        )}

        {!loading && !error && facilities.length === 0 && (
          <div className="hf-empty">
            <span>🔍</span>
            <p>No healthcare facilities found within {radius / 1000}km</p>
            <button onClick={() => setRadius(prev => Math.min(prev * 2, 50000))}>
              Expand Search Radius
            </button>
          </div>
        )}

        {!loading && !error && facilities.length > 0 && (
          <>
            <div className="hf-result-count">
              Found {facilities.length} {filter === 'all' ? 'facilities' : filter + 's'}
            </div>
            <div className="hf-list">
              {facilities.map((facility) => (
                <div key={facility.id} className="hf-card">
                  <div className="hf-card-header">
                    <span className="hf-card-icon">{getFacilityIcon(facility.type)}</span>
                    <div className="hf-card-info">
                      <h4>{facility.name}</h4>
                      <span className="hf-card-type">
                        {getFacilityTypeLabel(facility.type)}
                        {facility.emergency && <span className="hf-emergency-badge">🚨 Emergency</span>}
                      </span>
                    </div>
                    <span className="hf-card-distance">{formatDistance(facility.distance)}</span>
                  </div>
                  
                  {facility.address && (
                    <p className="hf-card-address">📍 {facility.address}</p>
                  )}
                  
                  {facility.phone && (
                    <p className="hf-card-phone">
                      <a href={`tel:${facility.phone}`}>📞 {facility.phone}</a>
                    </p>
                  )}
                  
                  {facility.openingHours && (
                    <p className="hf-card-hours">🕐 {facility.openingHours}</p>
                  )}
                  
                  <div className="hf-card-actions">
                    <a
                      href={getDirectionsUrl(lat, lng, facility.lat, facility.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hf-action-btn hf-action-google"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"/>
                      </svg>
                      Google Maps
                    </a>
                    <a
                      href={getWazeUrl(facility.lat, facility.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hf-action-btn hf-action-waze"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8.5 8C9.33 8 10 8.67 10 9.5C10 10.33 9.33 11 8.5 11C7.67 11 7 10.33 7 9.5C7 8.67 7.67 8 8.5 8ZM15.5 8C16.33 8 17 8.67 17 9.5C17 10.33 16.33 11 15.5 11C14.67 11 14 10.33 14 9.5C14 8.67 14.67 8 15.5 8ZM12 17.5C9.67 17.5 7.69 16.04 6.89 14H17.11C16.31 16.04 14.33 17.5 12 17.5Z"/>
                      </svg>
                      Waze
                    </a>
                    {facility.website && (
                      <a
                        href={facility.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hf-action-btn hf-action-web"
                      >
                        🌐 Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="hf-footer">
        <span>Data from OpenStreetMap</span>
        {searchResult && (
          <span>Updated: {searchResult.timestamp.toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</span>
        )}
      </div>
    </div>
  );
};

export default HealthcareFinder;
