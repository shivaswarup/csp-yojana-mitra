export type Gender = 'male' | 'female' | 'other' | 'all';
export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority';
export type EducationLevel = 
  | 'Below 10th' 
  | '10th Pass (Matric)' 
  | '12th Pass (Intermediate)' 
  | 'Diploma/ITI' 
  | 'Undergraduate (UG)' 
  | 'Postgraduate (PG)' 
  | 'Doctorate/PhD' 
  | 'Vocational';

export type EmploymentStatus = 
  | 'Business Holder'
  | 'Farmer'
  | 'Student'
  | 'Senior Citizen'
  | 'Women';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  age: number;
  gender: Gender;
  dateOfBirth?: string;
  state: string;
  district: string;
  areaType: 'Rural' | 'Urban';
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  
  // Education
  highestEducation: EducationLevel;
  currentEducationStatus: 'Pursuing' | 'Completed' | 'Dropped Out';
  courseStream?: string;
  institutionName?: string;
  isStudent: boolean;
  
  // Social / Eligibility
  category: Category;
  isDisability: boolean;
  disabilityPercentage?: number;
  isMinority: boolean;
  minorityCommunity?: string;
  
  // Financial & Livelihood
  annualFamilyIncome: number; // in INR (e.g. 250000)
  employmentStatus: EmploymentStatus;
  occupation?: string; // Deprecated - primary occupation removed per specification
  
  // Specific status flags
  isFarmer: boolean;
  isBusinessOwner: boolean;
  isWomanEntrepreneur: boolean;
  isSeniorCitizen: boolean;
  isBPLOrEWS: boolean;
  hasKisanCreditCard?: boolean;
  landHoldingAcres?: number;
  
  // Registration and onboarding state
  isRegistered?: boolean;
  profileCompleted?: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface DeviceAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'password' | 'demo';
  lastUsed: string;
  state?: string;
  district?: string;
}

export type SchemeCategory = 
  | 'Education'
  | 'Scholarships'
  | 'Agriculture'
  | 'Women'
  | 'Employment'
  | 'Pension'
  | 'Health'
  | 'Healthcare'
  | 'Business'
  | 'Housing'
  | 'Student Welfare'
  | 'Social Security';

export type GovernmentLevel = 'Central' | 'State' | 'All India';

export interface EligibilityRules {
  minAge?: number;
  maxAge?: number;
  genders?: Gender[];
  states?: string[]; // Empty or ['All'] means all states
  categories?: Category[];
  maxIncome?: number; // Maximum family income per year in INR
  minEducation?: EducationLevel[];
  occupations?: string[];
  requiresStudent?: boolean;
  requiresFarmer?: boolean;
  requiresDisability?: boolean;
  requiresMinority?: boolean;
  requiresWomanEntrepreneur?: boolean;
  requiresSeniorCitizen?: boolean;
  requiresBusinessOwner?: boolean;
  requiresArtisan?: boolean;
  requiresStreetVendor?: boolean;
  requiresUnorganizedWorker?: boolean;
  requiresUnemployed?: boolean;
  areaType?: 'Rural' | 'Urban' | 'Both';
  maritalStatuses?: ('Single' | 'Married' | 'Widowed' | 'Divorced')[];
  specialCriteria?: string[];
}

export interface Scheme {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: SchemeCategory;
  state: string; // 'All India' or specific state: 'Andhra Pradesh'
  governmentLevel: GovernmentLevel;
  department: string;
  benefits: string[];
  financialBenefitAmount?: string; // e.g. "₹6,000 per year" or "100% Tuition fee waiver + ₹12,000/yr"
  eligibility: string[];
  eligibilityRules: EligibilityRules;
  requiredDocuments: string[];
  applicationProcess: string[];
  deadline: string; // ISO date or "30 September 2026" or "Open Year Round"
  deadlineDate?: string; // YYYY-MM-DD for sorting/filtering
  isDeadlineApproaching?: boolean;
  officialWebsite: string;
  officialSource: string; // e.g. "Ministry of Education / National Scholarship Portal"
  lastUpdated: string;
  tags: string[];
  targetEmploymentStatuses?: EmploymentStatus[];
}

export interface MatchReason {
  matched: boolean;
  criterion: string;
  detail: string;
}

export interface SchemeRecommendation {
  scheme: Scheme;
  matchScore: number; // 0 to 100
  matchBadge: '98% Match' | '95% Match' | '90% Match' | 'Highly Recommended' | 'You may be eligible' | 'Eligible';
  matchReasons: MatchReason[];
  unmetCriteria?: string[];
}

export interface ChatbotRecommendedScheme {
  scheme: Scheme;
  recommendedAt: string; // ISO string
  aiNote?: string;
  sourceQuery?: string;
}

export type ApplicationStatus = 'Not Applied' | 'Applied' | 'Under Review' | 'Approved' | 'Rejected';

export interface AppliedSchemeRecord {
  id: string;
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeCategory: SchemeCategory;
  appliedDate: string;
  deadline: string;
  officialWebsite: string;
  status: ApplicationStatus;
  notes?: string;
  applicationReferenceNumber?: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'new_scheme' | 'status_update' | 'eligibility';
  schemeId?: string;
  createdAt: string;
  read: boolean;
}
