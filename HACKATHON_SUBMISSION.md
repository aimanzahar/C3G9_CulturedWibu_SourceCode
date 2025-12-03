# NafasLokal - Air Exposure Passport 🌬️

### *"Breathe Smarter. Live Healthier. One Commute at a Time."*

---

## Team Member Name

| Role | Name |
|------|------|
| 💻 **Lead Developer** | Aiman |
| 🎤 **Pitch Architect** | Zaim |
| 🔍 **Devil's Advocate** | Alif |
| 💡 **Ideation Lead** | Isyraf |
| 🧪 **QA Engineer** | Shah |

---

## Project Info

**NafasLokal** is an AI-driven air quality monitoring platform designed specifically for Malaysian urban commuters. We transform scattered pollution data into **actionable health decisions** through real-time monitoring, AI predictions, and gamified behavior change.

### 🛠️ Tech Stack
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Backend**: Convex (self-hosted real-time database)
- **AI/ML**: Custom predictive models for 24-hour air quality forecasting
- **Maps**: Leaflet with custom heatmap visualization layers
- **Data Sources**: DOE Malaysia, WAQI API, OpenAQ (with web scraping fallback)

### 🎯 SDG Alignment
- **SDG 3**: Good Health & Well-Being
- **SDG 11**: Sustainable Cities and Communities

---

## Project Idea

### 💡 Inspiration

Every day, **millions of Malaysians** commute through polluted urban corridors in the Klang Valley. The air they breathe contains dangerous levels of PM2.5, NO₂, and CO – invisible killers linked to respiratory disease, cardiovascular problems, and reduced life expectancy.

The shocking truth? **The data already exists.** Government agencies and international organizations collect air quality readings every hour. But this data sits in scattered databases, presented in technical formats that everyday citizens can't use.

We asked ourselves: *What if we could turn this data into life-saving decisions?*

That's how **NafasLokal** was born – your personal **Air Exposure Passport** that protects you and your family, one commute at a time.

---

### 🔥 Challenges We Faced

#### The API Struggle – A First for Us

This hackathon threw us a curveball we've **never experienced before**: **no provided APIs**.

In every previous hackathon we've participated in, organizers provided ready-to-use APIs or datasets. This time? We were on our own.

Finding reliable air quality data for Malaysia was **incredibly difficult**:

- **DOE Malaysia** doesn't offer a public API – we had to **web scrape** their official portal
- **WAQI API** has rate limits and incomplete Malaysian coverage
- **OpenAQ** data for Malaysia is sparse and often delayed

We spent the first **several hours** just figuring out how to get data:

```javascript
// Our web scraping solution for DOE Malaysia
const scrapeDOEData = async (stationId) => {
  // Parse HTML from DOE portal
  // Extract PM2.5, NO2, CO readings
  // Handle inconsistent data formats
  // Implement caching to avoid rate limits
};
```

**Lesson learned**: Real-world data is messy, incomplete, and hard to access. But that's exactly why solutions like NafasLokal are needed!

#### Other Challenges

- **Multi-source data fusion**: Merging data from 3+ sources with different formats, units, and update frequencies
- **Real-time sync**: Ensuring the dashboard updates live without overwhelming the APIs
- **Health scoring algorithm**: Creating a scientifically-grounded risk score from raw pollutant values
- **Map performance**: Rendering heatmaps with thousands of data points smoothly

---

### 🏗️ How We Built It

#### Phase 1: Data Pipeline
We built a robust data aggregation layer that:
1. Pulls from DOE Malaysia (web scraping)
2. Queries WAQI API (with fallbacks)
3. Fetches OpenAQ data (supplementary)
4. Merges and normalizes into a unified format
5. Caches results to reduce API calls

#### Phase 2: Core Platform
- **Real-time Dashboard**: GPS-based location detection → instant air quality display
- **Interactive Heatmap**: Leaflet maps with color-coded pollution density
- **Health Scoring**: Custom algorithm weighing PM2.5, NO₂, and CO levels

The health score formula considers WHO guidelines:

\\( \text{Score} = 100 - \left( \frac{PM_{2.5}}{2} + \frac{NO_2}{2.5} + CO \times 8 \right) \\)

#### Phase 3: AI Health Engine
- **24-hour pollutant forecasts** using historical pattern analysis
- **Personalized health scores** based on user profiles (age, conditions)
- **Vulnerable group advisories** for children, elderly, asthma patients

#### Phase 4: Gamification (BreathQuest)
- Daily/weekly challenges to encourage healthy choices
- XP system, streaks, and badges
- Leaderboards to foster community engagement

---

### 📚 What We Learned

1. **Data accessibility is a real problem** – Even public health data isn't always publicly accessible
2. **Web scraping is a necessary skill** – When APIs don't exist, you build your own
3. **User experience matters** – Raw data means nothing if people can't act on it
4. **Gamification drives behavior** – Points and badges actually motivate healthy choices
5. **Malaysia needs local solutions** – Global apps don't understand haze season or local traffic patterns

---

### 🚀 Key Features

| Feature | Description |
|---------|-------------|
| **Live Dashboard** | Real-time AQI with multi-source data fusion |
| **AI Health Score** | Personalized assessment: \\( 0 \leq S \leq 100 \\) |
| **Pollutant Forecast** | 24-hour predictions for PM2.5, NO₂, O₃, CO |
| **AI Chatbot** | Natural language health assistant |
| **BreathQuest** | Gamification with challenges & leaderboards |
| **Heatmap Visualization** | Color-coded pollution density maps |
| **Vulnerable Alerts** | Targeted advisories for sensitive groups |

---

### 🌏 Impact & Vision

**Immediate Impact:**
- Reduce individual pollution exposure by up to **30%** through smarter route choices
- Protect **vulnerable populations** with timely, personalized alerts
- Create **behavioral change** through gamification

**Future Vision:**
- Mobile app for on-the-go alerts
- Integration with LRT/MRT schedules for green transit
- Wearable device connectivity
- Expansion to Penang, Johor Bahru, and beyond

---

### 💬 Final Thoughts

NafasLokal isn't just an app – it's a movement toward **healthier cities** and **informed citizens**.

We believe that **everyone deserves to know what they're breathing**. And more importantly, everyone deserves the tools to **do something about it**.

> *"Breathe Smarter. Live Healthier. One Commute at a Time."*

---

**Thank you for considering NafasLokal! 🙏**

*Built with ❤️ by Team NafasLokal for a healthier Malaysia*
