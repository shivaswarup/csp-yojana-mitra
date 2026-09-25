import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  HeartHandshake, 
  IndianRupee, 
  Sparkles,
  ShieldCheck,
  Building2,
  X,
  Home
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, Category, EducationLevel, EmploymentStatus, Gender } from '../types';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/statesAndDistricts';

export const OnboardingView: React.FC = () => {
  const { currentUser, completeOnboarding, registrationNotice, clearRegistrationNotice, setIsOnboarding, setActiveTab } = useApp();
  
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const handleSkipToHome = () => {
    setIsOnboarding(false);
    setActiveTab('home');
  };

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    age: currentUser?.age && currentUser.age > 0 ? currentUser.age : 21,
    gender: currentUser?.gender || 'male',
    state: currentUser?.state || 'Andhra Pradesh',
    district: currentUser?.district || 'Visakhapatnam',
    areaType: currentUser?.areaType || 'Urban',
    maritalStatus: currentUser?.maritalStatus || 'Single',
    highestEducation: currentUser?.highestEducation || 'Undergraduate (UG)',
    currentEducationStatus: currentUser?.currentEducationStatus || 'Pursuing',
    courseStream: currentUser?.courseStream || '',
    institutionName: currentUser?.institutionName || '',
    category: currentUser?.category || 'General',
    isDisability: currentUser?.isDisability || false,
    isMinority: currentUser?.isMinority || false,
    annualFamilyIncome: currentUser?.annualFamilyIncome && currentUser.annualFamilyIncome > 0 ? currentUser.annualFamilyIncome : 150000,
    employmentStatus: currentUser?.employmentStatus || 'Student',
    isFarmer: currentUser?.isFarmer || false,
    isBusinessOwner: currentUser?.isBusinessOwner || false,
    isWomanEntrepreneur: currentUser?.isWomanEntrepreneur || false,
    isSeniorCitizen: currentUser?.isSeniorCitizen || false,
    isStudent: currentUser?.isStudent !== undefined ? currentUser.isStudent : true
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete
      completeOnboarding({
        ...formData,
        isSeniorCitizen: (formData.age || 0) >= 60,
        isStudent: formData.currentEducationStatus === 'Pursuing'
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <span>Citizen Profile Setup</span>
            </div>
            <button
              type="button"
              id="onboarding-skip-home-btn"
              onClick={handleSkipToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-emerald-700" />
              <span>Go to Home Page</span>
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
              Welcome to Yojana Mitra
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mt-1">
              Provide accurate details to match with tailored State government welfare schemes, subsidies, and scholarships.
            </p>
          </div>
        </div>

        {/* Notice for new accounts routed to registration */}
        {registrationNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">New Citizen Account Setup</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-medium">
                {registrationNotice}
              </p>
            </div>
            <button
              onClick={clearRegistrationNotice}
              className="text-amber-500 hover:text-amber-800 p-1 rounded-md transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-2">
            <span>Step {step} of {totalSteps}: {
              step === 1 ? 'Personal Information' :
              step === 2 ? 'Education & Academics' :
              step === 3 ? 'Social & Eligibility' :
              step === 4 ? 'Income & Livelihood' :
              'Special Entitlement Indicators'
            }</span>
            <span className="text-emerald-800 font-bold">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-800 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Box */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-sm space-y-6">
          
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                <User className="w-5 h-5 text-emerald-800" />
                <span>1. Personal & Geographic Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender || 'male'}
                    onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">State / UT of Residence</label>
                  <select
                    value={formData.state || 'Andhra Pradesh'}
                    onChange={(e) => {
                      const newState = e.target.value;
                      const districts = getDistrictsForState(newState);
                      setFormData(prev => ({
                        ...prev,
                        state: newState,
                        district: districts.length > 0 ? districts[0] : ''
                      }));
                    }}
                    className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white text-stone-800"
                  >
                    {ALL_INDIAN_STATES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-bold">District</label>
                    <span className="text-[10px] text-stone-500 font-medium">
                      ({getDistrictsForState(formData.state || 'Andhra Pradesh').length} districts)
                    </span>
                  </div>
                  {getDistrictsForState(formData.state || 'Andhra Pradesh').length > 0 ? (
                    <select
                      value={formData.district || getDistrictsForState(formData.state || 'Andhra Pradesh')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white text-stone-800"
                    >
                      {getDistrictsForState(formData.state || 'Andhra Pradesh').map(dst => (
                        <option key={dst} value={dst}>{dst}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.district || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="Enter your district"
                      className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Area Type</label>
                  <select
                    value={formData.areaType || 'Urban'}
                    onChange={(e: any) => setFormData({ ...formData, areaType: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Marital Status</label>
                  <select
                    value={formData.maritalStatus || 'Single'}
                    onChange={(e: any) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Single">Single / Unmarried</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced / Separated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Education Details */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                <GraduationCap className="w-5 h-5 text-emerald-800" />
                <span>2. Education & Academic Background</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Highest Qualification</label>
                  <select
                    value={formData.highestEducation || 'Undergraduate (UG)'}
                    onChange={(e: any) => setFormData({ ...formData, highestEducation: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Below 10th">Below 10th</option>
                    <option value="10th Pass (Matric)">10th Pass (Matric)</option>
                    <option value="12th Pass (Intermediate)">12th Pass (Intermediate)</option>
                    <option value="Diploma/ITI">Diploma/ITI</option>
                    <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                    <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                    <option value="Doctorate/PhD">Doctorate/PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Current Academic Status</label>
                  <select
                    value={formData.currentEducationStatus || 'Pursuing'}
                    onChange={(e: any) => setFormData({ 
                      ...formData, 
                      currentEducationStatus: e.target.value,
                      isStudent: e.target.value === 'Pursuing' 
                    })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="Pursuing">Pursuing / Active Student</option>
                    <option value="Completed">Completed Education</option>
                    <option value="Dropped Out">Dropped Out</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Course / Stream / Discipline</label>
                  <input
                    type="text"
                    value={formData.courseStream || ''}
                    onChange={(e) => setFormData({ ...formData, courseStream: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science, B.Sc Agriculture, B.Com, Class 12 Science"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">College / School / University</label>
                  <input
                    type="text"
                    value={formData.institutionName || ''}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    placeholder="e.g. Osmania University, Hyderabad"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Social & Eligibility */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                <HeartHandshake className="w-5 h-5 text-emerald-800" />
                <span>3. Social & Welfare Category</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Social Category</label>
                  <select
                    value={formData.category || 'General'}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="General">General (Unreserved)</option>
                    <option value="OBC">OBC (Other Backward Class)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-stone-800">Person with Benchmark Disability (PwD)?</span>
                    <input
                      type="checkbox"
                      checked={!!formData.isDisability}
                      onChange={(e) => setFormData({ ...formData, isDisability: e.target.checked })}
                      className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                    />
                  </label>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-stone-800">Belong to a Notified Minority Community?</span>
                    <input
                      type="checkbox"
                      checked={!!formData.isMinority}
                      onChange={(e) => setFormData({ ...formData, isMinority: e.target.checked })}
                      className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                    />
                  </label>
                  {formData.isMinority && (
                    <input
                      type="text"
                      value={formData.minorityCommunity || ''}
                      onChange={(e) => setFormData({ ...formData, minorityCommunity: e.target.value })}
                      placeholder="Specify community: Muslim, Christian, Sikh, Buddhist, Jain, Parsi"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs focus:outline-hidden focus:border-emerald-600"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Financial & Occupation */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                <IndianRupee className="w-5 h-5 text-emerald-800" />
                <span>4. Financial & Livelihood Details</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Annual Total Family Income (in ₹ INR)
                  </label>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    Crucial for calculating income-restricted scholarships and welfare subsidies.
                  </p>
                  <input
                    type="number"
                    value={formData.annualFamilyIncome || ''}
                    onChange={(e) => setFormData({ ...formData, annualFamilyIncome: Number(e.target.value) })}
                    placeholder="e.g. 180000"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-sm font-semibold focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                    required
                  />
                  <div className="mt-1 text-[11px] text-stone-500">
                    ≈ ₹{((formData.annualFamilyIncome || 0) / 100000).toFixed(2)} Lakhs per annum
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Employment Status (Basis for Scheme Recommendations)</label>
                  <select
                    value={formData.employmentStatus || 'Student'}
                    onChange={(e: any) => {
                      const status = e.target.value as EmploymentStatus;
                      setFormData({
                        ...formData,
                        employmentStatus: status,
                        isStudent: status === 'Student',
                        isFarmer: status === 'Farmer',
                        isBusinessOwner: status === 'Business Holder',
                        isSeniorCitizen: status === 'Senior Citizen',
                        isWomanEntrepreneur: status === 'Women',
                        gender: status === 'Women' ? 'female' : formData.gender
                      });
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white font-medium"
                  >
                    <option value="Business Holder">1. Business Holder</option>
                    <option value="Farmer">2. Farmer</option>
                    <option value="Student">3. Student</option>
                    <option value="Senior Citizen">4. Senior Citizen</option>
                    <option value="Women">5. Women</option>
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Your scheme recommendations will be tailored strictly according to this employment status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Specific Profile Details */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-base border-b border-stone-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
                <span>5. Specific Entitlement Indicators</span>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-stone-900">Farmer / Agricultural Landholder</span>
                    <p className="text-[11px] text-stone-500">Qualifies for PM-KISAN, crop insurance, and Kisan credit schemes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.isFarmer}
                    onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-stone-900">Micro-Business Owner / Artisan</span>
                    <p className="text-[11px] text-stone-500">Qualifies for PMEGP, PM SVANidhi, and Mudra loan schemes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.isBusinessOwner}
                    onChange={(e) => setFormData({ ...formData, isBusinessOwner: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-stone-900">Woman Entrepreneur / Self-Help Group (SHG) Member</span>
                    <p className="text-[11px] text-stone-500">Qualifies for Stand-Up India and women-centric empowerment grants</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.isWomanEntrepreneur}
                    onChange={(e) => setFormData({ ...formData, isWomanEntrepreneur: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-stone-900">Senior Citizen (60+ Years)</span>
                    <p className="text-[11px] text-stone-500">Qualifies for National Old Age Pensions and healthcare exemptions</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.isSeniorCitizen || (formData.age || 0) >= 60}
                    onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded-sm focus:ring-emerald-600"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipToHome}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-stone-400" />
                <span>Skip to Home Page</span>
              </button>
            )}

            <button
              id="onboarding-next-btn"
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{step === totalSteps ? 'Finish & Generate Recommendations' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
