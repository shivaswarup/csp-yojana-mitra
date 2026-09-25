import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  RefreshCw, 
  ExternalLink,
  Minimize2, 
  Maximize2,
  ChevronDown,
  ShieldCheck,
  Building2,
  HelpCircle,
  Clock,
  FileCheck,
  GripVertical,
  Move,
  Languages
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SCHEMES_DATABASE } from '../data/schemes';
import { Scheme, UserProfile } from '../types';
import { evaluateSchemeEligibility, getRecommendedSchemes } from '../utils/recommendationEngine';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  matchedSchemes?: Scheme[];
}

const QUICK_PROMPTS_EN = [
  'What active State Government schemes am I eligible for?',
  'What state scholarships match my profile?',
  'What schemes in my state am I eligible for?',
  'What documents are needed for my application?',
  'తెలుగులో వివరించండి (Respond in Telugu)'
];

const QUICK_PROMPTS_TE = [
  'నేను అర్హులైన రాష్ట్ర ప్రభుత్వ పథకాలు ఏమిటి?',
  'నా ప్రొఫైల్‌కు సరిపోయే రాష్ట్ర స్కాలర్‌షిప్‌లు ఏమిటి?',
  'నా రాష్ట్రంలో నేను అర్హులైన ప్రభుత్వ పథకాలు ఏమిటి?',
  'దరఖాస్తు చేసుకోవడానికి ఏ డాక్యుమెంట్లు కావాలి?',
  'అధికారిక పోర్టల్‌లో ఎలా దరఖాస్తు చేసుకోవాలి?',
  'Explain in English (ఆంగ్లంలో సమాధానం)'
];

