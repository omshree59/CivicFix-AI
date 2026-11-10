// src/components/ForecastModal.jsx
import React, { useMemo, useState } from 'react';
import {
  X, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle,
  Loader2, Activity, MapPin, BarChart3, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  areasFromIssues,
  buildAreaForecast,
  FORECAST_WINDOW_DAYS,
} from '../services/forecastService';

const ForecastModal = ({ onClose, issues = [] }) => {
  const areas = useMemo(() => areasFromIssues(issues), [issues]);
  const [areaKey, setAreaKey] = useState(() => (areas[0] ? `${areas[0].city}|${areas[0].state}` : 'all'));
  const [focusText, setFocusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedArea = useMemo(() => {
    if (areaKey === 'all') return { city: '', state: '', label: 'All recorded areas' };
    return areas.find((area) => `${area.city}|${area.state}` === areaKey) || { city: '', state: '', label: 'All recorded areas' };
  }, [areaKey, areas]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 700));
      const [forecast] = await Promise.all([
        Promise.resolve(
          buildAreaForecast(issues, {
            city: selectedArea.city || null,
            state: selectedArea.state || null,
            focusText,
          })
        ),
        minLoadingTime,
      ]);
      setResult(forecast);
    } catch (error) {
      console.error('Forecast Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const trajectoryIcon = (trajectory) => {
    if (trajectory === 'rising' || trajectory === 'new') {
      return <TrendingUp className="w-4 h-4 text-rose-400" />;
    }
    if (trajectory === 'falling') {
      return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    }
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const trajectoryLabel = (item) => {
    if (item.trajectory === 'new') return 'New';
    if (item.trajectory === 'rising') {
      return item.changePct != null ? `+${item.changePct}%` : 'Rising';
    }
    if (item.trajectory === 'falling') {
      return item.changePct != null ? `${item.changePct}%` : 'Falling';
    }
    return 'Steady';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-cyan-900/40 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Area Forecast</h2>
          </div>
          <p className="text-indigo-100/90 text-sm">
            Last {FORECAST_WINDOW_DAYS} days of ticket volume by category. Rising potholes or leaks come from real counts, not a one-sentence triage pass.
          </p>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {!result && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Area
                </label>
                <select
                  value={areaKey}
                  onChange={(e) => setAreaKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="all">All recorded areas</option>
                  {areas.map((area) => (
                    <option key={`${area.city}|${area.state}`} value={`${area.city}|${area.state}`}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-400 mb-2 block">
                  Optional focus (potholes, leaks, garbage…)
                </label>
                <textarea
                  value={focusText}
                  onChange={(e) => setFocusText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 text-sm"
                  placeholder="e.g., Are potholes rising near campus roads?"
                />
              </div>

              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Counting last {FORECAST_WINDOW_DAYS} days…
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Build area forecast
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl text-center">
                  <Clock className="w-7 h-7 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Window</p>
                  <p className="text-2xl font-bold text-white mt-1">{result.windowDays} days</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-5 rounded-2xl text-center">
                  <AlertTriangle className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-cyan-200 uppercase font-bold tracking-wider">Tickets</p>
                  <p className="text-2xl font-bold text-white mt-1">{result.sampleSize}</p>
                </div>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" />
                  <h4 className="font-bold text-white leading-snug">{result.headline}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed pl-6">{result.summary}</p>
                <p className="text-[11px] text-slate-500 mt-3 pl-6 font-mono">
                  Area: {result.areaLabel} · recent half vs earlier half of the window
                </p>
              </div>

              {result.watchList?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Watch list</h4>
                  <ul className="space-y-2">
                    {result.watchList.map((line) => (
                      <li
                        key={line}
                        className="text-sm text-slate-200 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.categories.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Category counts
                  </h4>
                  <div className="space-y-2">
                    {result.categories.slice(0, 6).map((item) => (
                      <div
                        key={item.category}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                          result.focusCategory === item.category
                            ? 'bg-indigo-500/10 border-indigo-500/40'
                            : 'bg-slate-950/40 border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{item.category}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.recent} recent · {item.prior} earlier · {item.total} total
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-300">
                          {trajectoryIcon(item.trajectory)}
                          {trajectoryLabel(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full py-3 text-slate-400 hover:text-white font-semibold hover:underline"
              >
                Adjust area or focus
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForecastModal;
