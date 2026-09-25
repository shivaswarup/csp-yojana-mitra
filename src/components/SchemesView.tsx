import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Building2, 
  Sparkles, 
  ArrowUpDown, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme, SchemeCategory } from '../types';
import { SchemeCard } from './SchemeCard';
import { useApp } from '../context/AppContext';
import { evaluateSchemeEligibility } from '../utils/recommendationEngine';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/statesAndDistricts';

interface SchemesViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

const CATEGORIES: ('All' | SchemeCategory)[] = [
  'All',
  'Scholarships',
  'Education',
  'Agriculture',
  'Women',
  'Employment',
  'Business',
  'Pension',
  'Health',
  'Housing',
  'Social Security'
];

const FILTER_STATES = [
  'All States',
  ...ALL_INDIAN_STATES
];

export const SchemesView: React.FC<SchemesViewProps> = ({ onSelectScheme }) => {
  const { currentUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | SchemeCategory>('All');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedLevel] = useState<'State'>('State');
  const [sortBy, setSortBy] = useState<'relevance' | 'deadline' | 'name'>('relevance');
  const [localSearch, setLocalSearch] = useState('');

  // AI Live Search Grounding state
  const [liveAiQuery, setLiveAiQuery] = useState('');
  const [liveAiLoading, setLiveAiLoading] = useState(false);
  const [liveAiResult, setLiveAiResult] = useState<{ summary: string; groundingUrls: { title: string; uri: string }[] } | null>(null);

  const filteredSchemes = useMemo(() => {
    let result = SCHEMES_DATABASE.filter(s => s.governmentLevel === 'State');

    // Filter category
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Filter state
    if (selectedState !== 'All States') {
      result = result.filter(s => s.state === selectedState);
    }

    // Filter district
    if (selectedDistrict !== 'All Districts' && selectedState !== 'All States') {
      const distLower = selectedDistrict.toLowerCase();
      result = result.filter(s => 
        s.shortDescription.toLowerCase().includes(distLower) ||
        s.description.toLowerCase().includes(distLower) ||
        s.tags.some(t => t.toLowerCase().includes(distLower)) ||
        s.eligibility.some(e => e.toLowerCase().includes(distLower)) ||
        s.state === selectedState // Still eligible if state matches
      );
    }

    // Filter search text (including state, level, and department)
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.governmentLevel.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.eligibility.some(e => e.toLowerCase().includes(q)) ||
        (q.includes('state') && s.governmentLevel === 'State')
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
  }, [selectedCategory, selectedState, selectedLevel, sortBy, localSearch, currentUser]);

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
          state: selectedState !== 'All States' ? selectedState : undefined,
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
            <span>State Government Schemes & Scholarships Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse, filter, and verify State government welfare programs and financial entitlements.
          </p>
        </div>
        <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
          Showing <strong>{filteredSchemes.length}</strong> verified state schemes
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-sm">
        
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by state scheme name, category, or department..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:bg-white focus:outline-hidden focus:border-emerald-600"
            >
              <option value="relevance">Profile Relevance</option>
              <option value="deadline">Application Deadline</option>
              <option value="name">Scheme Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* State, District & Level Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-600">State / Region:</span>
            
            {/* Quick State Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedState('All States');
                  setSelectedDistrict('All Districts');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedState === 'All States'
                    ? 'bg-emerald-800 text-white border-emerald-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                All States
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedState('Andhra Pradesh');
                  setSelectedDistrict('All Districts');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedState === 'Andhra Pradesh'
                    ? 'bg-amber-800 text-white border-amber-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Andhra Pradesh
              </button>
            </div>

            <select
              value={selectedState}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedState(val);
                setSelectedDistrict('All Districts');
              }}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 text-xs focus:outline-hidden focus:border-emerald-600 min-h-[32px] cursor-pointer"
            >
              {FILTER_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {selectedState !== 'All States' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 text-xs focus:outline-hidden focus:border-emerald-600 min-h-[36px]"
              >
                <option value="All Districts">All Districts ({getDistrictsForState(selectedState).length})</option>
                {getDistrictsForState(selectedState).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-600">Level:</span>
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-900 font-bold text-xs">
              🏛️ State Government
            </div>
          </div>

          {/* Quick State Filter Badges */}
          <div className="flex items-center gap-1.5 ml-auto">
            {currentUser?.state && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState(currentUser.state);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedState === currentUser.state
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                🏛️ {currentUser.state} Schemes
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedState('All States')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer border transition-colors ${
                selectedState === 'All States'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              🏛️ All States
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Live Portal Scheme Finder Accordion / Box */}
      <div className="bg-stone-100 rounded-xl border border-stone-200 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <Globe className="w-4 h-4 text-emerald-800" />
            <span>Search Active Government Portals with Google Search</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
            Live Search Grounding
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Looking for a specific state-level notification or rare fellowship not in our quick directory? Search all `.gov.in` and `.nic.in` sources directly:
        </p>

        <form onSubmit={handleLiveAiSearch} className="flex gap-2">
          <input
            type="text"
            value={liveAiQuery}
            onChange={(e) => setLiveAiQuery(e.target.value)}
            placeholder="e.g. AP Post Matric Scholarship (Jnanabhumi) 2026 or Annadata Sukhibhava DBT..."
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
            <div className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Grounded Portal Information</span>
            </div>
            <div className="text-stone-700 leading-relaxed whitespace-pre-line text-xs font-normal">
              {liveAiResult.summary}
            </div>

            {liveAiResult.groundingUrls.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-1.5">
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Verified Official Government Sources:
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
          <p className="text-stone-700 font-bold text-sm">No schemes match selected filters</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedState('All States'); setLocalSearch(''); }}
            className="px-4 py-2 text-xs font-bold bg-emerald-800 text-white rounded-lg hover:bg-emerald-700"
          >
            Reset All Filters
          </button>
        </div>
      )}

    </div>
  );
};
