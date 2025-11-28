# 🌬️ NafasLokal - Air Quality Monitoring App

## 📋 Project Configuration

- **Framework**: Next.js with TypeScript
- **Backend**: Convex (Self-hosted)
  - URL: `https://convex.zahar.my`
  - Component: `air`
- **API Key**: WAQI Token `ccecee1eead62e81d67bf17540fe1ebb148346b7`

## 🎯 Main Features Checklist

### ✅ Core Features (Completed)
- [x] **Landing Page** (`src/app/page.tsx`)
  - [x] Hero section with app introduction
  - [x] Mission pillars display
  - [x] How it works section
  - [x] Live air quality preview
  - [x] Mobile-responsive design
  - [x] Loading animations & transitions

- [x] **Dashboard** (`src/app/dashboard/page.tsx`)
  - [x] GPS-based location detection
  - [x] Real-time air quality data (PM2.5, NO₂, CO)
  - [x] Dual API integration (WAQI + OpenAQ)
  - [x] Risk scoring algorithm (0-100)
  - [x] Exposure logging system
  - [x] User authentication (guest + registered)
  - [x] Points & rewards system
  - [x] Health recommendations
  - [x] 7-day trend analysis
  - [x] Air quality history

- [x] **Registration** (`src/app/register/page.tsx`)
  - [x] Clean registration form
  - [x] Password validation
  - [x] Loading animations
  - [x] Privacy-first messaging

- [x] **Convex Backend**
  - [x] Database schema (users, sessions, profiles, exposures)
  - [x] Authentication system
  - [x] Passport functions
  - [x] Exposure logging with risk calculation
  - [x] Gamification mechanics

- [x] **API Integration**
  - [x] WAQI API (`/api/waqi`)
  - [x] OpenAQ API (`/api/openaq`)
  - [x] Error handling & fallbacks
  - [x] Data caching (5 min)

### ❌ Missing Features (To Implement)

#### 🗺️ Map & Visualization
- [x] **Interactive Map Component**
  - [x] Install map library (Leaflet/Mapbox)
  - [x] Base map implementation
  - [x] User location marker
  - [x] Real-time air quality overlays
  - [x] **Heatmap visualization** (NEW)
  - [x] Zoom & pan controls
  - [x] Map layer toggle (satellite/street)

- [x] **Heatmap Features**
  - [x] Color-coded pollution density
  - [x] PM2.5 heatmap layer
  - [x] NO₂ heatmap layer
  - [x] CO heatmap layer
  - [ ] Time-based heatmap animation
  - [ ] Historical heatmap data
  - [x] Custom color scales (Green→Yellow→Red)

- [ ] **Route Planning**
  - [ ] Start/end point selection
  - [ ] Route visualization on map
  - [ ] Pollution-aware routing algorithm
  - [ ] Multiple route options
  - [ ] Exposure estimation per route
  - [ ] Alternative transport modes

#### 🏥 Advanced Health Features
- [ ] **Health Risk Mapping**
  - [ ] AI-powered risk assessment
  - [ ] Health impact visualization
  - [ ] Vulnerable area identification
  - [ ] Health alert zones
  - [ ] Medical facility proximity

- [ ] **Healthcare Access Analysis**
  - [ ] Clinic/hospital mapping
  - [ ] Underserved area identification
  - [ ] Accessibility scoring
  - [ ] Nearest facility finder
  - [ ] Public transport connectivity

#### 🚗 Traffic Integration
- [ ] **Traffic Data Integration**
  - [ ] OpenStreetMap traffic data
  - [ ] Real-time congestion visualization
  - [ ] Peak hours identification
  - [ ] Traffic impact on pollution
  - [ ] Stress level correlation

- [ ] **Smart Recommendations**
  - [ ] Traffic-aware routing
  - [ ] Best travel time suggestions
  - [ ] Public transport integration
  - [ ] Carpool recommendations
  - [ ] Indoor activity alerts

#### 📊 Data Analytics
- [ ] **Advanced Analytics Dashboard**
  - [ ] Historical data visualization
  - [ ] Pollution trend predictions
  - [ ] Personal health impact reports
  - [ ] Community comparison tools
  - [ ] Export functionality (PDF/CSV)

- [ ] **AI Features**
  - [ ] Air quality prediction model
  - [ ] Pattern recognition
  - [ ] Anomaly detection
  - [ ] Smart notification system

#### 🎨 UI/UX Improvements
- [ ] **Component Library**
  - [ ] Reusable UI components
  - [ ] Design system documentation
  - [ ] Component storybook
  - [ ] Accessibility improvements
  - [ ] Dark mode support

- [ ] **Mobile App Features**
  - [ ] PWA implementation
  - [ ] Push notifications
  - [ ] Offline mode
  - [ ] Background location tracking
  - [ ] Native app feel

#### 🔧 Technical Improvements
- [ ] **Environment Configuration**
  - [ ] Move API keys to `.env.local`
  - [ ] Docker optimization
  - [ ] CI/CD pipeline
  - [ ] Performance monitoring
  - [ ] Error tracking (Sentry)

- [ ] **Testing & Quality**
  - [ ] Unit tests (Jest)
  - [ ] Integration tests
  - [ ] E2E tests (Playwright)
  - [ ] Code coverage report
  - [ ] Type safety improvements

## 📊 SDG 3 Integration Checklist

### ✅ Implemented
- [x] Air quality monitoring (PM2.5, NO₂, CO)
- [x] Health risk scoring
- [x] Personal health recommendations
- [x] Exposure tracking

### 🚧 In Progress/Partial
- [ ] Air quality & health risk mapping
- [ ] Real-time health alerts

### ❌ To Implement
- [ ] Traffic & public health analysis
- [ ] Smart healthcare access tools
- [ ] Urban health data integration
- [ ] WHO health metrics
- [ ] Community health insights

## 🗂️ File Structure Tasks

- [ ] Create `src/components/ui/` reusable components
- [ ] Create `src/components/map/` map components
- [ ] Create `src/components/charts/` data visualization
- [ ] Add `src/lib/` utility functions
- [ ] Add `src/hooks/` custom React hooks
- [ ] Add `src/types/` TypeScript definitions
- [ ] Add test files `__tests__/`

## 🚀 Next Priority Tasks

1. **🗺️ Implement Map & Heatmap**
   ```bash
   npm install leaflet react-leaflet
   # or
   npm install mapbox-gl react-map-gl
   ```

2. **🎨 Build Component Library**
   - Extract reusable components from dashboard
   - Create shared UI components

3. **📊 Add Data Visualization**
   - Chart library integration (Chart.js/Recharts)
   - Trend analysis graphs
   - Comparative analytics

4. **🔐 Environment Setup**
   - Move secrets to environment variables
   - Add production configuration

## 📝 Notes

- Current implementation covers ~80-85% of core functionality
- Strong foundation with Convex backend and responsive UI
- ✅ Map visualization with heatmap implemented
- Gamification system already well-implemented
- Authentication and user management complete
- Interactive map with layer toggle and real-time data

## 🔗 Resources

### Datasets
- OpenAQ Global Air Quality Data
- DOE Malaysia Air Quality Index
- World Health Organization Urban Health Data
- Traffic Data From OpenStreetMap

### API Documentation
- WAQI API: https://aqicn.org/api/
- OpenAQ API: https://docs.openaq.org/