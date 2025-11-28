export interface Location {
  lat: number;
  lng: number;
  timestamp?: number;
}

export interface LocationTrackingOptions {
  updateInterval?: number; // in milliseconds, default 5000 (5 seconds)
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationServiceCallbacks {
  onLocationUpdate?: (location: Location) => void;
  onError?: (error: GeolocationPositionError) => void;
  onPermissionDenied?: () => void;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private locationHistory: Location[] = [];
  private maxHistoryLength = 100; // Keep last 100 locations
  private callbacks: LocationServiceCallbacks = {};

  // Check if geolocation is supported
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get current location once
  async getCurrentLocation(options?: PositionOptions): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            timestamp: Date.now()
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          ...options
        }
      );
    });
  }

  // Start continuous location tracking
  startLocationTracking(
    options: LocationTrackingOptions = {},
    callbacks: LocationServiceCallbacks = {}
  ): void {
    if (!this.isSupported()) {
      callbacks.onError?.(new Error('Geolocation is not supported by this browser') as any);
      return;
    }

    // Stop existing tracking if any
    this.stopLocationTracking();

    this.callbacks = callbacks;
    const {
      updateInterval = 5000,
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 60000
    } = options;

    // Check permission first
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        this.callbacks.onPermissionDenied?.();
        return;
      }

      this.isTracking = true;
      
      // Use watchPosition for continuous tracking
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
            timestamp: Date.now()
          };

          // Add to history
          this.addToHistory(location);

          // Trigger callback
          this.callbacks.onLocationUpdate?.(location);
        },
        (error) => {
          this.callbacks.onError?.(error);
          
          // If permission denied, stop tracking
          if (error.code === error.PERMISSION_DENIED) {
            this.stopLocationTracking();
            this.callbacks.onPermissionDenied?.();
          }
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Get location history
  getLocationHistory(): Location[] {
    return [...this.locationHistory];
  }

  // Clear location history
  clearLocationHistory(): void {
    this.locationHistory = [];
  }

  // Add location to history (maintains max length)
  private addToHistory(location: Location): void {
    this.locationHistory.push(location);
    
    // Keep only the last N locations
    if (this.locationHistory.length > this.maxHistoryLength) {
      this.locationHistory = this.locationHistory.slice(-this.maxHistoryLength);
    }
  }

  // Calculate distance between two coordinates in kilometers
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Check if a location is within specified radius of center point
  isWithinRadius(center: Location, point: Location, radiusKm: number): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusKm;
  }

  // Get all locations within a radius
  getLocationsWithinRadius(
    center: Location, 
    radiusKm: number, 
    locations: Location[] = this.locationHistory
  ): Location[] {
    return locations.filter(loc => this.isWithinRadius(center, loc, radiusKm));
  }

  // Get total distance traveled through location history
  getTotalDistance(): number {
    if (this.locationHistory.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      totalDistance += this.calculateDistance(
        this.locationHistory[i - 1],
        this.locationHistory[i]
      );
    }
    return totalDistance;
  }

  // Helper function to convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Request permission for geolocation (for browsers that support it)
  async requestPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export types for use in components
export type { LocationService };