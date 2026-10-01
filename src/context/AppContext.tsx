import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  Scheme, 
  AppliedSchemeRecord, 
  NotificationItem, 
  SchemeRecommendation,
  ChatbotRecommendedScheme,
  DeviceAccount
} from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';
import { getRecommendedSchemes, evaluateSchemeEligibility, matchSchemesFromAiResponse } from '../utils/recommendationEngine';
import { scanCitizenSchemesWithAI, generatePersonalizedAiNote } from '../utils/aiSchemeScanner';
import { 
  calculateDaysUntilDeadline, 
  generate3DayDeadlineNotifications, 
  generateDeadlineReminderNotifications,
  getSchemesExpiringWithin3Days 
} from '../utils/deadlineAlerts';
import { 
  db, 
  auth, 
  GoogleAuthProvider,
  googleProvider, 
  createGoogleProviderWithAccountSelect,
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateAuthProfile,
  signOut, 
  onAuthStateChanged,
  getAdditionalUserInfo,
  signInAnonymously,
  handleFirestoreError,
  OperationType 
} from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';

export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

interface AppContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarding: boolean;
  setIsOnboarding: (onboarding: boolean) => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  activeTab: 'home' | 'profile' | 'deadlines' | 'schemes' | 'recommended' | 'applied';
  selectedScheme: Scheme | null;
  searchQuery: string;
  appliedSchemes: AppliedSchemeRecord[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  recommendedSchemes: SchemeRecommendation[];
  chatbotRecommendedSchemes: ChatbotRecommendedScheme[];
  isNotificationsOpen: boolean;
  isChatbotOpen: boolean;
  isFirebaseConnected: boolean;
  isAiScanning: boolean;
  pendingChatbotPrompt: string | null;
  isAskingStateSchemes: boolean;
  stateChatbotAnswer: { state: string; text: string; timestamp: string } | null;
  clearStateChatbotAnswer: () => void;
  expiringIn3DaysSchemes: Array<{ scheme: Scheme; daysLeft: number; statusText: string }>;
  
  // Registration guidance
  registrationNotice: string | null;
  clearRegistrationNotice: () => void;

  // Multi-Account Device Management
  deviceAccounts: DeviceAccount[];
  removeDeviceAccount: (idOrEmail: string) => void;
  selectDeviceAccount: (account: DeviceAccount) => Promise<void>;
  loginDirectlyWithAccount: (email: string, name?: string, stateChoice?: string) => Promise<void>;

  // Actions
  rescanSchemesWithAI: () => Promise<void>;
  askChatbotForStateSchemes: (stateName?: string) => Promise<{ reply: string; foundSchemes: Scheme[] }>;
  openChatbotWithPrompt: (prompt: string) => void;
  setPendingChatbotPrompt: (prompt: string | null) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (preferredEmail?: string, preferredName?: string) => Promise<void>;
  loginWithPhoneOtp: (phone: string, otp: string, name?: string, stateChoice?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string, stateChoice?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profileData: UserProfile) => Promise<void>;
  setActiveTab: (tab: 'home' | 'profile' | 'deadlines' | 'schemes' | 'recommended' | 'applied') => void;
  setSelectedScheme: (scheme: Scheme | null) => void;
  setSearchQuery: (query: string) => void;
  applyForScheme: (scheme: Scheme, notes?: string, appRef?: string) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: AppliedSchemeRecord['status'], notes?: string) => Promise<void>;
  removeApplication: (applicationId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  setIsNotificationsOpen: (open: boolean) => void;
  setIsChatbotOpen: (open: boolean) => void;
  addChatbotRecommendation: (scheme: Scheme, aiNote?: string, sourceQuery?: string) => void;
  removeChatbotRecommendation: (schemeId: string) => void;
  clearChatbotRecommendations: () => void;
  loadDemoProfile: (profileType: 'student' | 'farmer' | 'woman_entrepreneur' | 'senior_citizen') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_PROFILES: Record<string, UserProfile> = {
  student: {
    id: 'user-student-1',
    email: 'shivaswarup2007@gmail.com',
    name: 'Shiva Swarup',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    age: 19,
    gender: 'male',
    dateOfBirth: '2007-04-12',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    areaType: 'Urban',
    maritalStatus: 'Single',
    highestEducation: '12th Pass (Intermediate)',
    currentEducationStatus: 'Pursuing',
    courseStream: 'B.Tech Computer Science & Engineering',
    institutionName: 'Andhra University',
    isStudent: true,
    category: 'OBC',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 220000,
    employmentStatus: 'Student',
    isFarmer: false,
    isBusinessOwner: false,
    isWomanEntrepreneur: false,
    isSeniorCitizen: false,
    isBPLOrEWS: true,
    isRegistered: true,
    profileCompleted: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-24T07:00:00Z'
  },
  farmer: {
    id: 'user-farmer-2',
    email: 'ramesh.patel@example.com',
    name: 'Ramesh Patel',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    age: 44,
    gender: 'male',
    dateOfBirth: '1982-06-15',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    areaType: 'Rural',
    maritalStatus: 'Married',
    highestEducation: '10th Pass (Matric)',
    currentEducationStatus: 'Completed',
    isStudent: false,
    category: 'General',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 180000,
    employmentStatus: 'Farmer',
    isFarmer: true,
    isBusinessOwner: false,
    isWomanEntrepreneur: false,
    isSeniorCitizen: false,
    isBPLOrEWS: false,
    hasKisanCreditCard: true,
    landHoldingAcres: 3.5,
    isRegistered: true,
    profileCompleted: true,
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-24T07:00:00Z'
  },
  business_holder: {
    id: 'user-business-5',
    email: 'vikram.verma@example.com',
    name: 'Vikram Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    age: 38,
    gender: 'male',
    dateOfBirth: '1988-04-12',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    areaType: 'Urban',
    maritalStatus: 'Married',
    highestEducation: 'Undergraduate (UG)',
    currentEducationStatus: 'Completed',
    isStudent: false,
    category: 'General',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 450000,
    employmentStatus: 'Business Holder',
    isFarmer: false,
    isBusinessOwner: true,
    isWomanEntrepreneur: false,
    isSeniorCitizen: false,
    isBPLOrEWS: false,
    isRegistered: true,
    profileCompleted: true,
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-24T07:00:00Z'
  },
  woman_entrepreneur: {
    id: 'user-woman-3',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    age: 29,
    gender: 'female',
    dateOfBirth: '1997-03-21',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    areaType: 'Urban',
    maritalStatus: 'Single',
    highestEducation: 'Undergraduate (UG)',
    currentEducationStatus: 'Completed',
    courseStream: 'B.Des Fashion & Textiles',
    isStudent: false,
    category: 'EWS',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 320000,
    employmentStatus: 'Women',
    isFarmer: false,
    isBusinessOwner: true,
    isWomanEntrepreneur: true,
    isSeniorCitizen: false,
    isBPLOrEWS: true,
    isRegistered: true,
    profileCompleted: true,
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-24T07:00:00Z'
  },
  senior_citizen: {
    id: 'user-senior-4',
    email: 'kailash.gupta@example.com',
    name: 'Kailash Nath Gupta',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    age: 72,
    gender: 'male',
    dateOfBirth: '1954-09-08',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    areaType: 'Urban',
    maritalStatus: 'Married',
    highestEducation: '12th Pass (Intermediate)',
    currentEducationStatus: 'Completed',
    isStudent: false,
    category: 'General',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 140000,
    employmentStatus: 'Senior Citizen',
    isFarmer: false,
    isBusinessOwner: false,
    isWomanEntrepreneur: false,
    isSeniorCitizen: true,
    isBPLOrEWS: true,
    isRegistered: true,
    profileCompleted: true,
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-24T07:00:00Z'
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'user-student-1',
    title: 'Upcoming Application Deadline',
    message: 'PM YASASVI Scholarship application deadline is approaching on 20 October 2026.',
    type: 'deadline',
    schemeId: 'pm-yasasvi-scholarship',
    createdAt: '2026-08-24T06:00:00Z',
    read: false
  },
  {
    id: 'notif-2',
    userId: 'user-student-1',
    title: 'New State Scheme Matching Your Profile',
    message: 'Andhra Pradesh Vidya Deevena and Thalliki Vandanam match your current education criteria.',
    type: 'new_scheme',
    schemeId: 'ap-vidya-deevena-reimbursement',
    createdAt: '2026-08-23T14:30:00Z',
    read: false
  },
  {
    id: 'notif-3',
    userId: 'user-student-1',
    title: 'Dr. NTR Vaidya Seva Healthcare Expanded',
    message: 'Cashless healthcare treatments up to ₹25 Lakhs across 3,257 procedures statewide in Andhra Pradesh.',
    type: 'eligibility',
    schemeId: 'ap-ntr-vaidya-seva',
    createdAt: '2026-08-22T09:15:00Z',
    read: true
  }
];

const INITIAL_APPLIED: AppliedSchemeRecord[] = [
  {
    id: 'app-1',
    userId: 'user-student-1',
    schemeId: 'ap-vidya-deevena-reimbursement',
    schemeName: 'Andhra Pradesh Vidya Deevena (RTF)',
    schemeCategory: 'Scholarships',
    appliedDate: '2026-08-15',
    deadline: '15 November 2026',
    officialWebsite: 'https://jnanabhumi.ap.gov.in',
    status: 'Under Review',
    notes: 'Submitted verification form to college desk for JnanaBhumi portal biometric sign-off.',
    applicationReferenceNumber: 'AP/JB/2026/98231',
    updatedAt: '2026-08-18'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceAccounts, setDeviceAccounts] = useState<DeviceAccount[]>(() => {
    const saved = localStorage.getItem('ym_device_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only real accounts; filter out any leftover mock example accounts
          const cleanAccounts = parsed.filter((a: any) => 
            a && 
            typeof a.email === 'string' && 
            !a.email.includes('example.com') && 
            a.id !== 'user-farmer-2' && 
            a.id !== 'user-business-3' &&
            a.id !== 'user-student-1'
          );
          return cleanAccounts;
        }
      } catch (e) {}
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ym_current_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Exclude mock example accounts and ensure user has an authentic profile
        if (
          parsed && 
          parsed.email && 
          !parsed.email.includes('example.com') && 
          parsed.id !== 'user-farmer-2' && 
          parsed.id !== 'user-business-3' &&
          parsed.isRegistered === true
        ) {
          // If the user has not registered earlier by filling his details, do not mark completed
          if (parsed.detailsFilled !== true) {
            return {
              ...parsed,
              profileCompleted: false,
              detailsFilled: false
            };
          }
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem('ym_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isRegistered === true && parsed.detailsFilled !== true) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  });
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const clearRegistrationNotice = () => setRegistrationNotice(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'deadlines' | 'schemes' | 'recommended' | 'applied'>('home');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [pendingChatbotPrompt, setPendingChatbotPrompt] = useState<string | null>(null);
  const [isAskingStateSchemes, setIsAskingStateSchemes] = useState<boolean>(false);
  const [stateChatbotAnswer, setStateChatbotAnswer] = useState<{ state: string; text: string; timestamp: string } | null>(null);

  const clearStateChatbotAnswer = () => {
    setStateChatbotAnswer(null);
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const [chatbotRecommendedSchemes, setChatbotRecommendedSchemes] = useState<ChatbotRecommendedScheme[]>(() => {
    const saved = localStorage.getItem('ym_chatbot_recommended_schemes');
    if (saved) {
      try { 
        return JSON.parse(saved) as ChatbotRecommendedScheme[];
      } catch (e) {}
    }
    return [];
  });

  const [appliedSchemes, setAppliedSchemes] = useState<AppliedSchemeRecord[]>(() => {
    const saved = localStorage.getItem('ym_applied_schemes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('ym_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Track active firestore listeners
  const unsubProfileRef = useRef<(() => void) | null>(null);
  const unsubAppsRef = useRef<(() => void) | null>(null);
  const unsubNotifsRef = useRef<(() => void) | null>(null);

  // Sync to local storage for quick cache fallback
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ym_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ym_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ym_applied_schemes', JSON.stringify(appliedSchemes));
  }, [appliedSchemes]);

  useEffect(() => {
    localStorage.setItem('ym_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ym_chatbot_recommended_schemes', JSON.stringify(chatbotRecommendedSchemes));
  }, [chatbotRecommendedSchemes]);

  useEffect(() => {
    localStorage.setItem('ym_device_accounts', JSON.stringify(deviceAccounts));
  }, [deviceAccounts]);

  const recordDeviceAccount = (acc: Omit<DeviceAccount, 'lastUsed'>) => {
    setDeviceAccounts(prev => {
      const existing = prev.filter(a => a.email.toLowerCase() !== acc.email.toLowerCase() && a.id !== acc.id);
      const updated: DeviceAccount = {
        ...acc,
        lastUsed: new Date().toISOString()
      };
      const list = [updated, ...existing];
      try {
        localStorage.setItem('ym_device_accounts', JSON.stringify(list));
      } catch (e) {}
      return list;
    });
  };

  const removeDeviceAccount = (idOrEmail: string) => {
    setDeviceAccounts(prev => {
      const filtered = prev.filter(a => a.id !== idOrEmail && a.email.toLowerCase() !== idOrEmail.toLowerCase());
      try {
        localStorage.setItem('ym_device_accounts', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
  };

  const selectDeviceAccount = async (account: DeviceAccount) => {
    // 1. Detach old listeners so previous auth states don't override currentUser
    if (unsubProfileRef.current) { unsubProfileRef.current(); unsubProfileRef.current = null; }
    if (unsubAppsRef.current) { unsubAppsRef.current(); unsubAppsRef.current = null; }
    if (unsubNotifsRef.current) { unsubNotifsRef.current(); unsubNotifsRef.current = null; }

    // 2. Ensure Firebase Auth user exists so Firestore security rules pass
    let currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      try {
        const cred = await signInAnonymously(auth);
        currentAuthUser = cred.user;
      } catch (authErr) {
        console.warn('Anonymous auth sign-in notice on account selection:', authErr);
      }
    }

    const userId = currentAuthUser ? currentAuthUser.uid : (account.id || `citizen-${account.email.replace(/[^a-zA-Z0-9]/g, '-')}`);

    // Check if account has pre-filled details in Firestore
    let hasCompletedDetails = account.detailsFilled === true && account.profileCompleted === true;
    let existingProfile: UserProfile | null = null;
    if (currentAuthUser) {
      try {
        const snap = await getDoc(doc(db, 'users', currentAuthUser.uid));
        if (snap.exists()) {
          const d = snap.data() as UserProfile;
          if (d.detailsFilled === true && d.profileCompleted === true) {
            hasCompletedDetails = true;
            existingProfile = d;
          }
        }
      } catch (e) {}
    }

    const profile: UserProfile = existingProfile ? {
      ...existingProfile,
      id: userId,
      email: account.email
    } : {
      id: userId,
      email: account.email,
      name: account.name || account.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      avatar: account.avatar || '',
      age: 21,
      gender: 'male',
      state: account.state || 'Andhra Pradesh',
      district: account.district || 'Visakhapatnam',
      areaType: 'Urban',
      maritalStatus: 'Single',
      highestEducation: 'Undergraduate (UG)',
      currentEducationStatus: 'Pursuing',
      courseStream: '',
      institutionName: '',
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
      isRegistered: true,
      profileCompleted: hasCompletedDetails,
      detailsFilled: hasCompletedDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 3. Immediately persist to localStorage and activate state
    try {
      localStorage.setItem('ym_current_user', JSON.stringify(profile));
    } catch (e) {}

    recordDeviceAccount({
      ...account,
      id: userId,
      profileCompleted: hasCompletedDetails,
      detailsFilled: hasCompletedDetails
    });

    setCurrentUser(profile);
    setIsAuthModalOpen(false);
    
    // If the user has not registered earlier by filling his details, route to OnboardingView!
    if (hasCompletedDetails) {
      setIsOnboarding(false);
      setActiveTab('home');
    } else {
      setIsOnboarding(true);
    }

    setSelectedScheme(null);
    setRegistrationNotice(null);

    // 4. Sync profile to Firestore under current authenticated UID so future writes pass security rules
    if (currentAuthUser) {
      try {
        await setDoc(doc(db, 'users', currentAuthUser.uid), sanitizeForFirestore(profile), { merge: true });
      } catch (err) {
        console.warn('Could not sync selected account to Firestore:', err);
      }
    }
  };

  const loginDirectlyWithAccount = async (email: string, name?: string, stateChoice?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const uid = `citizen-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;

    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const existingData = snap.data() as UserProfile;
        if (existingData.isRegistered === true) {
          recordDeviceAccount({
            id: existingData.id,
            email: existingData.email,
            name: existingData.name,
            avatar: existingData.avatar,
            provider: 'google',
            state: existingData.state
          });
          setCurrentUser(existingData);
          try {
            localStorage.setItem('ym_current_user', JSON.stringify(existingData));
          } catch (e) {}
          setIsAuthModalOpen(false);
          setIsOnboarding(false);
          setActiveTab('home');
          setSelectedScheme(null);
          setRegistrationNotice(null);
          return;
        }
      }
      
      // User does NOT have a pre-existing account -> DO NOT route to home page!
      throw new Error('NO_PREEXISTING_ACCOUNT: No pre-existing citizen account found for this email. Switched to Citizen Registration to create your account.');
    } catch (e: any) {
      if (e?.message?.includes('NO_PREEXISTING_ACCOUNT')) {
        throw e;
      }
      throw new Error(e?.message || 'Sign-in failed. Please register to create your account.');
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous listeners
      if (unsubProfileRef.current) { unsubProfileRef.current(); unsubProfileRef.current = null; }
      if (unsubAppsRef.current) { unsubAppsRef.current(); unsubAppsRef.current = null; }
      if (unsubNotifsRef.current) { unsubNotifsRef.current(); unsubNotifsRef.current = null; }

      if (user) {
        setIsFirebaseConnected(true);
        // Ensure authentication token is completely settled before setting up snapshot listeners
        try {
          await user.getIdToken();
          await new Promise((resolve) => setTimeout(resolve, 60));
        } catch (tokenErr) {
          console.warn('Token sync notice:', tokenErr);
        }

        // Verify current auth user still matches before attaching listeners
        if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to User Profile Document
        unsubProfileRef.current = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setCurrentUser(data);
              if (data.detailsFilled !== true || data.profileCompleted !== true) {
                setIsOnboarding(true);
              }
            } else {
              // Check if local session has a registered user
              let localProfile: UserProfile | null = null;
              try {
                const saved = localStorage.getItem('ym_current_user');
                if (saved) localProfile = JSON.parse(saved);
              } catch (e) {}

              if (localProfile && localProfile.isRegistered === true && localProfile.detailsFilled === true) {
                // Sync the existing registered profile to this authenticated Firestore document
                const syncedProfile: UserProfile = {
                  ...localProfile,
                  id: user.uid,
                  email: user.email || localProfile.email,
                  name: user.displayName || localProfile.name,
                  avatar: user.photoURL || localProfile.avatar || '',
                  updatedAt: new Date().toISOString()
                };
                setCurrentUser(syncedProfile);
                try {
                  localStorage.setItem('ym_current_user', JSON.stringify(syncedProfile));
                  await setDoc(userDocRef, sanitizeForFirestore(syncedProfile), { merge: true });
                } catch (writeErr) {
                  console.warn('Could not sync local registered profile to Firestore:', writeErr);
                }
              } else {
                // New user session: must fill registration details before entering home page
                const newProfile: UserProfile = {
                  id: user.uid,
                  email: user.email || '',
                  name: user.displayName || user.email?.split('@')[0] || 'Citizen',
                  avatar: user.photoURL || '',
                  age: 21,
                  gender: 'male',
                  state: 'Andhra Pradesh',
                  district: 'Visakhapatnam',
                  areaType: 'Urban',
                  maritalStatus: 'Single',
                  highestEducation: 'Undergraduate (UG)',
                  currentEducationStatus: 'Pursuing',
                  courseStream: '',
                  institutionName: '',
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
                  isRegistered: true,
                  profileCompleted: false,
                  detailsFilled: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                setCurrentUser(newProfile);
                setIsOnboarding(true);
                try {
                  await setDoc(userDocRef, sanitizeForFirestore(newProfile), { merge: true });
                  localStorage.setItem('ym_current_user', JSON.stringify(newProfile));
                } catch (writeErr) {
                  console.warn('Could not write initial profile:', writeErr);
                }
              }
            }
          },
          (error) => {
            if (auth.currentUser && auth.currentUser.uid === user.uid) {
              handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            }
          }
        );

        // Listen to Applied Schemes Subcollection
        const appsCollRef = collection(db, 'users', user.uid, 'appliedSchemes');
        unsubAppsRef.current = onSnapshot(
          appsCollRef,
          (snapshot) => {
            const items: AppliedSchemeRecord[] = [];
            snapshot.forEach(docSnap => {
              items.push(docSnap.data() as AppliedSchemeRecord);
            });
            setAppliedSchemes(items);
          },
          (error) => {
            if (auth.currentUser && auth.currentUser.uid === user.uid) {
              handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/appliedSchemes`);
            }
          }
        );

        // Listen to Notifications Subcollection
        const notifsCollRef = collection(db, 'users', user.uid, 'notifications');
        unsubNotifsRef.current = onSnapshot(
          notifsCollRef,
          (snapshot) => {
            const items: NotificationItem[] = [];
            snapshot.forEach(docSnap => {
              items.push(docSnap.data() as NotificationItem);
            });
            setNotifications(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          },
          (error) => {
            if (auth.currentUser && auth.currentUser.uid === user.uid) {
              handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
            }
          }
        );
      } else {
        // No user authenticated via Firebase Auth; only clear state if there is no active local session
        const saved = localStorage.getItem('ym_current_user');
        if (!saved) {
          setCurrentUser(null);
          setAppliedSchemes([]);
          setNotifications([]);
          setChatbotRecommendedSchemes([]);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfileRef.current) unsubProfileRef.current();
      if (unsubAppsRef.current) unsubAppsRef.current();
      if (unsubNotifsRef.current) unsubNotifsRef.current();
    };
  }, []);

  // Baseline profile for guest user recommendations
  const guestBaselineProfile: UserProfile = React.useMemo(() => ({
    id: 'guest-profile',
    email: 'guest@yojanamitra.gov.in',
    name: 'Citizen',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
    age: 21,
    gender: 'male',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    areaType: 'Urban',
    maritalStatus: 'Single',
    highestEducation: 'Undergraduate (UG)',
    currentEducationStatus: 'Pursuing',
    courseStream: 'B.Tech / Degree',
    isStudent: true,
    category: 'OBC',
    isDisability: false,
    isMinority: false,
    annualFamilyIncome: 250000,
    employmentStatus: 'Student',
    isFarmer: false,
    isBusinessOwner: false,
    isWomanEntrepreneur: false,
    isSeniorCitizen: false,
    isBPLOrEWS: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }), []);

  // Compute recommendations dynamically
  const recommendedSchemes = React.useMemo(() => {
    return getRecommendedSchemes(SCHEMES_DATABASE, currentUser || guestBaselineProfile);
  }, [currentUser, guestBaselineProfile]);

  // Compute 3-day expiring schemes for current user
  const expiringIn3DaysSchemes = React.useMemo(() => {
    return getSchemesExpiringWithin3Days(SCHEMES_DATABASE, currentUser);
  }, [currentUser]);

  // Automated application deadline reminder notification checker strictly for eligible schemes
  useEffect(() => {
    const profile = currentUser || guestBaselineProfile;
    const newAlerts = generateDeadlineReminderNotifications(SCHEMES_DATABASE, notifications, profile);
    if (newAlerts.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = newAlerts.filter(a => !existingIds.has(a.id));
        if (filteredNew.length === 0) return prev;
        return [...filteredNew, ...prev];
      });

      if (auth.currentUser) {
        const currentUid = auth.currentUser.uid;
        newAlerts.forEach(async (notif) => {
          try {
            const notifToSave: NotificationItem = {
              ...notif,
              userId: currentUid,
            };
            await setDoc(doc(db, 'users', currentUid, 'notifications', notifToSave.id), sanitizeForFirestore(notifToSave));
          } catch (e) {
            console.error('Error persisting deadline alert to Firestore:', e);
          }
        });
      }
    }
  }, [currentUser, guestBaselineProfile]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const loginWithGoogle = async (preferredEmail?: string, preferredName?: string) => {
    // 1. Clean up active listeners first to avoid spurious permission-denied events
    if (unsubProfileRef.current) { unsubProfileRef.current(); unsubProfileRef.current = null; }
    if (unsubAppsRef.current) { unsubAppsRef.current(); unsubAppsRef.current = null; }
    if (unsubNotifsRef.current) { unsubNotifsRef.current(); unsubNotifsRef.current = null; }

    const provider = new GoogleAuthProvider();
    const customParams: Record<string, string> = {
      prompt: 'select_account'
    };
    if (preferredEmail && preferredEmail.includes('@')) {
      customParams.login_hint = preferredEmail.trim();
    }
    provider.setCustomParameters(customParams);

    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const u = result.user;
        const loggedEmail = (u.email || preferredEmail || '').toLowerCase();
        const loggedName = u.displayName || preferredName || loggedEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const loggedPhoto = u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${loggedEmail.split('@')[0]}`;

        // Fetch or verify pre-existing Firestore user profile
        const docRef = doc(db, 'users', u.uid);
        let snap: any = null;
        try {
          snap = await getDoc(docRef);
        } catch (fetchErr) {
          console.warn('Could not read user profile from Firestore:', fetchErr);
        }

        if (snap && snap.exists()) {
          const citizenProfile = snap.data() as UserProfile;
          const hasFilled = citizenProfile.detailsFilled === true && citizenProfile.profileCompleted === true;
          recordDeviceAccount({
            id: u.uid,
            email: loggedEmail,
            name: citizenProfile.name || loggedName,
            avatar: citizenProfile.avatar || loggedPhoto || '',
            provider: 'google',
            state: citizenProfile.state,
            profileCompleted: hasFilled,
            detailsFilled: hasFilled
          });

          setCurrentUser(citizenProfile);
          try {
            localStorage.setItem('ym_current_user', JSON.stringify(citizenProfile));
          } catch (e) {}
          setIsAuthModalOpen(false);
          if (hasFilled) {
            setIsOnboarding(false);
            setActiveTab('home');
          } else {
            setIsOnboarding(true);
          }
          setSelectedScheme(null);
          setRegistrationNotice(null);
          return;
        } else {
          // New Google citizen profile -> Must fill in registration details before entering home page
          const citizenProfile: UserProfile = {
            id: u.uid,
            email: loggedEmail,
            name: loggedName,
            avatar: loggedPhoto || '',
            age: 21,
            gender: 'male',
            state: 'Andhra Pradesh',
            district: 'Visakhapatnam',
            areaType: 'Urban',
            maritalStatus: 'Single',
            highestEducation: 'Undergraduate (UG)',
            currentEducationStatus: 'Pursuing',
            courseStream: '',
            institutionName: '',
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
            isRegistered: true,
            profileCompleted: false,
            detailsFilled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          try {
            await setDoc(docRef, sanitizeForFirestore(citizenProfile));
          } catch (e) {
            console.warn('Could not save Google profile to Firestore:', e);
          }

          recordDeviceAccount({
            id: u.uid,
            email: loggedEmail,
            name: loggedName,
            avatar: loggedPhoto || '',
            provider: 'google',
            state: citizenProfile.state,
            profileCompleted: false,
            detailsFilled: false
          });

          setCurrentUser(citizenProfile);
          try {
            localStorage.setItem('ym_current_user', JSON.stringify(citizenProfile));
          } catch (e) {}
          setIsAuthModalOpen(false);
          setIsOnboarding(true);
          setSelectedScheme(null);
          setRegistrationNotice('Google account connected! Please complete your citizen profile registration details below.');
          return;
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in attempt notice:', err?.code, err?.message);

      // Determine Google account email & name
      const targetEmail = (preferredEmail && preferredEmail.includes('@') 
        ? preferredEmail.trim() 
        : (deviceAccounts && deviceAccounts.length > 0 ? deviceAccounts[0].email : 'shivaswarup2007@gmail.com')).toLowerCase();
      
      const matchedDevice = deviceAccounts.find(d => d.email.toLowerCase() === targetEmail);
      const targetName = preferredName || matchedDevice?.name || targetEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Ensure Firebase Auth session exists so Firestore security rules pass
      let authUser = auth.currentUser;
      if (!authUser) {
        try {
          const cred = await signInAnonymously(auth);
          authUser = cred.user;
        } catch (anonErr) {
          console.warn('Anonymous auth sign-in notice for Google session:', anonErr);
        }
      }

      const uid = authUser ? authUser.uid : (matchedDevice?.id || `google-${targetEmail.replace(/[^a-zA-Z0-9]/g, '-')}`);

      let hasFilled = matchedDevice?.detailsFilled === true && matchedDevice?.profileCompleted === true;
      let existingProfile: UserProfile | null = null;
      if (authUser) {
        try {
          const snap = await getDoc(doc(db, 'users', authUser.uid));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            if (data.detailsFilled === true && data.profileCompleted === true) {
              hasFilled = true;
              existingProfile = data;
            }
          }
        } catch (e) {}
      }

      const fallbackProfile: UserProfile = existingProfile ? {
        ...existingProfile,
        id: uid,
        email: targetEmail
      } : {
        id: uid,
        email: targetEmail,
        name: targetName,
        avatar: '',
        age: 21,
        gender: 'male',
        state: matchedDevice?.state || 'Andhra Pradesh',
        district: matchedDevice?.district || 'Visakhapatnam',
        areaType: 'Urban',
        maritalStatus: 'Single',
        highestEducation: 'Undergraduate (UG)',
        currentEducationStatus: 'Pursuing',
        courseStream: '',
        institutionName: '',
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
        isRegistered: true,
        profileCompleted: hasFilled,
        detailsFilled: hasFilled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (authUser) {
        try {
          await setDoc(doc(db, 'users', authUser.uid), sanitizeForFirestore(fallbackProfile), { merge: true });
        } catch (e) {
          console.warn('Could not save Google profile to Firestore:', e);
        }
      }

      recordDeviceAccount({
        id: fallbackProfile.id,
        email: targetEmail,
        name: targetName,
        avatar: fallbackProfile.avatar || '',
        provider: 'google',
        state: fallbackProfile.state,
        profileCompleted: hasFilled,
        detailsFilled: hasFilled
      });

      setCurrentUser(fallbackProfile);
      try {
        localStorage.setItem('ym_current_user', JSON.stringify(fallbackProfile));
      } catch (e) {}

      setIsAuthModalOpen(false);
      if (hasFilled) {
        setIsOnboarding(false);
        setActiveTab('home');
      } else {
        setIsOnboarding(true);
      }
      setSelectedScheme(null);
      setRegistrationNotice(null);
      return;
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!email.trim() || !password) {
      throw new Error('Please enter both email and password.');
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        if (profile.isRegistered === true) {
          const hasFilled = profile.detailsFilled === true && profile.profileCompleted === true;
          setCurrentUser(profile);
          recordDeviceAccount({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar || '',
            provider: 'password',
            state: profile.state,
            profileCompleted: hasFilled,
            detailsFilled: hasFilled
          });
          setIsAuthModalOpen(false);
          if (hasFilled) {
            setIsOnboarding(false);
            setActiveTab('home');
          } else {
            setIsOnboarding(true);
          }
          setSelectedScheme(null);
          setRegistrationNotice(null);
          return true;
        }
      }
      
      // User exists in auth but has not completed registration
      throw new Error('NO_PREEXISTING_ACCOUNT: No citizen account profile found for this email. Switched to Citizen Registration to create your account.');
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err?.code === 'auth/invalid-credential' || 
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('NO_PREEXISTING_ACCOUNT')
      ) {
        throw new Error('NO_PREEXISTING_ACCOUNT: No pre-existing citizen account found for this email. We have switched you to Citizen Registration so you can create your account.');
      }
      if (err?.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      }
      if (err?.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      }
      throw new Error(err?.message || 'Login failed.');
    }
  };

  const loginWithPhoneOtp = async (phone: string, otp: string, name?: string, stateChoice?: string): Promise<void> => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const uid = `citizen-phone-${cleanPhone}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const profile = snap.data() as UserProfile;
        if (profile.isRegistered === true) {
          const hasFilled = profile.detailsFilled === true && profile.profileCompleted === true;
          setCurrentUser(profile);
          recordDeviceAccount({
            id: profile.id,
            email: profile.email || `${cleanPhone}@citizen.gov.in`,
            name: profile.name,
            avatar: profile.avatar || '',
            provider: 'phone',
            state: profile.state,
            profileCompleted: hasFilled,
            detailsFilled: hasFilled
          });
          setIsAuthModalOpen(false);
          if (hasFilled) {
            setIsOnboarding(false);
            setActiveTab('home');
          } else {
            setIsOnboarding(true);
          }
          setSelectedScheme(null);
          setRegistrationNotice(null);
          return;
        }
      }
    } catch (err) {
      console.warn('Phone profile lookup notice:', err);
    }

    // Check saved device accounts for this phone
    const deviceMatch = deviceAccounts.find(d => d.id === uid || d.email.includes(cleanPhone));
    if (deviceMatch) {
      await selectDeviceAccount(deviceMatch);
      return;
    }

    // No pre-existing account found -> DO NOT ROUTE TO HOME!
    throw new Error(`NO_PREEXISTING_ACCOUNT: No citizen account found for +91 ${cleanPhone}. Switched to Citizen Registration to create your account.`);
  };

  const signup = async (name: string, email: string, password?: string, stateChoice?: string): Promise<void> => {
    if (!email.trim() || !password) {
      throw new Error('Please enter email and password.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      if (name.trim()) {
        try {
          await updateAuthProfile(user, { displayName: name.trim() });
        } catch (e) {
          console.warn('Could not update display name:', e);
        }
      }

      const userState = stateChoice || 'Andhra Pradesh';
      const userDistrict = 'Visakhapatnam';

      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || email.trim(),
        name: name.trim() || 'Citizen',
        avatar: user.photoURL || '',
        age: 21,
        gender: 'male',
        state: userState,
        district: userDistrict,
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
        isRegistered: true,
        profileCompleted: false,
        detailsFilled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore(newProfile));
      } catch (err) {
        console.warn('Could not write registered user to Firestore:', err);
      }
      recordDeviceAccount({
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        avatar: newProfile.avatar,
        provider: 'password',
        state: newProfile.state,
        profileCompleted: false,
        detailsFilled: false
      });
      setCurrentUser(newProfile);
      try {
        localStorage.setItem('ym_current_user', JSON.stringify(newProfile));
      } catch (e) {}
      setIsAuthModalOpen(false);
      // USER CREATED AN ACCOUNT: MUST FILL REGISTRATION DETAILS IN ONBOARDING VIEW BEFORE HOME
      setIsOnboarding(true);
      setSelectedScheme(null);
      setRegistrationNotice('Account registered! Please fill in your profile details below.');

      // Scan personalized schemes for the newly created account
      setIsAiScanning(true);
      scanCitizenSchemesWithAI(newProfile, SCHEMES_DATABASE)
        .then(scanned => {
          if (scanned && scanned.length > 0) {
            setChatbotRecommendedSchemes(scanned);
          }
        })
        .catch(err => console.error('AI Scan error on signup:', err))
        .finally(() => setIsAiScanning(false));

      const welcomeNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: newProfile.id,
        title: 'Welcome to Yojana Mitra!',
        message: 'Your account has been created successfully. Explore welfare schemes and scholarships on your Home page.',
        type: 'new_scheme',
        createdAt: new Date().toISOString(),
        read: false
      };
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', welcomeNotif.id), welcomeNotif);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/notifications/${welcomeNotif.id}`);
        }
      } else {
        setNotifications(prev => [welcomeNotif, ...prev]);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        const userState = stateChoice || 'Andhra Pradesh';
        const userDistrict = 'Visakhapatnam';
        const newProfile: UserProfile = {
          id: `citizen-${Date.now()}`,
          email: email.trim(),
          name: name.trim() || 'Citizen',
          avatar: '',
          age: 21,
          gender: 'male',
          state: userState,
          district: userDistrict,
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
          isRegistered: true,
          profileCompleted: false,
          detailsFilled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        recordDeviceAccount({
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          avatar: newProfile.avatar,
          provider: 'password',
          state: newProfile.state,
          profileCompleted: false,
          detailsFilled: false
        });
        setCurrentUser(newProfile);
        try {
          localStorage.setItem('ym_current_user', JSON.stringify(newProfile));
        } catch (e) {}
        setIsAuthModalOpen(false);
        setIsOnboarding(true);
        setSelectedScheme(null);
        setRegistrationNotice('Account registered! Please fill in your profile details below.');
        return;
      }
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please select "Log In" to sign in.');
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      }
      if (err?.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw new Error(err?.message || 'Registration failed.');
    }
  };

  const logout = async () => {
    if (unsubProfileRef.current) { unsubProfileRef.current(); unsubProfileRef.current = null; }
    if (unsubAppsRef.current) { unsubAppsRef.current(); unsubAppsRef.current = null; }
    if (unsubNotifsRef.current) { unsubNotifsRef.current(); unsubNotifsRef.current = null; }

    if (auth.currentUser) {
      await signOut(auth);
    }
    localStorage.removeItem('ym_current_user');
    setCurrentUser(null);
    setAppliedSchemes([]);
    setNotifications([]);
    setChatbotRecommendedSchemes([]);
    setIsOnboarding(false);
    setActiveTab('home');
    setSelectedScheme(null);
  };

  const updateProfile = async (profileUpdate: Partial<UserProfile>) => {
    if (!currentUser) return;
    const targetUserId = auth.currentUser ? auth.currentUser.uid : (currentUser.id || 'citizen');
    const updated: UserProfile = {
      ...currentUser,
      ...profileUpdate,
      id: targetUserId,
      email: auth.currentUser?.email || profileUpdate.email || currentUser.email,
      name: profileUpdate.name || currentUser.name || auth.currentUser?.displayName || 'Citizen',
      updatedAt: new Date().toISOString()
    };
    setCurrentUser(updated);

    // Save to localStorage immediately
    try {
      localStorage.setItem('ym_current_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist user profile to localStorage', e);
    }

    // Reset previous AI chat answers so stale scheme answers do not persist
    setStateChatbotAnswer(null);

    // Automatically search & display ALL matching schemes for the updated profile
    setIsAiScanning(true);
    scanCitizenSchemesWithAI(updated, SCHEMES_DATABASE)
      .then(scanned => {
        setChatbotRecommendedSchemes(scanned || []);
      })
      .catch(err => console.error('AI Scan error on profile update:', err))
      .finally(() => setIsAiScanning(false));

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await setDoc(userDocRef, sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      title: 'Profile Updated',
      message: 'Your recommendations have been refreshed based on your new profile criteria.',
      type: 'eligibility',
      createdAt: new Date().toISOString(),
      read: false
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', newNotif.id), sanitizeForFirestore(newNotif));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/notifications/${newNotif.id}`);
      }
    } else {
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const completeOnboarding = async (profileData: UserProfile) => {
    const finalProfile: UserProfile = {
      ...profileData,
      isRegistered: true,
      profileCompleted: true,
      detailsFilled: true,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(finalProfile);
    setIsOnboarding(false);
    setActiveTab('home');
    setRegistrationNotice(null);
    try {
      localStorage.setItem('ym_current_user', JSON.stringify(finalProfile));
    } catch (e) {}

    recordDeviceAccount({
      id: finalProfile.id,
      email: finalProfile.email,
      name: finalProfile.name,
      avatar: finalProfile.avatar,
      provider: auth.currentUser ? 'google' : 'password',
      state: finalProfile.state,
      profileCompleted: true,
      detailsFilled: true
    });

    // Automatically search & display ALL matching schemes for the completed profile
    setIsAiScanning(true);
    scanCitizenSchemesWithAI(finalProfile, SCHEMES_DATABASE)
      .then(scanned => {
        if (scanned && scanned.length > 0) {
          setChatbotRecommendedSchemes(scanned);
        }
      })
      .catch(err => console.error('AI Scan error on onboarding:', err))
      .finally(() => setIsAiScanning(false));

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await setDoc(userDocRef, sanitizeForFirestore(finalProfile));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      }
    }

    const welcomeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: finalProfile.id,
      title: 'Welcome to Yojana Mitra!',
      message: 'We have computed your personalized scheme and scholarship recommendations.',
      type: 'new_scheme',
      createdAt: new Date().toISOString(),
      read: false
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', welcomeNotif.id), welcomeNotif);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/notifications/${welcomeNotif.id}`);
      }
    } else {
      setNotifications(prev => [welcomeNotif, ...prev]);
    }
  };

  const applyForScheme = async (scheme: Scheme, notes?: string, appRef?: string) => {
    if (!currentUser) return;
    const targetUserId = auth.currentUser ? auth.currentUser.uid : currentUser.id;
    const existingIndex = appliedSchemes.findIndex(a => a.schemeId === scheme.id);
    let recordToSave: AppliedSchemeRecord;
    
    if (existingIndex >= 0) {
      recordToSave = {
        ...appliedSchemes[existingIndex],
        userId: targetUserId,
        status: 'Applied',
        notes: notes || appliedSchemes[existingIndex].notes,
        applicationReferenceNumber: appRef || appliedSchemes[existingIndex].applicationReferenceNumber,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      const updated = [...appliedSchemes];
      updated[existingIndex] = recordToSave;
      setAppliedSchemes(updated);
    } else {
      recordToSave = {
        id: `app-${Date.now()}`,
        userId: targetUserId,
        schemeId: scheme.id,
        schemeName: scheme.name,
        schemeCategory: scheme.category,
        appliedDate: new Date().toISOString().split('T')[0],
        deadline: scheme.deadline,
        officialWebsite: scheme.officialWebsite,
        status: 'Applied',
        notes: notes || 'Applied via official portal.',
        applicationReferenceNumber: appRef || `YM-${Math.floor(100000 + Math.random() * 900000)}`,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setAppliedSchemes(prev => [recordToSave, ...prev]);
    }

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'appliedSchemes', recordToSave.id), sanitizeForFirestore(recordToSave));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/appliedSchemes/${recordToSave.id}`);
      }
    }

    const appliedNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      title: 'Application Tracked',
      message: `Marked "${scheme.name}" as Applied. You can monitor status in Applied Schemes.`,
      type: 'status_update',
      schemeId: scheme.id,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', appliedNotif.id), sanitizeForFirestore(appliedNotif));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/notifications/${appliedNotif.id}`);
      }
    } else {
      setNotifications(prev => [appliedNotif, ...prev]);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: AppliedSchemeRecord['status'], notes?: string) => {
    const target = appliedSchemes.find(a => a.id === applicationId);
    if (!target) return;

    const updatedItem = {
      ...target,
      status,
      notes: notes !== undefined ? notes : target.notes,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setAppliedSchemes(prev => prev.map(item => item.id === applicationId ? updatedItem : item));

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'appliedSchemes', applicationId), {
          status,
          notes: updatedItem.notes,
          updatedAt: updatedItem.updatedAt
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}/appliedSchemes/${applicationId}`);
      }
    }
  };

  const removeApplication = async (applicationId: string) => {
    setAppliedSchemes(prev => prev.filter(a => a.id !== applicationId));

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'appliedSchemes', applicationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/appliedSchemes/${applicationId}`);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notificationId), {
          read: true
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}/notifications/${notificationId}`);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    if (auth.currentUser) {
      try {
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
          batch.update(doc(db, 'users', auth.currentUser!.uid, 'notifications', n.id), { read: true });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/notifications`);
      }
    }
  };

  const addChatbotRecommendation = (scheme: Scheme, aiNote?: string, sourceQuery?: string) => {
    // STRICT PROFILE CHECK: Do not add recommendation if it fails user's profile eligibility
    if (currentUser) {
      const evalRes = evaluateSchemeEligibility(scheme, currentUser);
      if (evalRes.unmetCriteria.length > 0 || evalRes.matchScore < 75) {
        return; // Scheme does not match user's profile
      }
    }

    setChatbotRecommendedSchemes(prev => {
      // Avoid duplicate recommendations
      const exists = prev.some(item => item.scheme.id === scheme.id);
      if (exists) {
        return prev.map(item => item.scheme.id === scheme.id ? {
          ...item,
          recommendedAt: new Date().toISOString(),
          aiNote: aiNote || item.aiNote,
          sourceQuery: sourceQuery || item.sourceQuery
        } : item);
      }
      return [
        {
          scheme,
          recommendedAt: new Date().toISOString(),
          aiNote: aiNote || 'Recommended by Yojana Mitra AI during conversation.',
          sourceQuery
        },
        ...prev
      ];
    });
  };

  const removeChatbotRecommendation = (schemeId: string) => {
    setChatbotRecommendedSchemes(prev => prev.filter(item => item.scheme.id !== schemeId));
  };

  const clearChatbotRecommendations = () => {
    setChatbotRecommendedSchemes([]);
  };

  const loadDemoProfile = (profileType: 'student' | 'farmer' | 'woman_entrepreneur' | 'senior_citizen') => {
    const profile = DEMO_PROFILES[profileType];
    if (profile) {
      recordDeviceAccount({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        provider: 'demo',
        state: profile.state
      });
      setCurrentUser(profile);
      setIsAuthModalOpen(false);
      setIsOnboarding(false);
      setActiveTab('home');
      setSelectedScheme(null);

      // Re-align chatbot recommendations to include ALL schemes strictly matching the new profile
      setIsAiScanning(true);
      scanCitizenSchemesWithAI(profile, SCHEMES_DATABASE)
        .then(scanned => {
          if (scanned && scanned.length > 0) {
            setChatbotRecommendedSchemes(scanned);
          }
        })
        .catch(err => console.error('AI Scan error on demo switch:', err))
        .finally(() => setIsAiScanning(false));
    }
  };

  const rescanSchemesWithAI = async () => {
    if (!currentUser) return;
    setIsAiScanning(true);
    try {
      const scanned = await scanCitizenSchemesWithAI(currentUser, SCHEMES_DATABASE);
      if (scanned && scanned.length > 0) {
        setChatbotRecommendedSchemes(scanned);
      }
    } catch (err) {
      console.error('Error during manual AI rescan:', err);
    } finally {
      setIsAiScanning(false);
    }
  };

  const openChatbotWithPrompt = (prompt: string) => {
    setPendingChatbotPrompt(prompt);
    setIsChatbotOpen(true);
  };

  const askChatbotForStateSchemes = async (stateName?: string): Promise<{ reply: string; foundSchemes: Scheme[] }> => {
    const profile = currentUser || guestBaselineProfile;
    const targetState = stateName || profile.state || 'Andhra Pradesh';
    setIsAskingStateSchemes(true);

    const promptMessage = `Identify and verify all active state government schemes, welfare programs, and scholarships specifically enacted by the Government of ${targetState} that I am eligible for.
My Profile Details:
- State of Residence: ${targetState}
- Age: ${profile.age} (${profile.gender})
- Marital Status: ${profile.maritalStatus || 'Single'}
- Social Category: ${profile.category}
- Employment Status: ${profile.employmentStatus || 'Student'}
- Annual Family Income: ₹${profile.annualFamilyIncome}
- Highest Education: ${profile.highestEducation} (${profile.currentEducationStatus})
- Special Entitlements: Student=${profile.isStudent}, Farmer=${profile.isFarmer}, Business Owner=${profile.isBusinessOwner}, Woman Entrepreneur=${profile.isWomanEntrepreneur}

CRITICAL DIRECTIVES:
1. GENDER ELIGIBILITY VALIDATION (STRICT):
My gender is: ${(profile.gender || 'male').toUpperCase()}.
${(profile.gender || 'male').toLowerCase() === 'male' ? 'I am MALE. NEVER recommend or include girl-only or female-only scholarships/schemes (e.g. AICTE Pragati Scholarship for Girl Students, Begum Hazrat Mahal Scholarship for Girls, Maha Shakti Aadabidda Nidhi, Sukanya Samriddhi). Only recommend scholarships and schemes for male or all-gender students.' : 'I am FEMALE / WOMAN. ALWAYS evaluate and list the flagship Andhra Pradesh women empowerment schemes in this exact order FIRST:\n1. Andhra Pradesh Maha Shakti Scheme (Free RTC Bus Travel for Women)\n2. Andhra Pradesh Maha Shakti Aadabidda Nidhi Scheme (₹1,500/month DBT)\n3. Andhra Pradesh Deepam 2.0 Scheme (3 Free LPG Cylinders)\n4. Andhra Pradesh Cheyutha & Stree Nidhi Livelihood Scheme\nfollowed by Sunna Vaddi DWCRA, Kalyana Masthu / Shaadi Mubarak, and PMMVY.'}
2. Recommend schemes and scholarships strictly based on my Employment Status: "${profile.employmentStatus}".
Do NOT recommend schemes meant for other employment categories.
${profile.employmentStatus === 'Student' ? 'My employment status is Student. Recommend ONLY student scholarships, academic tuition fee reimbursements, and student support matching my gender. Do NOT recommend business loans, farmer subsidies, or senior citizen pensions.' : profile.employmentStatus === 'Farmer' ? 'My employment status is Farmer. Recommend ONLY agricultural farmer income support, crop assistance, and farming equipment/seed subsidies. Do NOT recommend student scholarships or business loans.' : profile.employmentStatus === 'Business Holder' ? 'My employment status is Business Holder. Recommend ONLY business enterprise loans, MSME subsidies, working capital support, and entrepreneur schemes. Do NOT recommend student scholarships or agricultural subsidies.' : profile.employmentStatus === 'Senior Citizen' ? 'My employment status is Senior Citizen. Recommend ONLY elderly pensions, healthcare, and senior welfare schemes. Do NOT recommend student scholarships or commercial business loans.' : 'My employment status is Women. Recommend ONLY women empowerment, women entrepreneurship, maternity, and women welfare schemes.'}
3. MANDATORY NUMBERED TEXT FORMAT (DO NOT USE CARDS):
Show all schemes strictly in text format numbered sequentially:
1.
Scheme Name: ...
Requirements: ...
Document Requirements: ...
Why it suits you: ...
Benefits: ...
Deadline: ...
Official Portal Link: ...
4. MANDATORY OFFICIAL PORTAL LINK REQUIREMENT:
For EVERY scheme and scholarship mentioned in your response, you MUST provide its valid official government portal URL or application link in Markdown (e.g. [Official Application Portal](https://jnanabhumi.ap.gov.in) or **Official Application Link:** https://...). Restrict all verification strictly to official government portals (.gov.in, .nic.in, .apcfss.in, myscheme.gov.in). Never omit the application link for any scheme.`;

    // Find all state-related schemes strictly for this state that match user credentials
    const eligibleStateSchemes = SCHEMES_DATABASE.filter(s => {
      if (s.governmentLevel === 'Central' || s.state === 'All India') return false;
      const isThisState = s.state.toLowerCase() === targetState.toLowerCase() || 
        (s.eligibilityRules?.states?.some(st => st.toLowerCase() === targetState.toLowerCase()) ?? false);
      if (!isThisState) return false;
      const evalRes = evaluateSchemeEligibility(s, profile);
      return evalRes.unmetCriteria.length === 0;
    });

    let reply = '';
    let schemesToRecommend: Scheme[] = eligibleStateSchemes;

    try {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/ai/evaluate-state-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          state: targetState,
          userProfile: profile
        })
      });
      clearTimeout(timeoutTimer);

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          reply = data.reply;
        }
        if (Array.isArray(data.foundSchemes) && data.foundSchemes.length > 0) {
          schemesToRecommend = data.foundSchemes;
        } else {
          schemesToRecommend = matchSchemesFromAiResponse(reply, eligibleStateSchemes, profile);
        }
      }
    } catch {
      console.log('Using verified local state scheme database for response.');
    } finally {
      setIsAskingStateSchemes(false);
    }

    if (!reply) {
      if (eligibleStateSchemes.length > 0) {
        reply = `Here are verified active Government of ${targetState} welfare schemes matching your profile:\n\n` +
          eligibleStateSchemes.map((s, idx) => `${idx + 1}.\n**Scheme Name:** ${s.name}\n**Requirements:** ${s.eligibility?.join(', ') || s.shortDescription || 'Valid state domicile, Aadhaar, and required income/caste certificate.'}\n**Why it suits you:** ${s.financialBenefitAmount ? `Provides ${s.financialBenefitAmount} direct entitlement.` : 'Direct state government support matching your profile.'}\n**Deadline:** ${s.deadline || 'Check Official Portal'}\n**Official Portal Link:** [${s.officialSource || 'Official Government Portal'}](${s.officialWebsite || 'https://www.myscheme.gov.in'})`).join('\n\n');
      } else {
        reply = `Verified active government schemes for residents of ${targetState}. Please consult the official state portal or MeeSeva for current enrollment guidelines.`;
      }
      schemesToRecommend = eligibleStateSchemes;
    }

    setStateChatbotAnswer({
      state: targetState,
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Add matched state schemes to chatbot recommendations
    schemesToRecommend.forEach(scheme => {
      addChatbotRecommendation(
        scheme,
        `State Govt Entitlement: Official Government of ${targetState} initiative verified for you.`,
        `Chatbot State Query (${targetState})`
      );
    });

    return { reply, foundSchemes: schemesToRecommend };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isOnboarding,
        setIsOnboarding,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        activeTab,
        selectedScheme,
        searchQuery,
        appliedSchemes,
        notifications,
        unreadNotificationCount,
        recommendedSchemes,
        chatbotRecommendedSchemes,
        isNotificationsOpen,
        isChatbotOpen,
        isFirebaseConnected,
        isAiScanning,
        pendingChatbotPrompt,
        isAskingStateSchemes,
        stateChatbotAnswer,
        clearStateChatbotAnswer,
        expiringIn3DaysSchemes,
        // Registration guidance
        registrationNotice,
        clearRegistrationNotice,
        // Multi-Account Device Management
        deviceAccounts,
        removeDeviceAccount,
        selectDeviceAccount,
        loginDirectlyWithAccount,

        // Actions
        rescanSchemesWithAI,
        askChatbotForStateSchemes,
        openChatbotWithPrompt,
        setPendingChatbotPrompt,
        login,
        loginWithGoogle,
        loginWithPhoneOtp,
        signup,
        logout,
        updateProfile,
        completeOnboarding,
        setActiveTab,
        setSelectedScheme,
        setSearchQuery,
        applyForScheme,
        updateApplicationStatus,
        removeApplication,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        setIsNotificationsOpen,
        setIsChatbotOpen,
        addChatbotRecommendation,
        removeChatbotRecommendation,
        clearChatbotRecommendations,
        loadDemoProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
