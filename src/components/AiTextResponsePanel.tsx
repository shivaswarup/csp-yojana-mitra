import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  MessageSquare, 
  ExternalLink, 
  X, 
  Clock, 
  ShieldCheck,
  Building2,
  Landmark,
  Globe,
  FileCheck2,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Scheme } from '../types';
import { STATE_SCHEMES } from '../data/stateSchemes';
import { getOfficialPortalsForState, OfficialPortalInfo } from '../data/statePortals';
import { ensureAbsoluteUrl, normalizeGovernmentUrl } from '../utils/urlUtils';

interface AiTextResponsePanelProps {
  title: string;
  subtitle?: string;
  response: string;
  timestamp?: string;
  theme?: 'amber' | 'emerald' | 'indigo';
  onClear?: () => void;
  onClose?: () => void;
  discussPrompt?: string;
  stateName?: string;
  relevantSchemes?: Scheme[];
}

export const AiTextResponsePanel: React.FC<AiTextResponsePanelProps> = ({
  title,
  subtitle,
  response,
  timestamp,
  theme = 'emerald',
  onClear,
  onClose,
  discussPrompt,
  stateName,
  relevantSchemes
}) => {
  const { openChatbotWithPrompt } = useApp();
  const [copied, setCopied] = useState(false);

  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'amber':
        return {
          wrapper: 'bg-emerald-50/60 border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          iconBg: 'bg-emerald-800 text-white',
          titleColor: 'text-emerald-950',
          borderColor: 'border-emerald-200',
          discussBtn: 'bg-emerald-800 hover:bg-emerald-700 text-white',
          linkBadge: 'bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 border-emerald-300',
          portalCard: 'bg-emerald-50/80 border-emerald-300/80 hover:border-emerald-400',
          portalBtn: 'bg-emerald-800 hover:bg-emerald-700 text-white'
        };
      case 'indigo':
        return {
          wrapper: 'bg-indigo-50/60 border-indigo-300',
          badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          iconBg: 'bg-indigo-700 text-white',
          titleColor: 'text-indigo-950',
          borderColor: 'border-indigo-200',
          discussBtn: 'bg-indigo-700 hover:bg-indigo-800 text-white',
          linkBadge: 'bg-indigo-100/90 text-indigo-900 hover:bg-indigo-200 border-indigo-300',
          portalCard: 'bg-indigo-50/80 border-indigo-300/80 hover:border-indigo-400',
          portalBtn: 'bg-indigo-800 hover:bg-indigo-900 text-white'
        };
      case 'emerald':
      default:
        return {
          wrapper: 'bg-emerald-50/60 border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          iconBg: 'bg-emerald-800 text-white',
          titleColor: 'text-emerald-950',
          borderColor: 'border-emerald-200',
          discussBtn: 'bg-emerald-800 hover:bg-emerald-700 text-white',
          linkBadge: 'bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 border-emerald-300',
          portalCard: 'bg-emerald-50/80 border-emerald-300/80 hover:border-emerald-400',
          portalBtn: 'bg-emerald-800 hover:bg-emerald-900 text-white'
        };
    }
  }, [theme]);

  // Extract all official .gov.in or https:// URLs found in the AI response
  const extractedUrls = useMemo(() => {
    if (!response) return [];
    const urlRegex = /(https?:\/\/[^\s\)\],]+)/g;
    const matches = response.match(urlRegex) || [];
    const seen = new Set<string>();
    const list: { url: string; label: string; domain: string }[] = [];

    matches.forEach(rawUrl => {
      const { activeUrl, displayLabel } = normalizeGovernmentUrl(rawUrl);
      if (seen.has(activeUrl)) return;
      seen.add(activeUrl);

      list.push({ url: activeUrl, label: displayLabel, domain: displayLabel });
    });

    return list;
  }, [response]);

  // Find schemes specifically mentioned in the AI response or relevant to state
  const mentionedSchemesWithLinks = useMemo(() => {
    if (!response) return [];
    const pool = relevantSchemes && relevantSchemes.length > 0 
      ? relevantSchemes 
      : (stateName ? STATE_SCHEMES.filter(s => s.state.toLowerCase() === stateName.toLowerCase()) : []);

    const lowerResponse = response.toLowerCase();
    const matches: { scheme: Scheme; officialUrl: string }[] = [];
    const seen = new Set<string>();

    pool.forEach(s => {
      if (seen.has(s.id)) return;

      const nameWords = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['scheme', 'yojana', 'telangana', 'state', 'government', 'pratibha', 'vikas'].includes(w));
      const isMentioned = lowerResponse.includes(s.name.toLowerCase()) ||
        (s.slug && lowerResponse.includes(s.slug.toLowerCase())) ||
        (nameWords.length > 0 && nameWords.filter(w => lowerResponse.includes(w)).length >= 2);

      if (isMentioned && s.officialWebsite) {
        seen.add(s.id);
        matches.push({
          scheme: s,
          officialUrl: s.officialWebsite
        });
      }
    });

    return matches;
  }, [response, relevantSchemes, stateName]);

  // Verified Official Portals directory for the state
  const statePortalsList: OfficialPortalInfo[] = useMemo(() => {
    if (!stateName) return [];
    return getOfficialPortalsForState(stateName, response);
  }, [stateName, response]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy AI response:', err);
    }
  };

  // Helper to render markdown-formatted text lines
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Horizontal rules
      if (line.trim() === '---' || line.trim() === '***') {
        return <hr key={idx} className={`my-3 border-t ${themeStyles.borderColor}`} />;
      }

      // Check if line is a "Document Requirements" or "Documents Required" callout
      const isDocReqLine = /^(\*\*|#|\-\s*)?(Document Requirements?|Documents Required|Required Documents|పత్రాలు|అవసరమైన పత్రాలు)\s*(\(Documents Required\))?[:\*\*]/i.test(line.trim());
      if (isDocReqLine) {
        return (
          <div key={idx} className="my-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/90 text-xs text-stone-800 flex items-start gap-2.5 shadow-2xs">
            <span className="p-1 rounded bg-emerald-100 text-emerald-900 shrink-0 mt-0.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-800" />
            </span>
            <div className="flex-1 min-w-0">
              {renderInlineFormatting(line)}
            </div>
          </div>
        );
      }
      const isOfficialLinkLine = /official\s+(application\s+)?(link|portal|website)/i.test(line);
      const linkMatchInLine = line.match(/(https?:\/\/[^\s\)\],]+)/);

      if (isOfficialLinkLine && linkMatchInLine) {
        const { activeUrl, displayLabel, mirrorUrl } = normalizeGovernmentUrl(linkMatchInLine[1]);

        return (
          <div 
            key={idx} 
            className="my-3 p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Official Application Portal</span>
                </span>
                <span className="text-xs font-bold text-stone-950 block truncate">
                  {displayLabel}
                </span>
                <span className="text-[11px] text-stone-600 truncate block max-w-md">
                  {activeUrl}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
              >
                <span>Apply on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={mirrorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
                title="Alternative mirror on myScheme.gov.in"
              >
                <span>myScheme Portal</span>
                <ExternalLink className="w-3 h-3 text-stone-500" />
              </a>
            </div>
          </div>
        );
      }

      // Headers
      if (line.startsWith('### ')) {
        const headerText = line.replace('### ', '');
        return (
          <h4 key={idx} className="font-bold text-stone-900 text-sm sm:text-base mt-4 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded bg-emerald-600 inline-block shrink-0" />
            <span>{renderInlineFormatting(headerText)}</span>
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        const headerText = line.replace('## ', '');
        return (
          <h3 key={idx} className="font-black text-stone-900 text-base sm:text-lg mt-5 mb-2 pb-1 border-b border-stone-200">
            {renderInlineFormatting(headerText)}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        const headerText = line.replace('# ', '');
        return (
          <h2 key={idx} className="font-black text-stone-950 text-lg sm:text-xl mt-6 mb-2">
            {renderInlineFormatting(headerText)}
          </h2>
        );
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const bulletText = line.replace(/^[\-\*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1 ml-2 text-stone-800 text-xs sm:text-sm leading-relaxed">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
            <div className="flex-1">{renderInlineFormatting(bulletText)}</div>
          </div>
        );
      }

      // Numbered items (e.g. 1. 2. 3.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1 ml-2 text-stone-800 text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-stone-900 shrink-0 text-xs bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
              {numberedMatch[1]}
            </span>
            <div className="flex-1">{renderInlineFormatting(numberedMatch[2])}</div>
          </div>
        );
      }

      // Blank lines
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // Standard paragraph line
      return (
        <p key={idx} className="text-stone-800 text-xs sm:text-sm leading-relaxed my-1">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  // Helper for inline markdown: bold (**text**), italics (*text*), markdown links ([text](url)), and raw URLs (https://...)
  const renderInlineFormatting = (text: string) => {
    // Combined regex for markdown link [Label](url) OR raw URL or domain (e.g. scholarships.gov.in, https://...)
    const combinedRegex = /(\[([^\]]+)\]\(([^\)]+)\)|https?:\/\/[^\s\)\],]+|\b[a-zA-Z0-9.-]+\.(gov\.in|cgg\.gov\.in|nic\.in|in|org|com|co\.in)\b[^\s\)\],]*)/g;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(parseBoldAndCode(text.substring(lastIndex, match.index), segments.length));
      }

      const fullMatch = match[0];
      let url = fullMatch;
      let label = fullMatch;

      if (match[2] && match[3]) {
        // It's a markdown link [Label](url)
        label = match[2];
        const normalized = normalizeGovernmentUrl(match[3]);
        url = normalized.activeUrl;
      } else {
        // Clean raw url/domain
        const cleanUrl = fullMatch.replace(/[\.\,\;\:\)\*\_]+$/, '');
        const normalized = normalizeGovernmentUrl(cleanUrl);
        url = normalized.activeUrl;
        label = normalized.displayLabel;
      }

      segments.push(
        <a
          key={`link-${segments.length}`}
          href={ensureAbsoluteUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald-900 hover:text-emerald-950 underline decoration-emerald-500 hover:decoration-2 transition-all mx-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
          title={`Visit official government portal: ${ensureAbsoluteUrl(url)}`}
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      );
      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push(parseBoldAndCode(text.substring(lastIndex), segments.length));
    }

    return segments.length > 0 ? segments : parseBoldAndCode(text, 0);
  };

  const parseBoldAndCode = (rawText: string, baseKey: number) => {
    // Match bold **text** or `code`
    const parts = rawText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      const key = `${baseKey}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-bold text-stone-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-900 font-mono text-[11px] border border-stone-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`rounded-2xl border ${themeStyles.wrapper} p-5 sm:p-7 shadow-xs space-y-5 animate-in fade-in duration-300`}>
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${themeStyles.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold ${themeStyles.titleColor}`}>
                {title}
              </h3>
              <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${themeStyles.badgeBg}`}>
                <ShieldCheck className="w-3 h-3" />
                <span>AI Verified</span>
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-stone-600 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {timestamp && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-stone-500 font-medium mr-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{timestamp}</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 shadow-2xs transition-colors cursor-pointer"
            title="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          {discussPrompt && (
            <button
              onClick={() => openChatbotWithPrompt(discussPrompt)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 ${themeStyles.discussBtn} rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer`}
              title="Open full interactive consultation in AI Chatbot"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss in Chat</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 text-stone-600 hover:text-red-700 rounded-xl border border-stone-200 hover:border-red-200 shadow-2xs transition-colors cursor-pointer text-xs font-semibold"
              title="Close and dismiss evaluated schemes"
            >
              <X className="w-4 h-4 text-stone-500 hover:text-red-700" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main AI Text Response Panel */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="prose prose-stone max-w-none">
          {renderFormattedMarkdown(response)}
        </div>
      </div>

      {/* DEDICATED OFFICIAL LINKS SECTION: GUARANTEED OFFICIAL PORTAL LINKS FOR EVERY MENTIONED SCHEME */}
      {mentionedSchemesWithLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-300 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 text-emerald-800" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Direct Official Application Links for Mentioned State Schemes
                </h4>
                <p className="text-[11px] text-stone-500">
                  Verified government portals for each scheme identified above
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 shrink-0">
              {mentionedSchemesWithLinks.length} Official Links
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {mentionedSchemesWithLinks.map(({ scheme, officialUrl }) => (
              <div 
                key={scheme.id}
                className="bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-200/80 hover:border-emerald-400 p-3.5 flex flex-col justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {scheme.state} State
                    </span>
                    <span className="text-[10px] text-stone-500 font-semibold truncate">
                      {scheme.category}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-stone-900 leading-snug">
                    {scheme.name}
                  </h5>
                  <p className="text-[11px] text-stone-600 line-clamp-1">
                    {scheme.department}
                  </p>

                  {/* Required Documents to Apply */}
                  {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 && (
                    <div className="mt-1 text-[11px] bg-white/90 p-2 rounded-lg border border-emerald-200">
                      <div className="font-bold text-stone-800 flex items-center gap-1 mb-1 text-[10px]">
                        <FileCheck2 className="w-3 h-3 text-emerald-800" />
                        <span>Required Documents to Apply:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scheme.requiredDocuments.slice(0, 3).map((d, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-900 rounded text-[10px] font-medium border border-emerald-200">
                            ✓ {d}
                          </span>
                        ))}
                        {scheme.requiredDocuments.length > 3 && (
                          <span className="text-[10px] text-emerald-700 font-semibold self-center">
                            +{scheme.requiredDocuments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200/60">
                  <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono truncate">
                    <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{new URL(officialUrl).hostname.replace(/^www\./, '')}</span>
                  </div>

                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE OFFICIAL UMBRELLA PORTALS DIRECTORY */}
      {statePortalsList.length > 0 && (
        <div className="bg-white/90 rounded-xl border border-stone-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Official Government Single-Window & Department Portals ({stateName}):</span>
            </div>
            <span className="text-[10px] font-semibold text-stone-500">
              Verified .gov.in / .cgg.gov.in
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {statePortalsList.slice(0, 6).map((portal, idx) => (
              <a
                key={idx}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg border border-stone-200 hover:border-emerald-300 bg-stone-50/70 hover:bg-emerald-50/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 transition-colors truncate">
                      {portal.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-emerald-700 shrink-0" />
                  </div>
                  <span className="text-[10px] text-stone-500 block truncate mt-0.5">
                    {portal.category}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-emerald-900 font-bold mt-2 truncate">
                  {portal.domain}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Official Government Portals Quick Links (if any raw links detected from AI output) */}
      {extractedUrls.length > 0 && (
        <div className="bg-stone-50/90 rounded-xl border border-stone-200 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>All Official Application Links Detected in AI Evaluation:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {extractedUrls.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${themeStyles.linkBadge} transition-all shadow-2xs`}
              >
                <span>{item.label}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Verification footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-500 pt-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Factual verification strictly sourced from official government portals (.gov.in, .nic.in, .cgg.gov.in, myScheme, NSP).</span>
        </div>
        <span className="italic text-stone-400">Always confirm active academic cycles and guidelines on the official portal before applying.</span>
      </div>

    </div>
  );
};
