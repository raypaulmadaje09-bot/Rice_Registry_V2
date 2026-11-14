/**
 * Weather & Precipitation Radar Service for Silago, Southern Leyte
 * Real-time meteorological data and radar tile layer integration for LFT field visit planning.
 */

export interface WeatherAdvisory {
  status: 'EXCELLENT' | 'FAIR' | 'CAUTION' | 'NOT_RECOMMENDED';
  title: string;
  bisayaTitle: string;
  description: string;
  actionTip: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface HourlyWeatherForecast {
  time: string;
  hourStr: string;
  temp: number;
  precipMm: number;
  precipProb: number;
  weatherCode: number;
  weatherIcon: string;
  condition: string;
  suitability: 'GOOD' | 'FAIR' | 'POOR';
}

export interface BarangayWeatherStatus {
  barangay: string;
  zone: string;
  lat: number;
  lng: number;
  condition: string;
  icon: string;
  temp: number;
  rainMm: number;
  rainProb: number;
  riskLevel: 'LOW' | 'MED' | 'HIGH';
}

export interface SilagoWeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number; // mm/hr
  rain: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeed: number; // km/h
  windDirection: number;
  cloudCover: number; // %
  isDay: boolean;
  updatedAt: string;
  advisory: WeatherAdvisory;
  hourly: HourlyWeatherForecast[];
  barangays: BarangayWeatherStatus[];
}

export interface RadarFrame {
  time: number;
  path: string;
  type: 'past' | 'nowcast';
  label: string;
}

export interface RainViewerRadarData {
  host: string;
  generated: number;
  frames: RadarFrame[];
  satelliteFrames: RadarFrame[];
  currentFrameIndex: number;
}

/**
 * WMO Weather interpretation codes
 */
export function interpretWmoCode(code: number, isDay: boolean = true): { description: string; icon: string; condition: string } {
  switch (code) {
    case 0:
      return { description: 'Clear Skies', icon: isDay ? '☀️' : '🌙', condition: 'Clear' };
    case 1:
      return { description: 'Mainly Clear', icon: isDay ? '🌤️' : '☁️', condition: 'Fair' };
    case 2:
      return { description: 'Partly Cloudy', icon: '⛅', condition: 'Partly Cloudy' };
    case 3:
      return { description: 'Overcast Skies', icon: '☁️', condition: 'Cloudy' };
    case 45:
    case 48:
      return { description: 'Misty / Foggy', icon: '🌫️', condition: 'Fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Light Drizzle', icon: '🌦️', condition: 'Drizzle' };
    case 61:
      return { description: 'Light Rain Shower', icon: '🌧️', condition: 'Light Rain' };
    case 63:
      return { description: 'Moderate Rain', icon: '🌧️', condition: 'Moderate Rain' };
    case 65:
      return { description: 'Heavy Downpour', icon: '⛈️', condition: 'Heavy Rain' };
    case 80:
    case 81:
    case 82:
      return { description: 'Passing Rain Showers', icon: '🌦️', condition: 'Rain Showers' };
    case 95:
    case 96:
    case 99:
      return { description: 'Thunderstorm with Gusty Winds', icon: '⛈️', condition: 'Thunderstorm' };
    default:
      return { description: 'Partly Cloudy', icon: '⛅', condition: 'Partly Cloudy' };
  }
}

/**
 * Evaluates field visit suitability index for LFTs based on rain, humidity, wind & lightning risk
 */
