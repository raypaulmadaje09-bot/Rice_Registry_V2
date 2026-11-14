import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  CloudSun,
  Sun,
  Wind,
  Droplets,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  Compass
} from 'lucide-react';
import {
  SilagoWeatherData,
  RainViewerRadarData,
  RadarFrame
} from '../utils/weatherService';

interface WeatherRadarControlProps {
  weatherData: SilagoWeatherData | null;
  radarData: RainViewerRadarData | null;
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  radarOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  radarMode: 'radar' | 'satellite';
  onChangeRadarMode: (mode: 'radar' | 'satellite') => void;
  showBarangayWeatherMarkers: boolean;
  onToggleBarangayWeatherMarkers: (show: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onPanToBarangay?: (lat: number, lng: number, name: string) => void;
  onClose: () => void;
}

export const WeatherRadarControl: React.FC<WeatherRadarControlProps> = ({
  weatherData,
  radarData,
  currentFrameIndex,
  onSelectFrame,
  isPlaying,
  onTogglePlay,
  radarOpacity,
  onChangeOpacity,
  radarMode,
  onChangeRadarMode,
  showBarangayWeatherMarkers,
  onToggleBarangayWeatherMarkers,
  onRefresh,
  isLoading,
  onPanToBarangay,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'forecast' | 'barangays'>('radar');

  const currentFrame: RadarFrame | undefined =
    radarMode === 'satellite'
      ? radarData?.satelliteFrames[currentFrameIndex] || radarData?.satelliteFrames[0]
      : radarData?.frames[currentFrameIndex] || radarData?.frames[0];

  const frames = radarMode === 'satellite' ? radarData?.satelliteFrames || [] : radarData?.frames || [];

  if (!weatherData) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl text-white overflow-hidden max-w-sm sm:max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
      {/* Top Banner Header */}
      <div className="p-3 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <CloudRain className="w-4 h-4 text-sky-300 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black tracking-wide uppercase text-slate-200">
                Silago Weather &amp; Radar
              </h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              DA-MAO LFT Field Visit Meteorological Planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${isLoading ? 'animate-spin text-blue-400' : ''}`}
            title="Refresh weather data & radar frames"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMinimized ? 'Expand weather dock' : 'Minimize weather dock'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Hide weather layer overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stats Bar (Always Visible even when minimized) */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{weatherData.weatherIcon}</span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white font-mono">
                {weatherData.temperature.toFixed(1)}°C
              </span>
              <span className="text-[10.5px] text-slate-400">
                (Feels {weatherData.apparentTemperature.toFixed(1)}°)
              </span>
            </div>
            <div className="text-[11px] font-bold text-sky-300">
              {weatherData.weatherDescription}
            </div>
          </div>
        </div>

        {/* LFT Advisory Badge */}
        <div className={`px-2.5 py-1.5 rounded-xl border flex flex-col items-end text-right ${weatherData.advisory.badgeBg} ${weatherData.advisory.badgeBorder}`}>
          <div className="flex items-center gap-1">
            {weatherData.advisory.status === 'EXCELLENT' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertTriangle className={`w-3 h-3 ${weatherData.advisory.badgeText}`} />
            )}
            <span className={`text-[10px] font-extrabold uppercase tracking-wide ${weatherData.advisory.badgeText}`}>
              {weatherData.advisory.title}
            </span>
          </div>
          <span className="text-[9px] text-slate-300 font-medium">
            Rain: {weatherData.precipitation.toFixed(1)} mm/h • {weatherData.humidity}% RH
          </span>
        </div>
      </div>

      {/* Expandable Body */}
      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Quick Tab Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Precipitation Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('forecast')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'forecast'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hourly Forecast</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('barangays')}
              className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'barangays'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Barangays ({weatherData.barangays.length})</span>
            </button>
          </div>

          {/* TAB 1: RADAR CONTROLS */}
          {activeTab === 'radar' && (
            <div className="space-y-2.5">
              {/* Radar Mode & Marker Toggles */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onChangeRadarMode('radar')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                      radarMode === 'radar'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌧️ Rain Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeRadarMode('satellite')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                      radarMode === 'satellite'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ☁️ Cloud Sat
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBarangayWeatherMarkers}
                    onChange={(e) => onToggleBarangayWeatherMarkers(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-slate-800 border-slate-700"
                  />
                  <span>Barangay Badges</span>
                </label>
              </div>

              {/* Radar Playback Timeline Controls */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-extrabold text-blue-400 flex items-center gap-1 font-mono">
                    <span>Frame:</span>
                    <strong className="text-white">{currentFrame?.label || 'Live Radar'}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentFrame?.type === 'nowcast' ? '🔮 Nowcast Prediction' : '🛰️ Satellite Ground Radar'}
                  </span>
                </div>

                {/* Timeline Slider */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
                    disabled={currentFrameIndex <= 0}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
                    title="Previous frame (-10 min)"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className={`p-1.5 rounded-lg font-bold text-white transition flex items-center justify-center ${
                      isPlaying
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title={isPlaying ? 'Pause radar loop' : 'Play radar loop'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
                    disabled={currentFrameIndex >= frames.length - 1}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition text-white"
                    title="Next frame (+10 min)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, frames.length - 1)}
                    step={1}
                    value={currentFrameIndex}
                    onChange={(e) => onSelectFrame(Number(e.target.value))}
                    className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Opacity Slider */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-400" />
                    <span>Layer Opacity:</span>
                    <strong className="text-slate-200 font-mono">{Math.round(radarOpacity * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.0}
                    step={0.05}
                    value={radarOpacity}
                    onChange={(e) => onChangeOpacity(Number(e.target.value))}
                    className="w-24 accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* LFT Advisory Detail in Bisaya / English */}
              <div className={`p-2.5 rounded-xl border text-xs ${weatherData.advisory.badgeBg} ${weatherData.advisory.badgeBorder}`}>
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-white block text-[11px]">
                      {weatherData.advisory.bisayaTitle}
                    </strong>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                      {weatherData.advisory.description}
                    </p>
                    <p className="text-[10px] text-amber-200 font-semibold mt-1 flex items-center gap-1">
                      <span>💡 Tambag sa LFT:</span> <span>{weatherData.advisory.actionTip}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOURLY FORECAST */}
          {activeTab === 'forecast' && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Next 12 Hours Field Viability:</span>
                <span className="text-[9.5px] text-slate-400 font-mono">Open-Meteo Precision</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {weatherData.hourly.map((h, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-between ${
                      h.suitability === 'GOOD'
                        ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50'
                        : h.suitability === 'FAIR'
                        ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-500'
                        : 'bg-rose-950/30 border-rose-800/50 hover:border-rose-500'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono block">{h.hourStr}</span>
                    <span className="text-base my-0.5">{h.weatherIcon}</span>
                    <span className="text-xs font-bold text-white font-mono">{h.temp.toFixed(0)}°</span>
                    <span className={`text-[9px] font-bold mt-0.5 ${h.precipMm > 0 ? 'text-sky-300 font-mono' : 'text-slate-500'}`}>
                      {h.precipMm > 0 ? `${h.precipMm.toFixed(1)}mm` : 'Dry'}
                    </span>
                    <span className={`text-[8.5px] font-extrabold px-1 rounded-sm mt-1 uppercase ${
                      h.suitability === 'GOOD'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : h.suitability === 'FAIR'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {h.suitability === 'GOOD' ? 'Ideal' : h.suitability === 'FAIR' ? 'Fair' : 'Risk'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BARANGAYS WEATHER STATUS */}
          {activeTab === 'barangays' && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[10.5px] text-slate-400 pb-1 flex items-center justify-between">
                <span>Select a barangay to inspect &amp; pan map:</span>
                <span className="text-[9.5px] text-sky-400">Click to Fly</span>
              </div>
              {weatherData.barangays.map((b) => (
                <div
                  key={b.barangay}
                  onClick={() => onPanToBarangay?.(b.lat, b.lng, b.barangay)}
                  className="p-2 bg-slate-950/60 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 rounded-xl flex items-center justify-between cursor-pointer transition text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{b.icon}</span>
                    <div>
                      <span className="font-bold text-white block group-hover:text-sky-300 transition">
                        {b.barangay}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {b.zone} • {b.condition}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white font-mono block">
                      {b.temp.toFixed(1)}°C
                    </span>
                    <span className={`text-[9.5px] font-bold ${b.rainMm > 0 ? 'text-sky-300' : 'text-slate-400'}`}>
                      {b.rainMm > 0 ? `Rain ${b.rainMm.toFixed(1)}mm` : '0 mm rain'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
