import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Filter, 
  ArrowUpDown, 
  ExternalLink,
  ShieldCheck,
  Globe,
  RotateCw,
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  Check
} from 'lucide-react';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme, SchemeCategory } from '../types';
import { SchemeCard } from './SchemeCard';
import { useApp } from '../context/AppContext';
import { evaluateSchemeEligibility } from '../utils/recommendationEngine';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/statesAndDistricts';
import { generateSchemesCSV, generateSchemesJSON, triggerDownload } from '../utils/exportUtils';

interface SchemesViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

const CATEGORIES: ('All' | SchemeCategory)[] = [
  'All',
  'Agriculture',
  'Scholarships',
  'Women',
  'Pension',
  'Education',
  'Health',
  'Employment',
  'Business',
  'Social Security'
];

export const SchemesView: React.FC<SchemesViewProps> = ({ onSelectScheme }) => {
  const { currentUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | SchemeCategory>('All');
  const [selectedState] = useState<string>('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [sortBy, setSortBy] = useState<'relevance' | 'deadline' | 'name'>('relevance');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // AI Live Search Grounding state
  const [liveAiQuery, setLiveAiQuery] = useState('');
  const [liveAiLoading, setLiveAiLoading] = useState(false);
  const [liveAiResult, setLiveAiResult] = useState<{ summary: string; groundingUrls: { title: string; uri: string }[] } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateSchemesCSV(SCHEMES_DATABASE);
    triggerDownload(csvContent, 'andhra_pradesh_farmer_student_women_senior_schemes.csv', 'text/csv;charset=utf-8;');
    setDownloadSuccess('CSV downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadJSON = () => {
    const jsonContent = generateSchemesJSON(SCHEMES_DATABASE);
    triggerDownload(jsonContent, 'andhra_pradesh_farmer_student_women_senior_schemes.json', 'application/json;charset=utf-8;');
    setDownloadSuccess('JSON downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const filteredSchemes = useMemo(() => {
    let result = SCHEMES_DATABASE.filter(s => s.state === 'Andhra Pradesh' || s.governmentLevel === 'State');

    // Filter category
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Filter district
    if (selectedDistrict !== 'All Districts') {
      const distLower = selectedDistrict.toLowerCase();
      result = result.filter(s => 
        s.shortDescription.toLowerCase().includes(distLower) ||
        s.description.toLowerCase().includes(distLower) ||
        s.tags.some(t => t.toLowerCase().includes(distLower)) ||
        s.eligibility.some(e => e.toLowerCase().includes(distLower)) ||
        s.state === 'Andhra Pradesh'
      );
    }

    // Sort
    if (sortBy === 'relevance' && currentUser) {
      result.sort((a, b) => {
        const scoreA = evaluateSchemeEligibility(a, currentUser).matchScore;
        const scoreB = evaluateSchemeEligibility(b, currentUser).matchScore;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => (a.deadlineDate || '9999').localeCompare(b.deadlineDate || '9999'));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedCategory, selectedDistrict, sortBy, currentUser]);

  const handleLiveAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveAiQuery.trim()) return;

    setLiveAiLoading(true);
    setLiveAiResult(null);

    try {
      const res = await fetch('/api/ai/search-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: liveAiQuery,
          state: 'Andhra Pradesh',
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          userProfile: currentUser
        })
      });
      const data = await res.json();
      setLiveAiResult(data);
    } catch (err) {
      console.error('Error during AI live search:', err);
    } finally {
      setLiveAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-800" />
            <span>Andhra Pradesh Schemes &amp; Scholarships Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Official government welfare programs and scholarship schemes for Farmers, Students, Women, and Senior Citizens in Andhra Pradesh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Download CSV & JSON buttons */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Download CSV File of all Farmer, Student, Women & Senior Citizen Schemes"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Download JSON File of all Farmer, Student, Women & Senior Citizen Schemes"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-300" />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh scheme results"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : 'text-emerald-800'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Download Alert Banner */}
      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{downloadSuccess} Complete dataset of Farmer, Student, Women &amp; Senior Citizen schemes exported.</span>
          </div>
          <button onClick={() => setDownloadSuccess(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-sm">
        
        {/* State, District & Level Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">State:</span>
              <div className="bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg border border-emerald-900 shadow-2xs">
                Andhra Pradesh
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-xs font-medium focus:outline-hidden focus:border-emerald-600 min-h-[34px] cursor-pointer"
              >
                <option value="All Districts">All 26 AP Districts</option>
                {getDistrictsForState('Andhra Pradesh').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">Level:</span>
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-900 font-bold text-xs">
                State Government
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800 font-medium focus:bg-white focus:outline-hidden focus:border-emerald-600"
            >
              <option value="relevance">Profile Relevance</option>
              <option value="deadline">Application Deadline</option>
              <option value="name">Scheme Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills (Farmers, Students/Scholarships, Women, Senior Citizens, etc.) */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Filter by Target Group / Category:
            </span>
            <div className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
              Showing <strong>{filteredSchemes.length}</strong> schemes
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              let label = cat;
              if (cat === 'Agriculture') label = '🌾 Farmers & Agriculture' as any;
              if (cat === 'Scholarships') label = '🎓 Students & Scholarships' as any;
              if (cat === 'Women') label = '👩 Women Empowerment' as any;
              if (cat === 'Pension') label = '👴 Senior Citizens & Pension' as any;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Live Portal Scheme Finder Accordion / Box */}
      <div className="bg-stone-100 rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Globe className="w-4 h-4 text-emerald-800" />
            <span>Verify Live AP Government Portals</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
            AP State Portals
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Search live active notifications directly across official `.gov.in` and `.ap.gov.in` portals:
        </p>

        <form onSubmit={handleLiveAiSearch} className="flex gap-2">
          <input
            type="text"
            value={liveAiQuery}
            onChange={(e) => setLiveAiQuery(e.target.value)}
            placeholder="e.g. Annadata Sukhibhava 2026, Thalliki Vandanam, Maha Shakti Aadabidda Nidhi, NTR Bharosa Pension..."
            className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={liveAiLoading || !liveAiQuery.trim()}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-stone-300 text-white text-xs font-bold rounded-lg shrink-0 shadow-xs transition-colors"
          >
            {liveAiLoading ? 'Searching...' : 'Search Portals'}
          </button>
        </form>

        {/* Live Search Results */}
        {liveAiResult && (
          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3 mt-3 text-xs shadow-xs animate-in fade-in">
            <div className="font-bold text-stone-900 flex items-center justify-between gap-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Grounded AP Portal Information</span>
              </div>
              <button
                type="button"
                onClick={() => setLiveAiResult(null)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                title="Close results"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-stone-700 leading-relaxed whitespace-pre-line text-xs font-normal">
              {liveAiResult.summary}
            </div>

            {liveAiResult.groundingUrls.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Verified Official AP Government Sources:
                </div>
                <div className="flex flex-wrap gap-2">
                  {liveAiResult.groundingUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 text-xs transition-colors"
                    >
                      <span className="truncate max-w-[200px]">{url.title}</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme) => {
          const rec = currentUser ? evaluateSchemeEligibility(scheme, currentUser) : undefined;
          return (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              recommendation={rec}
              onViewDetails={onSelectScheme}
            />
          );
        })}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-3">
          <p className="text-stone-700 font-bold text-sm">No schemes match selected category</p>
          <button
            onClick={() => { setSelectedCategory('All'); }}
            className="px-4 py-2 text-xs font-bold bg-emerald-800 text-white rounded-lg hover:bg-emerald-700"
          >
            Show All Andhra Pradesh Schemes
          </button>
        </div>
      )}

    </div>
  );
};