export function calculateFieldVisitAdvisory(precipMm: number, rainProb: number, weatherCode: number, windSpeed: number): WeatherAdvisory {
  const isThunderstorm = weatherCode >= 95;
  const isHeavyRain = precipMm >= 2.5 || weatherCode === 65 || weatherCode === 82;
  const isModerateRain = precipMm >= 0.5 || rainProb >= 65 || weatherCode === 63;
  const isHighWind = windSpeed > 35;

  if (isThunderstorm || isHeavyRain || isHighWind) {
    return {
      status: 'NOT_RECOMMENDED',
      title: 'Field Visit Not Recommended',
      bisayaTitle: 'Dili Girekomenda ang Pag-field Work',
      description: 'Heavy rainfall or thunderstorm detected. Risk of flooded basakan paths, slippery dikes, and poor GPS satellite fix.',
      actionTip: 'Reschedule farm parcel GPS boundary surveying. Focus on office registry verification and RSBSA encoding.',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30'
    };
  }

  if (isModerateRain) {
    return {
      status: 'CAUTION',
      title: 'Field Work with Caution',
      bisayaTitle: 'Pag-amping sa Pag-field Work',
      description: 'Scattered precipitation or wet dikes. Waterproof field casing required for tablets/GPS mobile devices.',
      actionTip: 'Prioritize roadside lowland farms (Poblacion, Balagawan). Avoid muddy steep terraces in upland zones.',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30'
    };
  }

  if (precipMm > 0.05 || rainProb >= 35) {
    return {
      status: 'FAIR',
      title: 'Fair Field Conditions',
      bisayaTitle: 'Maayo ang Panahon (Adunay Hinay nga Taligsik)',
      description: 'Light passing clouds or slight drizzle. Farm visits and farmer interviews feasible.',
      actionTip: 'Bring rain gear and maintain battery reserves. Good lighting for field parcel camera documentation.',
      badgeBg: 'bg-sky-500/15',
      badgeText: 'text-sky-400',
      badgeBorder: 'border-sky-500/30'
    };
  }

  return {
    status: 'EXCELLENT',
    title: 'Ideal Fieldwork Weather',
    bisayaTitle: 'Hingpit nga Panahon sa Basakan',
    description: 'Optimal dry conditions with clear satellite geometry. Maximum GPS precision for parcel boundary polygon digitizing.',
    actionTip: 'Ideal for drone mapping, lot boundary validation, and visiting remote farmer clusters in Katipunan & Tubod.',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30'
  };
}

/**
 * Fallback static weather data for Silago when offline or API is unreachable
 */