function extractMatchingSchemes(text: string, profile?: UserProfile | null): Scheme[] {
  const normalized = text.toLowerCase();
  const matched: Scheme[] = [];

  for (const scheme of SCHEMES_DATABASE) {
    if (scheme.governmentLevel !== 'State') continue;

    const nameLower = scheme.name.toLowerCase();
    
    // Check main title tokens
    const isDirectMatch = 
      normalized.includes(nameLower) || 
      (scheme.shortDescription && normalized.includes(scheme.shortDescription.toLowerCase().slice(0, 30)));

    // Check specific known state scheme acronyms & keywords (English & Telugu)
    let isAliasMatch = false;
    if (scheme.id.includes('deevena') && (normalized.includes('deevena') || normalized.includes('దీవెన') || normalized.includes('vidya') || normalized.includes('vasathi'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('maha-shakti') && (normalized.includes('maha shakti') || normalized.includes('free bus') || normalized.includes('మహా శక్తి') || normalized.includes('ఉచిత బస్సు') || normalized.includes('aadabidda'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('annadata-sukhibhava') && (normalized.includes('annadata') || normalized.includes('sukhibhava') || normalized.includes('అన్నదాత') || normalized.includes('రైతు'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('ntr-vaidya-seva') && (normalized.includes('vaidya seva') || normalized.includes('aarogyasri') || normalized.includes('ఆరోగ్యశ్రీ') || normalized.includes('వైద్య సేవ'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('ntr-bharosa') && (normalized.includes('bharosa') || normalized.includes('pension') || normalized.includes('పింఛను') || normalized.includes('భరోసా'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('thalliki-vandanam') && (normalized.includes('thalliki') || normalized.includes('vandanam') || normalized.includes('తల్లికి వందనం') || normalized.includes('ammavodi'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('deepam') && (normalized.includes('deepam') || normalized.includes('gas cylinder') || normalized.includes('దీపం') || normalized.includes('సిలిండర్'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('epass') && (normalized.includes('epass') || normalized.includes('telangana scholarship'))) {
      isAliasMatch = true;
    } else if (scheme.id.includes('rythu-bandhu') && (normalized.includes('rythu bandhu') || normalized.includes('రైతు బంధు'))) {
      isAliasMatch = true;
    }

    // State scheme recognition for the citizen's state
    const stateName = scheme.state.toLowerCase();
    const userState = profile?.state?.toLowerCase();
    const mentionsUserOrSchemeState = normalized.includes(stateName) || (userState && normalized.includes(userState) && stateName === userState);
    const isStateQuery = normalized.includes('state') || normalized.includes('local scheme') || normalized.includes('my state') || normalized.includes('రాష్ట్ర');

    if (mentionsUserOrSchemeState || isStateQuery) {
      if (
        scheme.tags.some(t => normalized.includes(t.toLowerCase())) ||
        normalized.includes(scheme.slug.replace(/-/g, ' ')) ||
        (userState && stateName === userState)
      ) {
        isAliasMatch = true;
      }
    }

    if (isDirectMatch || isAliasMatch) {
      // STRICT FILTER: Only include if the scheme strictly matches the citizen's profile
      if (profile) {
        const evalResult = evaluateSchemeEligibility(scheme, profile);
        if (evalResult.unmetCriteria.length > 0 || evalResult.matchScore < 75) {
          continue; // Discard schemes outside user profile
        }
      }

      if (!matched.some(m => m.id === scheme.id)) {
        matched.push(scheme);
      }
    }
  }

  return matched;
}

export const GeminiChatBot: React.FC<{ onSelectScheme?: (scheme: Scheme) => void }> = ({ onSelectScheme }) => {
  const { 
    currentUser, 
    isChatbotOpen, 
    setIsChatbotOpen, 
    setSelectedScheme: setContextSelectedScheme,
    addChatbotRecommendation,
    pendingChatbotPrompt,
    setPendingChatbotPrompt,
    openAuthModal
  } = useApp();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<'english' | 'telugu'>('english');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const allMatches = currentUser ? getRecommendedSchemes(SCHEMES_DATABASE, currentUser).map(r => r.scheme) : [];
    return [
      {
        id: 'welcome',
        role: 'model',
        text: currentUser 
          ? `Namaste **${currentUser.name || 'Citizen'}**! 🙏\n\nI am **Yojana Mitra AI**, powered by Google Gemini. I have already scanned State Government welfare schemes strictly according to your employment status (${currentUser.employmentStatus || 'Citizen'}, ${currentUser.maritalStatus || 'Single'}, ${currentUser.category || 'General'}, ${currentUser.state || 'India'}${currentUser.district ? ` - ${currentUser.district}` : ''}) and automatically displayed all **${allMatches.length} eligible state schemes** on your **Home Page Recommendations**!\n\nYou can ask me in English or Telugu (**తెలుగులో చెప్పండి**) about State Government schemes, scholarships, required documents, or step-by-step registration on official state portals.`
          : `Namaste Citizen! 🙏\n\nI am **Yojana Mitra AI**, your official State Government Scheme & Scholarship assistant. You can ask me about State welfare schemes, state scholarships, eligibility requirements, and deadlines in English or Telugu (**తెలుగులో చెప్పండి**). All schemes are presented in structured text format!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedSchemes: []
      }
    ];
  });

  const handleLanguageSwitch = (newLang: 'english' | 'telugu') => {
    setChatLanguage(newLang);
    if (messages.length === 1 && messages[0].id.startsWith('welcome')) {
      if (newLang === 'telugu') {
        setMessages([
          {
            id: 'welcome-telugu',
            role: 'model',
            text: currentUser
              ? `నమస్కారం **${currentUser.name || 'పౌరులారా'}**! 🙏\n\nనేను **యోజనా మిత్ర AI** (Yojana Mitra AI), గూగుల్ జెమిని ఆధారిత మీ అధికారిక రాష్ట్ర ప్రభుత్వ పథకాలు మరియు స్కాలర్‌షిప్‌ల సహాయకుడిని. మీ ఉపాధి స్థితి (${currentUser.employmentStatus || 'పౌరులు'}, ${currentUser.state || 'ఆంధ్రప్రదేశ్'}) ఆధారంగా అర్హత గల రాష్ట్ర పథకాల వివరాలు, అవసరమైన ధృవీకరణ పత్రాలు, మరియు అధికారిక దరఖాస్తు విధానం గురించి తెలుగులోనే నన్ను అడగవచ్చు!`
              : `నమస్కారం పౌరులారా! 🙏\n\nనేను **యోజనా మిత్ర AI**, మీ అధికారిక రాష్ట్ర ప్రభుత్వ పథకాలు మరియు స్కాలర్‌షిప్‌ల సహాయకుడిని. రాష్ట్ర ప్రభుత్వ పథకాలు, అర్హతలు, మరియు అధికారిక లింకుల గురించి నన్ను నేరుగా అడగవచ్చు!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchedSchemes: []
          }
        ]);
      } else {
        setMessages([
          {
            id: 'welcome-en',
            role: 'model',
            text: currentUser
              ? `Namaste **${currentUser.name || 'Citizen'}**! 🙏\n\nI am **Yojana Mitra AI**, powered by Google Gemini. You can ask me in English or Telugu about State Government schemes, state scholarships, required documents, application deadlines, or step-by-step registration on official state portals.`
              : `Namaste Citizen! 🙏\n\nI am **Yojana Mitra AI**, official State Government Scheme & Scholarship assistant. Ask me about State welfare schemes, scholarships, requirements, and deadlines in structured text format!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchedSchemes: []
          }
        ]);
      }
    }
  };

  // Keep chatbot welcome message synchronized when profile details change (e.g. marital status, state)
  useEffect(() => {
    if (currentUser) {
      const allMatches = getRecommendedSchemes(SCHEMES_DATABASE, currentUser).map(r => r.scheme);
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id.startsWith('welcome')) {
          return [
            {
              id: 'welcome',
              role: 'model',
              text: `Namaste **${currentUser.name || 'Citizen'}**! 🙏\n\nI am **Yojana Mitra AI**, powered by Google Gemini. I have already scanned government schemes strictly according to your employment status (${currentUser.employmentStatus || 'Citizen'}, ${currentUser.maritalStatus || 'Single'}, ${currentUser.category || 'General'}, ${currentUser.state || 'India'}${currentUser.district ? ` - ${currentUser.district}` : ''}) and automatically displayed all **${allMatches.length} eligible schemes** on your **Home Page Recommendations**!\n\nYou can ask me in English or Telugu (**తెలుగులో చెప్పండి**) about required documents, application deadlines, or step-by-step registration on official portals.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              matchedSchemes: allMatches
            }
          ];
        }
        return prev;
      });
    }
  }, [currentUser?.id, currentUser?.maritalStatus, currentUser?.employmentStatus, currentUser?.state, currentUser?.district, currentUser?.category, currentUser?.annualFamilyIncome]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Movable Floating Launcher State ---
  const [launcherPos, setLauncherPos] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [isDraggingLauncher, setIsDraggingLauncher] = useState(false);
  const launcherDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);
  const launcherBtnRef = useRef<HTMLButtonElement>(null);

  // --- Movable Chat Modal Window State ---
  const [modalPos, setModalPos] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const modalDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatbotOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatbotOpen, isMinimized]);

  // Adjust positions on window resize to ensure they stay on screen
  useEffect(() => {
    const handleResize = () => {
      setLauncherPos(prev => {
        if (prev.x === null || prev.y === null) return prev;
        const maxX = Math.max(10, window.innerWidth - 220);
        const maxY = Math.max(10, window.innerHeight - 80);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY)
        };
      });

      setModalPos(prev => {
        if (prev.x === null || prev.y === null) return prev;
        const width = Math.min(420, window.innerWidth - 32);
        const height = isMinimized ? 56 : Math.min(540, window.innerHeight * 0.85);
        const maxX = Math.max(10, window.innerWidth - width - 10);
        const maxY = Math.max(10, window.innerHeight - height - 10);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY)
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  // Launcher Pointer Handlers
  const handleLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return; // only main click
    const rect = launcherBtnRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : (launcherPos.x ?? (window.innerWidth - 200));
    const currentY = rect ? rect.top : (launcherPos.y ?? (window.innerHeight - 80));

    launcherDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      moved: false
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!launcherDragRef.current) return;
      const dx = moveEvent.clientX - launcherDragRef.current.startX;
      const dy = moveEvent.clientY - launcherDragRef.current.startY;

      if (Math.hypot(dx, dy) > 5) {
        launcherDragRef.current.moved = true;
        setIsDraggingLauncher(true);

        const btnWidth = launcherBtnRef.current?.offsetWidth || 180;
        const btnHeight = launcherBtnRef.current?.offsetHeight || 50;

        const newX = Math.min(Math.max(10, launcherDragRef.current.initX + dx), window.innerWidth - btnWidth - 10);
        const newY = Math.min(Math.max(10, launcherDragRef.current.initY + dy), window.innerHeight - btnHeight - 10);

        setLauncherPos({ x: newX, y: newY });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (launcherDragRef.current && !launcherDragRef.current.moved) {
        setIsChatbotOpen(true);
      }
      setIsDraggingLauncher(false);
      launcherDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Modal Header Pointer Handlers (Drag modal window)
  const handleModalHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on control buttons (minimize, clear, close)
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button !== 0) return;

    const rect = modalRef.current?.getBoundingClientRect();
    const width = rect ? rect.width : Math.min(420, window.innerWidth - 32);
    const height = rect ? rect.height : 540;

    const currentX = rect ? rect.left : (modalPos.x ?? (window.innerWidth - width - 24));
    const currentY = rect ? rect.top : (modalPos.y ?? (window.innerHeight - height - 24));

    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY
    };

    setIsDraggingModal(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!modalDragRef.current) return;
      const dx = moveEvent.clientX - modalDragRef.current.startX;
      const dy = moveEvent.clientY - modalDragRef.current.startY;

      const newWidth = modalRef.current?.offsetWidth || width;
      const newHeight = modalRef.current?.offsetHeight || height;

      const clampedX = Math.min(Math.max(10, modalDragRef.current.initX + dx), window.innerWidth - newWidth - 10);
      const clampedY = Math.min(Math.max(10, modalDragRef.current.initY + dy), window.innerHeight - newHeight - 10);

      setModalPos({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDraggingModal(false);
      modalDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleSchemeClick = (scheme: Scheme) => {
    if (onSelectScheme) {
      onSelectScheme(scheme);
    } else {
      setContextSelectedScheme(scheme);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;

    // Detect if user asks in Telugu or asks to respond in Telugu
    const isExplicitTelugu = 
      /(\btelugu\b|తెలుగు|telugulo|telugu\s*lo)/i.test(textToSend) || 
      /[\u0C00-\u0C7F]/.test(textToSend);
    
    // Detect if user explicitly asks for English
    const isExplicitEnglish = 
      /(\benglish\b|ఆంగ్లంలో|english\s*lo|in\s*english)/i.test(textToSend);

    let activeLanguage = chatLanguage;
    if (isExplicitTelugu && !isExplicitEnglish) {
      activeLanguage = 'telugu';
      setChatLanguage('telugu');
    } else if (isExplicitEnglish) {
      activeLanguage = 'english';
      setChatLanguage('english');
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter(m => !m.id.startsWith('welcome'))
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const profileToSend = currentUser ? {
        ...currentUser,
        isStudent: currentUser.isStudent ?? (currentUser.employmentStatus === 'Student'),
        isFarmer: currentUser.isFarmer ?? (currentUser.employmentStatus === 'Farmer'),
        isSeniorCitizen: currentUser.isSeniorCitizen ?? (currentUser.employmentStatus === 'Senior Citizen' || (currentUser.age && currentUser.age >= 60)),
        isWomanEntrepreneur: currentUser.isWomanEntrepreneur ?? (currentUser.employmentStatus === 'Women')
      } : {
        id: 'guest-citizen',
        email: 'citizen@yojanamitra.gov.in',
        name: 'Citizen',
        age: 21,
        gender: 'male',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        areaType: 'Urban',
        maritalStatus: 'Single',
        highestEducation: 'Undergraduate (UG)',
        currentEducationStatus: 'Pursuing',
        isStudent: true,
        category: 'General',
        isDisability: false,
        isMinority: false,
        annualFamilyIncome: 250000,
        employmentStatus: 'Student',
        isFarmer: false,
        isBusinessOwner: false,
        isWomanEntrepreneur: false,
        isSeniorCitizen: false,
        isBPLOrEWS: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
          userProfile: profileToSend,
          language: activeLanguage
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || (activeLanguage === 'telugu' ? 'సమాధానం రూపొందించడం సాధ్యం కాలేదు. దయచేసి అధికారిక ప్రభుత్వ పోర్టల్‌ను తనిఖీ చేయండి.' : 'No response generated from Gemini API.');
      } else {
        let errText = '';
        try {
          const errJson = await res.json();
          errText = errJson.reply || errJson.error || errJson.message || '';
        } catch {
          errText = await res.text();
        }
        throw new Error(`Server HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }

      // Extract schemes matched in the reply or query that strictly match the user's profile
      const matched = extractMatchingSchemes(textToSend + ' ' + replyText, currentUser);

      // Add each matched scheme to the AppContext Chatbot Recommendations list
      matched.forEach(scheme => {
        addChatbotRecommendation(
          scheme, 
          `Recommended during AI conversation about: "${textToSend.slice(0, 50)}${textToSend.length > 50 ? '...' : ''}"`,
          textToSend
        );
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        matchedSchemes: matched,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.warn('Gemini Chat notice:', error?.message || error);
      
      // Resilient fallback using verified database matching
      let matched = extractMatchingSchemes(textToSend, currentUser);
      
      // If strict profile matching returns empty or profile is incomplete, match by query keywords
      if (matched.length === 0) {
        const queryLower = textToSend.toLowerCase();
        matched = SCHEMES_DATABASE.filter(s => {
          return (
            s.name.toLowerCase().includes(queryLower) ||
            s.category.toLowerCase().includes(queryLower) ||
            s.tags.some(t => queryLower.includes(t.toLowerCase())) ||
            (queryLower.includes('student') && (s.category === 'Student Welfare' || s.category === 'Scholarships')) ||
            (queryLower.includes('scholarship') && s.category === 'Scholarships') ||
            (queryLower.includes('farmer') && s.category === 'Agriculture') ||
            (queryLower.includes('women') && s.category === 'Women') ||
            (queryLower.includes('state') && s.governmentLevel === 'State')
          );
        }).slice(0, 4);
      }

      // If still empty, supply flagship active state schemes
      if (matched.length === 0) {
        matched = SCHEMES_DATABASE.filter(s => s.governmentLevel === 'State').slice(0, 3);
      }
      
      matched.forEach(scheme => {
        addChatbotRecommendation(
          scheme,
          `Recommended from verified registry for: "${textToSend.slice(0, 50)}"`,
          textToSend
        );
      });

      let fallbackText = '';
      if (/^(hi|hello|hey|namaste|నమస్కారం)/i.test(textToSend.trim())) {
        fallbackText = activeLanguage === 'telugu'
          ? `నమస్కారం! 🙏 నేను **యోజనా మిత్ర AI** ని. నేను మీకు రాష్ట్ర సంక్షేమ పథకాలు, విద్యా స్కాలర్‌షిప్‌లు, మరియు అధికారిక దరఖాస్తు విధానం గురించి ఎలా సహాయపడగలను?`
          : `Namaste! 🙏 I am **Yojana Mitra AI**, your Government Scheme & Scholarship Assistant. How can I help you today with welfare schemes, scholarships, or application guidance?`;
      } else {
        fallbackText = activeLanguage === 'telugu'
          ? `తాత్కాలిక నెట్‌వర్క్ అంతరాయం కారణంగా సమాధానం ఆలస్యమైంది. దయచేసి మీ ప్రశ్నను మళ్లీ ప్రయత్నించండి.\n\nమీ ప్రశ్న ఆధారంగా ధృవీకరించబడిన అధికారిక పథకాలు & స్కాలర్‌షిప్‌లు ఇక్కడ ఉన్నాయి:\n\n`
          : `I experienced a temporary connection delay while generating a direct answer. Please try asking your question again.\n\nIn the meantime, here are verified government programs related to your query:\n\n`;

        matched.slice(0, 4).forEach((s, idx) => {
          const criteria = (s.eligibility && s.eligibility[0]) || s.shortDescription || 'Refer official notification';
          const docs = (s.requiredDocuments && s.requiredDocuments.length > 0) ? s.requiredDocuments.slice(0, 3).join(', ') : 'Aadhaar, Income & Caste Certificates';
          const portalName = s.officialSource || 'Official Government Portal';
          const portalUrl = s.officialWebsite || 'https://www.myscheme.gov.in';

          fallbackText += `${idx + 1}.\n**Scheme Name:** ${s.name}\n**Requirements:** ${criteria}. Documents: ${docs}\n**Why it suits you:** ${s.shortDescription}\n**Deadline:** Check Official Portal\n**Official Portal Link:** [${portalName}](${portalUrl})\n\n`;
        });
      }

      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: fallbackText,
          matchedSchemes: matched,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Run pending chatbot prompt triggered from Home Page or other views
  useEffect(() => {
    if (pendingChatbotPrompt) {
      setIsChatbotOpen(true);
      setIsMinimized(false);
      const promptToRun = pendingChatbotPrompt;
      setPendingChatbotPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [pendingChatbotPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: chatLanguage === 'telugu'
          ? `సంభాషణ రీసెట్ చేయబడింది. నమస్కారం **${currentUser?.name || 'పౌరులారా'}**! ప్రభుత్వ పథకాలు లేదా స్కాలర్‌షిప్‌ల గురించి నేను మీకు ఎలా సహాయపడగలను?`
          : `Conversation cleared. Namaste **${currentUser?.name || 'Citizen'}**! How can I assist you with government schemes or scholarships?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Render markdown with basic formatting, links, and code
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Inline link & bold parser
      const renderInline = (str: string) => {
        // Match [Label](url) OR raw url https://...
        const linkRegex = /(\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s\)\],]+)/g;
        const segments: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(str)) !== null) {
          if (match.index > lastIndex) {
            segments.push(parseBold(str.substring(lastIndex, match.index), segments.length));
          }

          const full = match[0];
          let url = full;
          let label = full;

          if (match[2] && match[3]) {
            label = match[2];
            url = match[3];
          } else {
            url = full.replace(/[\.\,\;\:\)\*\_]+$/, '');
            try {
              label = new URL(url).hostname.replace(/^www\./, '');
            } catch {
              label = url;
            }
          }

          segments.push(
            <a
              key={`link-${segments.length}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline decoration-emerald-500 hover:decoration-2 transition-all mx-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
            >
              <span>{label}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          );
          lastIndex = linkRegex.lastIndex;
        }

        if (lastIndex < str.length) {
          segments.push(parseBold(str.substring(lastIndex), segments.length));
        }

        return segments.length > 0 ? segments : parseBold(str, 0);
      };

      const parseBold = (sub: string, keyPrefix: number) => {
        const parts = sub.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${keyPrefix}-${pIdx}`} className="font-bold text-stone-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      // Numbered header e.g. "1." or "1. Scheme Name"
      if (/^\s*\d+\.\s*$/.test(line.trim())) {
        return (
          <div key={idx} className="mt-3.5 pt-2 border-t border-stone-200/70 first:border-t-0 first:mt-0 first:pt-0 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] flex items-center justify-center border border-emerald-300 shrink-0">
              {line.trim().replace('.', '')}
            </span>
          </div>
        );
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        return (
          <div key={idx} className="font-bold text-stone-950 text-xs mt-3.5 pt-2 border-t border-stone-200/70 first:border-t-0 first:mt-0 first:pt-0">
            {renderInline(line)}
          </div>
        );
      }

      // Format scheme fields: Scheme Name, Requirements, Why it suits you, Deadline, Official Portal Link
      const isSchemeTerm = /^(\s*[\*\-]?\s*)(\*\*)?(Scheme Name|Requirements|Why it suits you|Deadline|Official Portal Link|పథకం పేరు|అర్హతలు|మీకు ఎందుకు సరిపోతుంది|గడువు తేదీ|అధికారిక పోర్టల్ లింక్)(\*\*)?:?/i.test(line);
      if (isSchemeTerm) {
        return (
          <div key={idx} className="text-stone-800 text-xs leading-relaxed my-1 pl-2 border-l-2 border-emerald-500 bg-emerald-50/40 py-1 pr-1.5 rounded-r">
            {renderInline(line)}
          </div>
        );
      }

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-stone-900 text-xs mt-2 mb-1">{renderInline(line.replace('### ', ''))}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-stone-900 text-sm mt-2 mb-1">{renderInline(line.replace('## ', ''))}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="font-bold text-stone-900 text-base mt-2 mb-1">{renderInline(line.replace('# ', ''))}</h2>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-stone-700 text-xs leading-relaxed my-0.5">
            {renderInline(line.replace(/^[\-\*]\s+/, ''))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-stone-700 text-xs leading-relaxed my-0.5">
          {renderInline(line)}
        </p>
      );
    });
  };

  return (
    <>
      {/* Movable Floating Launcher Button */}
      {!isChatbotOpen && (
        <button
          ref={launcherBtnRef}
          id="open-gemini-chat-btn"
          onPointerDown={handleLauncherPointerDown}
          onClick={() => {
            if (launcherDragRef.current?.moved) return;
            setIsChatbotOpen(true);
          }}
          style={
            launcherPos.x !== null && launcherPos.y !== null
              ? {
                  left: `${launcherPos.x}px`,
                  top: `${launcherPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  position: 'fixed'
                }
              : undefined
          }
          className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2.5 bg-emerald-800 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl border border-emerald-700 select-none touch-none ${
            isDraggingLauncher ? 'cursor-grabbing scale-105 shadow-3xl opacity-90' : 'cursor-grab hover:scale-105'
          } transition-transform duration-75 group`}
          title="Drag to reposition or click to open Yojana Mitra AI Chat"
        >
          <div className="text-emerald-300 opacity-60 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left pointer-events-none">
            <div className="text-xs font-bold leading-tight">Yojana Mitra AI</div>
            <div className="text-[10px] text-emerald-200 leading-tight">Ask about schemes</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </button>
      )}

      {/* Movable Floating Chat Window */}
      {isChatbotOpen && (
        <div
          ref={modalRef}
          id="gemini-chat-modal"
          style={
            modalPos.x !== null && modalPos.y !== null
              ? {
                  left: `${modalPos.x}px`,
                  top: `${modalPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  position: 'fixed'
                }
              : undefined
          }
          className={`fixed right-2 sm:right-6 bottom-16 sm:bottom-6 z-50 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-[width,height] duration-200 ${
            isMinimized 
              ? 'w-72 sm:w-80 h-14' 
              : 'w-[calc(100vw-1rem)] sm:w-96 md:w-[420px] h-[520px] max-h-[80vh]'
          }`}
        >
          {/* Draggable Header */}
          <div 
            onPointerDown={handleModalHeaderPointerDown}
            className={`p-3 bg-emerald-800 text-white flex items-center justify-between select-none touch-none ${
              isDraggingModal ? 'cursor-grabbing' : 'cursor-grab'
            } border-b border-emerald-700/60`}
            title="Drag anywhere on header to move"
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <div className="text-emerald-300 opacity-70">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5 leading-tight">
                  <span>Yojana Mitra AI</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-900/60 rounded text-emerald-200 font-normal">
                    Gemini 3.7
                  </span>
                </div>
                <div className="text-[10px] text-emerald-200 flex items-center gap-1 leading-tight mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Official Government Advisor</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Language Selector */}
              <div className="flex items-center bg-emerald-950/70 p-0.5 rounded-md border border-emerald-600/40 text-[10px] mr-1">
                <Languages className="w-3 h-3 text-emerald-300 ml-1 mr-0.5" />
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('english')}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    chatLanguage === 'english' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-emerald-200 hover:text-white'
                  }`}
                  title="Respond in English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch('telugu')}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    chatLanguage === 'telugu' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-emerald-200 hover:text-white'
                  }`}
                  title="తెలుగులో సమాధానం ఇవ్వండి (Respond in Telugu)"
                >
                  తెలుగు
                </button>
              </div>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-emerald-700/80 rounded-md text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-emerald-700/80 rounded-md text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="p-1.5 hover:bg-emerald-700/80 rounded-md text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-stone-50/60 space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-xl p-3 shadow-2xs ${
                          isUser
                            ? 'bg-emerald-800 text-white rounded-br-2xs'
                            : 'bg-white text-stone-800 border border-stone-200 rounded-bl-2xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="text-white text-xs whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="space-y-1">{formatText(msg.text)}</div>
                        )}

                        <div
                          className={`text-[9px] mt-1.5 text-right ${
                            isUser ? 'text-emerald-200' : 'text-stone-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5 border border-stone-300">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white text-stone-800 border border-stone-200 rounded-xl p-3 shadow-2xs rounded-bl-2xs flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {chatLanguage === 'telugu' ? 'అధికారిక ప్రభుత్వ సమాచారాన్ని పరిశీలిస్తున్నాము...' : 'Consulting official guidelines...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Suggestions */}
              {messages.length <= 2 && (
                <div className="px-3 py-2 bg-stone-100/70 border-t border-stone-200/80">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{chatLanguage === 'telugu' ? 'సిఫార్సు చేయబడిన ప్రశ్నలు:' : 'Suggested Questions:'}</span>
                    <span className="text-[9px] text-emerald-700 font-normal">
                      {chatLanguage === 'telugu' ? 'భాష: తెలుగు' : 'English / తెలుగు'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(chatLanguage === 'telugu' ? QUICK_PROMPTS_TE : QUICK_PROMPTS_EN).map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] text-stone-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-stone-200 px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 border-t border-stone-200 bg-white">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      chatLanguage === 'telugu' 
                        ? 'పథకాలు, స్కాలర్‌షిప్‌లు, అర్హతల గురించి తెలుగులో అడగండి...' 
                        : 'Ask about schemes, scholarships, or say "తెలుగులో చెప్పండి"...'
                    }
                    className="w-full text-xs pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 text-stone-800 placeholder-stone-400"
                    disabled={loading}
                  />
                  <button
                    id="send-gemini-chat-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || loading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-800 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-1">
                  <span>
                    {chatLanguage === 'telugu' ? 'ధృవీకరించబడిన ప్రభుత్వ పోర్టల్స్ (.gov.in)' : 'Grounded in verified portals (.gov.in)'}
                  </span>
                  <span>
                    {chatLanguage === 'telugu' ? 'జెమిని మద్దతుతో' : 'Powered by Gemini'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
