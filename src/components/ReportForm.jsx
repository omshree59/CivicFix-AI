// src/components/ReportForm.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAiAdvice } from '../services/aiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { 
  Disc, Loader2, Send, UploadCloud, Sparkles, ShieldAlert,
  Droplets, Construction, Trash2, Lightbulb, HelpCircle, MapPin, 
  ArrowLeft, CheckCircle, AlertCircle, Zap, Dices, RotateCcw, 
  ChevronDown, ChevronUp, Layers, Check, Info
} from 'lucide-react';

import { INDIAN_LOCATIONS } from '../data/locations';
import { DEMO_PRESETS, getRandomDemoPreset, getCuratedDemoWave } from '../data/demoPresets';
import { generateHeuristicTriage } from '../services/ollamaService';

const ReportForm = ({ onRefresh, user }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '', 
    title: '', 
    description: '',
    state: '',      
    city: '',       
    pincode: '',    
    addressDetail: '' 
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [presetImageUrl, setPresetImageUrl] = useState(null);
  const [activePresetId, setActivePresetId] = useState(null);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [isInjectingWave, setIsInjectingWave] = useState(false);
  const [waveStatus, setWaveStatus] = useState(null); // { type: 'loading' | 'success' | 'error', text: string }
  
  // Validation State
  const [errors, setErrors] = useState({});

  // AI Loading State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);

  const CLOUD_NAME = "dtdkkjk1p"; 
  const UPLOAD_PRESET = "ml_default"; 

  const categories = [
    { id: 'Water Leakage', label: t('cat.Water Leakage') || "Water Leakage", icon: <Droplets className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-blue-600 to-blue-800', shadow: 'shadow-blue-500/30', border: 'border-blue-500/30' },
    { id: 'Potholes', label: t('cat.Potholes') || "Potholes", icon: <Construction className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-orange-600 to-orange-800', shadow: 'shadow-orange-500/30', border: 'border-orange-500/30' },
    { id: 'Garbage', label: t('cat.Garbage') || "Garbage", icon: <Trash2 className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-green-600 to-green-800', shadow: 'shadow-green-500/30', border: 'border-green-500/30' },
    { id: 'Street Light', label: t('cat.Street Light') || "Street Light", icon: <Lightbulb className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-yellow-600 to-yellow-800', shadow: 'shadow-yellow-500/30', border: 'border-yellow-500/30' },
    { id: 'Manhole', label: t('cat.Manhole') || "Manhole", icon: <Disc className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-red-600 to-red-800', shadow: 'shadow-red-500/30', border: 'border-red-500/30' },
    { id: 'Other', label: t('cat.Other') || "Other", icon: <HelpCircle className="w-10 h-10 text-white" />, bg: 'bg-gradient-to-br from-slate-600 to-slate-800', shadow: 'shadow-slate-500/30', border: 'border-slate-500/30' },
  ];

  // Helper to clear specific field error when user types
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCategorySelect = (selectedCategory) => {
    if (selectedCategory !== formData.category) {
        setFormData({ 
            category: selectedCategory, 
            title: '', 
            description: '', 
            state: '', 
            city: '', 
            pincode: '', 
            addressDetail: '' 
        });
        setImage(null);
        setPreview(null);
        setPresetImageUrl(null);
        setActivePresetId(null);
        setAiAdvice(null);
        setErrors({}); // Clear errors on category change
    }
    setStep(2);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setPresetImageUrl(null);
      setAiAdvice(null);
      clearError('image');
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET); 
    data.append("cloud_name", CLOUD_NAME);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
    const result = await res.json();
    return result.secure_url;
  };

  // --- 1-CLICK DEMO PRESET APPLY ---
  const handleApplyPreset = (preset) => {
    setFormData({
      category: preset.category,
      title: preset.title,
      description: preset.complaintText,
      state: preset.state,
      city: preset.city,
      pincode: preset.pincode,
      addressDetail: preset.addressDetail
    });

    setImage(null); // Clear local file picker
    setPreview(preset.imageUrl);
    setPresetImageUrl(preset.imageUrl);
    setActivePresetId(preset.id);
    setAiAdvice(null);
    setErrors({});
    setStep(2); // Auto navigate to step 2 so user immediately sees all inputs

    // Trigger smooth highlight animation
    setIsHighlighting(true);
    setTimeout(() => {
      setIsHighlighting(false);
    }, 1200);
  };

  // --- RANDOM PRESET ---
  const handleRandomPreset = () => {
    const randomPreset = getRandomDemoPreset();
    handleApplyPreset(randomPreset);
  };

  // --- CLEAR FORM ---
  const handleClearForm = () => {
    setFormData({
      category: '',
      title: '',
      description: '',
      state: '',
      city: '',
      pincode: '',
      addressDetail: ''
    });
    setImage(null);
    setPreview(null);
    setPresetImageUrl(null);
    setActivePresetId(null);
    setAiAdvice(null);
    setErrors({});
  };

  // --- MIX & LOAD SYNTHETIC WAVE (5 RANDOM TICKETS) ---
  const handleLoadSyntheticWave = async () => {
    setIsInjectingWave(true);
    setWaveStatus({
      type: 'loading',
      text: 'Injecting 5 diverse AI edge cases into live queue & triggering real-time duplicate/cluster analysis...'
    });

    try {
      const wave = getCuratedDemoWave();

      // Retrieve existing tickets for duplicate detection context
      let existingList = [];
      try {
        const snap = await getDocs(query(collection(db, "issues"), limit(30)));
        existingList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (fetchErr) {
        console.warn("Could not query existing tickets for wave context:", fetchErr);
      }

      for (const preset of wave) {
        const fullLocationString = `${preset.addressDetail}, ${preset.city}, ${preset.state} - ${preset.pincode}`;
        const lat = 12.9716 + (Math.random() - 0.5) * 0.04;
        const lng = 77.5946 + (Math.random() - 0.5) * 0.04;

        // Perform local AI triage evaluation
        const triage = generateHeuristicTriage(
          preset.title,
          preset.complaintText,
          preset.category,
          existingList,
          preset.imageUrl,
          fullLocationString
        );

        const newDocRef = await addDoc(collection(db, "issues"), {
          title: preset.title,
          description: preset.complaintText,
          category: preset.category,
          state: preset.state,
          city: preset.city,
          pincode: preset.pincode,
          addressDetail: preset.addressDetail,
          locationText: fullLocationString,
          location: { lat, lng },
          imageUrl: preset.imageUrl,
          status: "OPEN",
          userId: `demo-judge-${preset.id}`,
          userEmail: "judge-demo@civicfix.ai",
          userName: preset.citizenName,
          aiAnalysis: {
            category: triage.category || preset.category,
            urgency: triage.urgency || preset.urgency,
            urgencyScore: triage.urgencyScore || (preset.urgency === 'Critical' ? 95 : preset.urgency === 'High' ? 80 : 50),
            urgencyReason: triage.urgencyReason || `Automated triage for ${preset.testBadge}`,
            recommendedDepartment: triage.recommendedDepartment || preset.department,
            recommendedAction: triage.recommendedAction || `Dispatch ${preset.department} team with priority ${preset.urgency}.`,
            duplicateAssessment: triage.duplicateAssessment || { isDuplicate: false, confidence: 0 },
            modelUsed: 'Gemma via Ollama (Synthetic Batch)',
            severity: triage.urgency || preset.urgency,
            summary: preset.complaintText.substring(0, 100),
            estimatedTime: triage.estimatedTime || '2-4 Hours',
            impactScope: triage.urgencyScore || 70,
            precautions: triage.precautions || ['Maintain safe distance.'],
            diyFixes: triage.diyFixes || ['Reported to campus triage center.']
          },
          createdAt: serverTimestamp(),
          votes: Math.floor(Math.random() * 4)
        });

        // Add newly created ticket to existingList so downstream duplicate detection links correctly
        existingList.push({
          id: newDocRef.id,
          title: preset.title,
          description: preset.complaintText,
          imageUrl: preset.imageUrl,
          locationText: fullLocationString,
          addressDetail: preset.addressDetail,
          city: preset.city,
          state: preset.state
        });
      }

      if (onRefresh) onRefresh();

      setWaveStatus({
        type: 'success',
        text: '🎉 Successfully loaded 5 Synthetic Edge Case Tickets! Duplicate detection & urgency sorting updated in real time.'
      });

      setTimeout(() => {
        setWaveStatus(null);
      }, 7000);

    } catch (err) {
      console.error("Error loading synthetic wave:", err);
      setWaveStatus({
        type: 'error',
        text: `Error injecting wave: ${err.message}`
      });
      setTimeout(() => {
        setWaveStatus(null);
      }, 5000);
    } finally {
      setIsInjectingWave(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    
    // Validate for AI
    const newErrors = {};
    if (!image && !presetImageUrl) newErrors.image = "An image is required for AI analysis.";
    if (!formData.description && !formData.title) {
        newErrors.description = "Provide a title or description for the AI.";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setAiLoading(true);
    try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
        let existingList = [];
        try {
          const snap = await getDocs(query(collection(db, "issues"), limit(25)));
          existingList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (fetchErr) {
          console.warn("Could not query existing tickets for duplicate check", fetchErr);
        }

        const [advice] = await Promise.all([
            getAiAdvice(image || presetImageUrl, formData.title, formData.description, existingList),
            minLoadingTime
        ]);
        setAiAdvice(advice);
    } catch (error) {
        console.error("AI Generation Error:", error);
        console.warn("AI Generation Notice:", error);
        alert("Notice: Ollama/AI inference encountered an issue. Using built-in local fallback analysis.");
    } finally {
        setAiLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setStep(1);
    setFormData({ category: '', title: '', description: '', state: '', city: '', pincode: '', addressDetail: '' });
    setImage(null);
    setPreview(null);
    setPresetImageUrl(null);
    setActivePresetId(null);
    setAiAdvice(null);
    setErrors({});
    if (onRefresh) onRefresh();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    if (!formData.addressDetail.trim()) newErrors.addressDetail = "Address is required";
    if (!image && !presetImageUrl) newErrors.image = "Image is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    setLoading(true);
    try {
      let imageUrl = presetImageUrl;
      if (image) {
        imageUrl = await uploadToCloudinary(image);
      }
      
      const fullLocationString = `${formData.addressDetail}, ${formData.city}, ${formData.state} - ${formData.pincode}`;
      const safeDefaultLocation = { lat: 12.9716, lng: 77.5946 }; 

      await addDoc(collection(db, "issues"), {
        title: formData.title,
        description: formData.description,
        category: formData.category || aiAdvice?.category || "Other",
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        addressDetail: formData.addressDetail,
        locationText: fullLocationString, 
        location: safeDefaultLocation,
        imageUrl: imageUrl,
        status: "OPEN",
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user?.displayName || 'Anonymous Citizen',
        aiAnalysis: {
            category: formData.category || aiAdvice?.category || "General Civic Issue",
            urgency: aiAdvice?.urgency || aiAdvice?.severity || "Medium",
            urgencyScore: aiAdvice?.urgencyScore || 60,
            urgencyReason: aiAdvice?.urgencyReason || "",
            recommendedDepartment: aiAdvice?.recommendedDepartment || null,
            recommendedAction: aiAdvice?.recommendedAction || null,
            duplicateAssessment: aiAdvice?.duplicateAssessment || null,
            modelUsed: aiAdvice?.modelUsed || 'Gemma via Ollama',
            severity: aiAdvice?.severity || "Medium",
            summary: formData.description.substring(0, 100),
            estimatedTime: aiAdvice?.estimatedTime || null,
            impactScope: aiAdvice?.impactScope || 0,
            precautions: aiAdvice?.precautions || [], 
            diyFixes: aiAdvice?.diyFixes || []        
        },
        createdAt: serverTimestamp(),
        votes: 0
      });

      setIsSubmitted(true);
      setTimeout(() => resetForm(), 4000);

    } catch (err) {
      console.error(err);
      alert("Error submitting report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPincodeOptions = () => {
    if (!formData.state || !formData.city) return [];
    return INDIAN_LOCATIONS[formData.state][formData.city] || [];
  };

  return (
    <div className="w-full h-full flex flex-col justify-center mx-auto">

      {/* --- QUICK-FILL JUDGE DEMO PRESETS BAR --- */}
      <div className="w-full max-w-6xl mx-auto mb-6 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
        
        {/* Top Control Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                  ⚡ Quick-Fill Judge Demo Presets
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  12 AI Edge Cases
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Click any preset to auto-fill title, photo & location without typing, or trigger synthetic wave injection.
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Primary Action Button: Mix & Load Synthetic Wave (5 Random Tickets) */}
            <button
              onClick={handleLoadSyntheticWave}
              disabled={isInjectingWave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-900/40 hover:shadow-indigo-800/60 transition-all active:scale-95 disabled:opacity-50"
              title="Selects 5 diverse edge case tickets and injects them directly into live database with AI triage"
            >
              {isInjectingWave ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Injecting 5 Tickets...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-pink-200" />
                  <span>📦 Mix & Load Synthetic Wave (5 Random Tickets)</span>
                </>
              )}
            </button>

            {/* Random Preset Button */}
            <button
              onClick={handleRandomPreset}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all active:scale-95"
              title="Picks a random preset from the 12 edge cases"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>🎲 Random Preset</span>
            </button>

            {/* Clear Form Button */}
            <button
              onClick={handleClearForm}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all active:scale-95"
              title="Clears all filled form fields"
            >
              <RotateCcw className="w-4 h-4" />
              <span>🧹 Clear</span>
            </button>

            {/* Expand / Collapse Toggle */}
            <button
              onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition-all"
              title={isPresetsExpanded ? "Collapse Presets" : "Expand Presets"}
            >
              {isPresetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Temporary Notification Banner for Wave Loading */}
        {waveStatus && (
          <div className={`mb-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
            waveStatus.type === 'loading' ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200' :
            waveStatus.type === 'success' ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/50' :
            'bg-red-950/60 border-red-500/40 text-red-200'
          }`}>
            {waveStatus.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />}
            {waveStatus.type === 'success' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {waveStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span className="flex-1">{waveStatus.text}</span>
          </div>
        )}

        {/* Collapsible Presets Pill Grid */}
        {isPresetsExpanded && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
              {DEMO_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`group relative text-left p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isActive 
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/80 scale-[1.02]' 
                        : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5 w-full">
                      <span className="font-bold text-xs text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                        {preset.badgeLabel}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Check className="w-3 h-3" /> Loaded
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-auto">
                      <span className="text-[10px] font-semibold text-indigo-300/90 bg-indigo-900/30 border border-indigo-700/40 px-2 py-0.5 rounded-md line-clamp-1">
                        [{preset.testBadge}]
                      </span>
                      <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0">
                        {preset.city}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Presets include high-definition photos and exact Indian locations. Burst Pipe #2 and #3 share identical photos for 100% duplicate verification.
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* SUCCESS SCREEN */}
      {isSubmitted ? (
        <div className="max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-12 text-center animate-in zoom-in duration-500">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-500/20 mb-6 border border-green-500/30">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Report Submitted!</h2>
          <p className="text-lg text-slate-300 mb-8">
            Thank you for making the community safer. The municipal authorities have been notified of the issue.
          </p>
          <button 
            onClick={resetForm}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      ) : (
        <>
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <div className="w-full flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-500 py-4 md:py-6">
               <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-md">{t('citizen.heading') || "What seems to be the problem?"}</h1>
                    <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">{t('citizen.subheading') || "Select a category below or pick a Judge Demo Preset above to auto-fill."}</p>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`relative group overflow-hidden rounded-3xl p-7 md:p-8 min-h-[210px] md:min-h-[250px] text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.99] ${cat.bg} border border-white/10 hover:border-white/30 shadow-xl hover:shadow-2xl ${cat.shadow} flex flex-col justify-between`}
                  >
                    <div className="absolute top-[-20px] right-[-20px] opacity-20 group-hover:opacity-30 transition-opacity transform scale-150 rotate-12">{cat.icon}</div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="bg-white/15 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
                            {cat.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1 shadow-black/10 drop-shadow-md">{cat.label}</h3>
                        </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: DARK FORM */}
          {step === 2 && (
            <div className={`max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in slide-in-from-bottom-10 duration-500 transition-all ${
              isHighlighting ? 'ring-2 ring-indigo-500/70 shadow-[0_0_25px_rgba(99,102,241,0.3)]' : ''
            }`}>
              
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(1)} className="p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl transition-colors text-slate-300">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                      <h2 className="text-xl font-bold text-white">{t('citizen.reportTitle') || "Report Issue"}: {t(`cat.${formData.category}`) || formData.category}</h2>
                  </div>
                </div>

                {activePresetId && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-bold">
                    Demo Preset Active
                  </span>
                )}
              </div>
              
              <form className="p-8 space-y-6">
                
                {/* TITLE INPUT */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Issue Title</label>
                  <input 
                    type="text" 
                    className={`w-full p-4 bg-slate-950/50 border rounded-xl outline-none font-semibold text-white placeholder-slate-600 transition-all ${
                      isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                      errors.title ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                    placeholder={t('citizen.issueTitlePlaceholder') || "e.g., Heavy water leakage near Main Gate"}
                    value={formData.title}
                    onChange={(e) => {
                        setFormData({...formData, title: e.target.value});
                        clearError('title');
                    }}
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.title}</p>}
                </div>

                {/* LOCATION DETAILS */}
                <div className="space-y-4 pt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400"/> {t('citizen.locDetails') || "Location Details"}</label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <select 
                                value={formData.state} 
                                onChange={(e) => {
                                    setFormData({ ...formData, state: e.target.value, city: '', pincode: '' });
                                    clearError('state');
                                }} 
                                className={`w-full p-3 bg-slate-950/50 border rounded-xl outline-none text-sm font-medium text-white custom-select transition-all ${
                                  isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                                  errors.state ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                            >
                                <option value="" className="bg-slate-900 text-slate-400">{t('citizen.selectState') || "Select State"}</option>
                                {Object.keys(INDIAN_LOCATIONS).sort().map(state => <option key={state} value={state} className="bg-slate-900">{state}</option>)}
                            </select>
                            {errors.state && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.state}</p>}
                        </div>

                        <div className="relative">
                            <select 
                                value={formData.city} 
                                onChange={(e) => {
                                    setFormData({ ...formData, city: e.target.value, pincode: '' });
                                    clearError('city');
                                }} 
                                disabled={!formData.state} 
                                className={`w-full p-3 bg-slate-950/50 border rounded-xl outline-none text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                                  isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                                  errors.city ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                            >
                                <option value="" className="bg-slate-900 text-slate-400">{t('citizen.selectCity') || "Select City"}</option>
                                {formData.state && Object.keys(INDIAN_LOCATIONS[formData.state] || {}).sort().map(city => <option key={city} value={city} className="bg-slate-900">{city}</option>)}
                            </select>
                            {errors.city && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.city}</p>}
                        </div>
                    </div>

                    <div className="relative pt-2">
                          <input 
                            list="pincode-options"
                            type="text"
                            placeholder={t('citizen.enterPincode') || "Enter or Select Pincode"}
                            value={formData.pincode}
                            onChange={(e) => {
                                setFormData({...formData, pincode: e.target.value});
                                clearError('pincode');
                            }}
                            disabled={!formData.city}
                            className={`w-full p-3 bg-slate-950/50 border rounded-xl outline-none text-sm font-medium text-white disabled:opacity-50 transition-all ${
                              isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                              errors.pincode ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                          />
                          <datalist id="pincode-options">
                            {getPincodeOptions().map(pin => <option key={pin} value={pin} />)}
                          </datalist>
                          {errors.pincode && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.pincode}</p>}
                    </div>

                    <div className="relative pt-2">
                        <input 
                        type="text" 
                        className={`w-full p-3 bg-slate-950/50 border rounded-xl outline-none text-sm font-medium text-white placeholder-slate-600 transition-all ${
                          isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                          errors.addressDetail ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder={t('citizen.addressPlaceholder') || "Street Name, Landmark, House No."}
                        value={formData.addressDetail}
                        onChange={(e) => {
                            setFormData({...formData, addressDetail: e.target.value});
                            clearError('addressDetail');
                        }}
                        />
                        {errors.addressDetail && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.addressDetail}</p>}
                    </div>
                </div>

                {/* IMAGE AND DESCRIPTION AREA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="group relative h-full">
                        <label className={`flex flex-col items-center justify-center w-full h-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          isHighlighting ? 'border-indigo-500 bg-indigo-950/20' :
                          errors.image ? 'border-red-500/70 bg-red-500/5' : preview ? 'border-blue-500 bg-slate-800/50' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/30'
                        }`}>
                            {preview ? (
                              <div className="relative w-full h-full min-h-[140px]">
                                <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                                {presetImageUrl && (
                                  <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-[10px] text-indigo-300 font-bold px-2 py-0.5 rounded-md border border-indigo-500/30">
                                    Preset Photo
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                                <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${errors.image ? 'text-red-400' : 'group-hover:text-blue-400'}`} />
                                <p className={`text-xs font-bold ${errors.image ? 'text-red-400' : ''}`}>{t('citizen.uploadPhoto') || "Upload Photo"}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Or pick a Judge Preset above to auto-attach</p>
                              </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        {errors.image && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.image}</p>}
                    </div>
                    
                    <div className="relative h-full">
                        <textarea 
                            className={`w-full p-4 bg-slate-950/50 border rounded-xl outline-none text-sm resize-none h-full min-h-[140px] text-white placeholder-slate-600 transition-all ${
                              isHighlighting ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500' :
                              errors.description ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                            placeholder={t('citizen.descPlaceholder') || "Describe the problem in detail..."}
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({...formData, description: e.target.value});
                                clearError('description');
                            }}
                        />
                        {errors.description && <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.description}</p>}
                    </div>
                </div>

                {/* BUTTONS */}
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button onClick={handleAskAI} disabled={aiLoading || loading} className="group bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-indigo-500/30 transition-all active:scale-95 disabled:opacity-50">
                    {aiLoading ? (
                        <><Loader2 className="animate-spin w-5 h-5" /> Analyzing...</>
                    ) : (
                        <><Sparkles className="w-5 h-5 group-hover:text-indigo-200 transition-colors" /> {t('citizen.askAi') || "Ask Gemini"}</>
                    )}
                  </button>
                  
                  <button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />} {t('citizen.submit') || "Submit Report"}
                  </button>
                </div>
              </form>

              {/* AI ADVICE PANEL */}
              {aiAdvice && (
                <div className="p-6 bg-slate-950/80 text-white border-t border-slate-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-2 mb-4">
                       <ShieldAlert className="text-yellow-400 w-5 h-5" />
                       <h3 className="font-bold text-lg">AI Analysis</h3>
                       <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 px-2 py-1 rounded-lg uppercase tracking-wider font-bold">Severity: {aiAdvice.severity || aiAdvice.urgency}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-6 text-sm text-slate-300">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <p className="font-bold text-blue-300 mb-2 uppercase text-xs tracking-wider">Precautions</p>
                        <ul className="list-disc list-inside space-y-1 marker:text-blue-500">{aiAdvice.precautions?.slice(0,3).map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        <p className="font-bold text-green-300 mb-2 uppercase text-xs tracking-wider">Quick Fixes</p>
                        <ul className="list-disc list-inside space-y-1 marker:text-green-500">{aiAdvice.diyFixes?.slice(0,3).map((fix, i) => <li key={i}>{fix}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportForm;