export function getFallbackSilagoWeather(): SilagoWeatherData {
  const now = new Date();
  const advisory = calculateFieldVisitAdvisory(0.2, 20, 2, 12);

  const hourly: HourlyWeatherForecast[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getTime() + i * 3600 * 1000);
    const hour = d.getHours();
    const hourStr = `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;
    const precipMm = i % 4 === 2 ? 0.4 : 0.0;
    const precipProb = i % 4 === 2 ? 35 : 10;
    const code = i % 4 === 2 ? 61 : 2;
    const interp = interpretWmoCode(code, hour >= 6 && hour < 18);

    hourly.push({
      time: d.toISOString(),
      hourStr,
      temp: 29 - Math.abs(14 - hour) * 0.4,
      precipMm,
      precipProb,
      weatherCode: code,
      weatherIcon: interp.icon,
      condition: interp.condition,
      suitability: precipMm > 0.3 ? 'FAIR' : 'GOOD'
    });
  }

  const barangays: BarangayWeatherStatus[] = [
    { barangay: 'Poblacion District I', zone: 'Coastal & Urban', lat: 10.5312, lng: 125.1748, condition: 'Partly Cloudy', icon: '⛅', temp: 29.5, rainMm: 0.1, rainProb: 15, riskLevel: 'LOW' },
    { barangay: 'Poblacion District II', zone: 'Coastal & Urban', lat: 10.5360, lng: 125.1720, condition: 'Partly Cloudy', icon: '⛅', temp: 29.4, rainMm: 0.1, rainProb: 15, riskLevel: 'LOW' },
    { barangay: 'Balagawan', zone: 'Lowland Rice Basin', lat: 10.5480, lng: 125.1680, condition: 'Fair Skies', icon: '🌤️', temp: 29.8, rainMm: 0.0, rainProb: 10, riskLevel: 'LOW' },
    { barangay: 'Salvacion', zone: 'Central Rice Plain', lat: 10.5590, lng: 125.1710, condition: 'Partly Cloudy', icon: '⛅', temp: 29.6, rainMm: 0.2, rainProb: 20, riskLevel: 'LOW' },
    { barangay: 'Hingatungan', zone: 'North Coastal Sector', lat: 10.5890, lng: 125.1840, condition: 'Light Shower', icon: '🌦️', temp: 28.9, rainMm: 0.4, rainProb: 30, riskLevel: 'LOW' },
    { barangay: 'Lagoma', zone: 'North Rice Sector', lat: 10.5750, lng: 125.1690, condition: 'Partly Cloudy', icon: '⛅', temp: 29.2, rainMm: 0.1, rainProb: 15, riskLevel: 'LOW' },
    { barangay: 'Mercedes', zone: 'South Rice Sector', lat: 10.5050, lng: 125.1630, condition: 'Clear Skies', icon: '☀️', temp: 30.1, rainMm: 0.0, rainProb: 5, riskLevel: 'LOW' },
    { barangay: 'Katipunan', zone: 'Upland & River Valley', lat: 10.5200, lng: 125.1480, condition: 'Passing Clouds', icon: '☁️', temp: 28.2, rainMm: 0.3, rainProb: 25, riskLevel: 'LOW' },
    { barangay: 'Tubod', zone: 'Upland Rice Terraces', lat: 10.5380, lng: 125.1380, condition: 'Light Drizzle', icon: '🌦️', temp: 27.8, rainMm: 0.5, rainProb: 35, riskLevel: 'MED' },
    { barangay: 'San Isidro', zone: 'Southwest Basin', lat: 10.4850, lng: 125.1580, condition: 'Partly Cloudy', icon: '⛅', temp: 29.7, rainMm: 0.0, rainProb: 10, riskLevel: 'LOW' }
  ];

  return {
    temperature: 29.5,
    apparentTemperature: 33.2,
    humidity: 78,
    precipitation: 0.2,
    rain: 0.2,
    precipitationProbability: 20,
    weatherCode: 2,
    weatherDescription: 'Partly Cloudy with Gentle Sea Breeze',
    weatherIcon: '⛅',
    windSpeed: 12.5,
    windDirection: 68,
    cloudCover: 42,
    isDay: true,
    updatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    advisory,
    hourly,
    barangays
  };
}

/**
 * Fetches real-time weather and hourly precipitation for Silago, Southern Leyte (10.5335°N, 125.1620°E)
 */
export async function fetchSilagoWeather(): Promise<SilagoWeatherData> {
  const lat = 10.5335;
  const lon = 125.1620;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,rain,weather_code&timezone=Asia%2FManila&forecast_days=2`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Weather fetch status ${res.status}`);
    const data = await res.json();

    const current = data.current || {};
    const hourlyData = data.hourly || {};
    const now = new Date();

    const temp = Number(current.temperature_2m ?? 29.0);
    const appTemp = Number(current.apparent_temperature ?? (temp + 3.5));
    const humidity = Number(current.relative_humidity_2m ?? 78);
    const precip = Number(current.precipitation ?? 0);
    const rain = Number(current.rain ?? 0);
    const code = Number(current.weather_code ?? 2);
    const isDay = Boolean(current.is_day ?? 1);
    const windSpeed = Number(current.wind_speed_10m ?? 12);
    const windDir = Number(current.wind_direction_10m ?? 70);
    const cloudCover = Number(current.cloud_cover ?? 40);

    const interp = interpretWmoCode(code, isDay);

    // Compute hourly timeline (next 12 hours from current index)
    const hourly: HourlyWeatherForecast[] = [];
    if (Array.isArray(hourlyData.time)) {
      const currentIsoHour = now.toISOString().slice(0, 13);
      let startIndex = hourlyData.time.findIndex((t: string) => t.startsWith(currentIsoHour));
      if (startIndex === -1) startIndex = 0;

      for (let i = startIndex; i < Math.min(startIndex + 12, hourlyData.time.length); i++) {
        const timeStr = hourlyData.time[i];
        const d = new Date(timeStr);
        const hour = d.getHours();
        const hourStr = `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;
        const hTemp = Number(hourlyData.temperature_2m?.[i] ?? temp);
        const hPrecip = Number(hourlyData.precipitation?.[i] ?? 0);
        const hProb = Number(hourlyData.precipitation_probability?.[i] ?? 10);
        const hCode = Number(hourlyData.weather_code?.[i] ?? code);
        const hInterp = interpretWmoCode(hCode, hour >= 6 && hour < 18);

        let suitability: 'GOOD' | 'FAIR' | 'POOR' = 'GOOD';
        if (hPrecip >= 2.0 || hCode >= 95) suitability = 'POOR';
        else if (hPrecip >= 0.4 || hProb >= 50) suitability = 'FAIR';

        hourly.push({
          time: timeStr,
          hourStr,
          temp: hTemp,
          precipMm: hPrecip,
          precipProb: hProb,
          weatherCode: hCode,
          weatherIcon: hInterp.icon,
          condition: hInterp.condition,
          suitability
        });
      }
    }

    const rainProbCurrent = hourly[0]?.precipProb ?? 15;
    const advisory = calculateFieldVisitAdvisory(precip, rainProbCurrent, code, windSpeed);

    // Sector-specific localized estimate
    const barangays: BarangayWeatherStatus[] = [
      { barangay: 'Poblacion District I', zone: 'Coastal LGU Center', lat: 10.5312, lng: 125.1748, condition: interp.condition, icon: interp.icon, temp, rainMm: precip, rainProb: rainProbCurrent, riskLevel: precip > 2 ? 'HIGH' : precip > 0.4 ? 'MED' : 'LOW' },
      { barangay: 'Poblacion District II', zone: 'Coastal LGU Center', lat: 10.5360, lng: 125.1720, condition: interp.condition, icon: interp.icon, temp, rainMm: precip, rainProb: rainProbCurrent, riskLevel: precip > 2 ? 'HIGH' : precip > 0.4 ? 'MED' : 'LOW' },
      { barangay: 'Balagawan', zone: 'NIA Lowland Basin', lat: 10.5480, lng: 125.1680, condition: interp.condition, icon: interp.icon, temp: temp + 0.3, rainMm: Math.max(0, precip - 0.1), rainProb: rainProbCurrent, riskLevel: precip > 2 ? 'HIGH' : 'LOW' },
      { barangay: 'Salvacion', zone: 'Central Rice Plain', lat: 10.5590, lng: 125.1710, condition: interp.condition, icon: interp.icon, temp, rainMm: precip, rainProb: rainProbCurrent, riskLevel: precip > 2 ? 'HIGH' : 'LOW' },
      { barangay: 'Hingatungan', zone: 'North Coastal Sector', lat: 10.5890, lng: 125.1840, condition: interp.condition, icon: interp.icon, temp: temp - 0.4, rainMm: precip + 0.2, rainProb: Math.min(100, rainProbCurrent + 10), riskLevel: precip + 0.2 > 2 ? 'HIGH' : 'LOW' },
      { barangay: 'Lagoma', zone: 'North Rice Sector', lat: 10.5750, lng: 125.1690, condition: interp.condition, icon: interp.icon, temp, rainMm: precip, rainProb: rainProbCurrent, riskLevel: 'LOW' },
      { barangay: 'Mercedes', zone: 'South Rice Sector', lat: 10.5050, lng: 125.1630, condition: interp.condition, icon: interp.icon, temp: temp + 0.4, rainMm: Math.max(0, precip - 0.2), rainProb: Math.max(0, rainProbCurrent - 5), riskLevel: 'LOW' },
      { barangay: 'Katipunan', zone: 'Upland River Valley', lat: 10.5200, lng: 125.1480, condition: interp.condition, icon: interp.icon, temp: temp - 1.1, rainMm: precip + 0.3, rainProb: Math.min(100, rainProbCurrent + 15), riskLevel: precip + 0.3 > 1.5 ? 'MED' : 'LOW' },
      { barangay: 'Tubod', zone: 'Upland Rice Terraces', lat: 10.5380, lng: 125.1380, condition: interp.condition, icon: interp.icon, temp: temp - 1.6, rainMm: precip + 0.5, rainProb: Math.min(100, rainProbCurrent + 20), riskLevel: precip + 0.5 > 1.5 ? 'MED' : 'LOW' },
      { barangay: 'San Isidro', zone: 'Southwest Basin', lat: 10.4850, lng: 125.1580, condition: interp.condition, icon: interp.icon, temp, rainMm: precip, rainProb: rainProbCurrent, riskLevel: 'LOW' }
    ];

    return {
      temperature: temp,
      apparentTemperature: appTemp,
      humidity,
      precipitation: precip,
      rain,
      precipitationProbability: rainProbCurrent,
      weatherCode: code,
      weatherDescription: interp.description,
      weatherIcon: interp.icon,
      windSpeed,
      windDirection: windDir,
      cloudCover,
      isDay,
      updatedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      advisory,
      hourly,
      barangays
    };
  } catch (err) {
    console.warn('Open-Meteo weather fetch fallback:', err);
    return getFallbackSilagoWeather();
  }
}

/**
 * Fetches real-time RainViewer radar frame maps
 */
export async function fetchRainViewerRadar(): Promise<RainViewerRadarData> {
  const url = 'https://api.rainviewer.com/public/weather-maps.json';

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`RainViewer status ${res.status}`);
    const data = await res.json();

    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = Array.isArray(data.radar?.past) ? data.radar.past : [];
    const nowcast = Array.isArray(data.radar?.nowcast) ? data.radar.nowcast : [];
    const satInfrared = Array.isArray(data.satellite?.infrared) ? data.satellite.infrared : [];

    const frames: RadarFrame[] = [];

    // Past frames (up to last 6 frames, 10 min steps)
    const recentPast = past.slice(-6);
    recentPast.forEach((p: any, idx: number) => {
      const diffMin = (recentPast.length - 1 - idx) * 10;
      const label = diffMin === 0 ? 'Live Radar (Now)' : `-${diffMin} min`;
      frames.push({
        time: p.time,
        path: p.path,
        type: 'past',
        label
      });
    });

    // Nowcast frames (future 30-40 min forecast)
    nowcast.slice(0, 4).forEach((n: any, idx: number) => {
      const futMin = (idx + 1) * 10;
      frames.push({
        time: n.time,
        path: n.path,
        type: 'nowcast',
        label: `+${futMin} min (Forecast)`
      });
    });

    const satelliteFrames: RadarFrame[] = satInfrared.slice(-4).map((s: any, idx: number) => ({
      time: s.time,
      path: s.path,
      type: 'past',
      label: `Sat Cloud -${(3 - idx) * 15}m`
    }));

    // Find index of the latest live past frame
    const currentFrameIndex = recentPast.length > 0 ? recentPast.length - 1 : 0;

    return {
      host,
      generated: data.generated || Date.now(),
      frames: frames.length > 0 ? frames : [{ time: Date.now(), path: '/v2/radar/now', type: 'past', label: 'Live' }],
      satelliteFrames,
      currentFrameIndex
    };
  } catch (err) {
    console.warn('RainViewer API fallback:', err);
    return {
      host: 'https://tilecache.rainviewer.com',
      generated: Date.now(),
      frames: [
        { time: Date.now() - 1200000, path: '', type: 'past', label: '-20 min' },
        { time: Date.now() - 600000, path: '', type: 'past', label: '-10 min' },
        { time: Date.now(), path: '', type: 'past', label: 'Live Radar' },
        { time: Date.now() + 600000, path: '', type: 'nowcast', label: '+10 min (Forecast)' }
      ],
      satelliteFrames: [],
      currentFrameIndex: 2
    };
  }
}
