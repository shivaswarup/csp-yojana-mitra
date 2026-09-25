import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  IndianRupee, 
  ShieldCheck, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  CalendarClock, 
  Save, 
  X,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, Category, EducationLevel, EmploymentStatus, Gender } from '../types';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/statesAndDistricts';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateProfile, 
    recommendedSchemes, 
    appliedSchemes, 
    setActiveTab 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(currentUser || {});

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const status = formData.employmentStatus;
    const isStud = status === 'Student';
    const isSenior = status === 'Senior Citizen';
    const isWomen = status === 'Women';

    let adjustedAge = formData.age || 28;
    if (isSenior && adjustedAge < 60) {
      adjustedAge = 62;
    }

    const cleanData: Partial<UserProfile> = {
      ...formData,
      age: adjustedAge,
      gender: isWomen ? 'female' : (formData.gender || 'male'),
      isStudent: isStud,
      currentEducationStatus: isStud ? (formData.currentEducationStatus || 'Pursuing') : (formData.currentEducationStatus === 'Pursuing' ? 'Completed' : (formData.currentEducationStatus || 'Completed')),
      isFarmer: status === 'Farmer' ? true : (formData.isFarmer || false),
      isBusinessOwner: status === 'Business Holder' ? true : (formData.isBusinessOwner || false),
      isSeniorCitizen: isSenior ? true : (formData.isSeniorCitizen || adjustedAge >= 60),
      isWomanEntrepreneur: isWomen ? true : (formData.isWomanEntrepreneur || false)
    };
    updateProfile(cleanData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-2xl">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {currentUser.name}
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Citizen
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2 mt-1">
                <span>{currentUser.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  {currentUser.district ? `${currentUser.district}, ` : ''}{currentUser.state} ({currentUser.areaType})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              id="edit-profile-btn"
              onClick={() => { setFormData(currentUser); setIsEditing(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-stone-100 text-center">
          <div 
            onClick={() => setActiveTab('schemes')}
            className="p-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-800">
              {recommendedSchemes.length}
            </div>
            <div className="text-[11px] font-semibold text-stone-600 mt-0.5">Eligible Schemes</div>
          </div>

          <div 
            onClick={() => setActiveTab('applied')}
            className="p-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-800">
              {appliedSchemes.length}
            </div>
            <div className="text-[11px] font-semibold text-stone-600 mt-0.5">Applied & Tracked</div>
          </div>

          <div 
            onClick={() => setActiveTab('deadlines')}
            className="p-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-lg sm:text-2xl font-extrabold text-stone-800">
              3
            </div>
            <div className="text-[11px] font-semibold text-stone-600 mt-0.5">Upcoming Deadlines</div>
          </div>
        </div>
      </div>

      {/* Profile Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal & Social Details */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <User className="w-4 h-4 text-emerald-800" />
            <span>Personal & Demographics</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400">Age:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.age} years ({currentUser.gender})</p>
            </div>
            <div>
              <span className="text-stone-400">Social Category:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.category}</p>
            </div>
            <div>
              <span className="text-stone-400">Marital Status:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.maritalStatus}</p>
            </div>
            <div>
              <span className="text-stone-400">Location Area:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.areaType} Sector</p>
            </div>
            <div>
              <span className="text-stone-400">Disability Status:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.isDisability ? 'Person with Benchmark Disability (PwD)' : 'None'}</p>
            </div>
            <div>
              <span className="text-stone-400">Minority Community:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.isMinority ? (currentUser.minorityCommunity || 'Yes') : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Education & Academic Profile */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <GraduationCap className="w-4 h-4 text-emerald-800" />
            <span>Education & Academic Status</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400">Highest Qualification:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.highestEducation}</p>
            </div>
            <div>
              <span className="text-stone-400">Current Status:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.currentEducationStatus}</p>
            </div>
            <div className="col-span-2">
              <span className="text-stone-400">Course / Stream:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.courseStream || 'General'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-stone-400">College / Institution:</span>
              <p className="font-bold text-stone-900 mt-0.5">{currentUser.institutionName || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Financial & Livelihood */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <IndianRupee className="w-4 h-4 text-emerald-800" />
            <span>Financial & Livelihood Information</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400">Annual Family Income:</span>
              <p className="font-bold text-stone-900 mt-0.5">₹{currentUser.annualFamilyIncome.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-stone-400">Employment Status:</span>
              <p className="font-bold text-emerald-800 mt-0.5">{currentUser.employmentStatus}</p>
            </div>
          </div>
        </div>

        {/* Specific Profile Flags */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Special Entitlement Indicators</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
              <span className="text-stone-700 font-medium">Active Student:</span>
              <span className={`font-bold ${currentUser.isStudent ? 'text-emerald-700' : 'text-stone-500'}`}>
                {currentUser.isStudent ? 'Yes (Enrolled Student)' : 'No (Non-Student / Working)'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
              <span className="text-stone-700 font-medium">Farmer / Agricultural Landholder:</span>
              <span className={`font-bold ${currentUser.isFarmer ? 'text-emerald-700' : 'text-stone-500'}`}>
                {currentUser.isFarmer ? 'Yes (Cultivator)' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
              <span className="text-stone-700 font-medium">Business Owner / Micro-Enterprise:</span>
              <span className={`font-bold ${currentUser.isBusinessOwner ? 'text-emerald-700' : 'text-stone-500'}`}>
                {currentUser.isBusinessOwner ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
              <span className="text-stone-700 font-medium">Woman Entrepreneur:</span>
              <span className={`font-bold ${currentUser.isWomanEntrepreneur ? 'text-emerald-700' : 'text-stone-500'}`}>
                {currentUser.isWomanEntrepreneur ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50">
              <span className="text-stone-700 font-medium">Senior Citizen (60+ yrs):</span>
              <span className={`font-bold ${currentUser.isSeniorCitizen ? 'text-emerald-700' : 'text-stone-500'}`}>
                {currentUser.isSeniorCitizen ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-bold text-stone-900">Edit Citizen Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              
              {/* Personal Section */}
              <div className="space-y-3">
                <div className="font-bold text-stone-800 text-sm">1. Personal & Location</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Gender</label>
                    <select
                      value={formData.gender || 'male'}
                      onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">State / UT</label>
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
                      className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 text-stone-800"
                    >
                      {ALL_INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-stone-600 font-semibold">District</label>
                      <span className="text-[10px] text-stone-400 font-medium">
                        ({getDistrictsForState(formData.state || 'Andhra Pradesh').length} available)
                      </span>
                    </div>
                    {getDistrictsForState(formData.state || 'Andhra Pradesh').length > 0 ? (
                      <select
                        value={formData.district || getDistrictsForState(formData.state || 'Andhra Pradesh')[0]}
                        onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 text-stone-800"
                      >
                        {getDistrictsForState(formData.state || 'Andhra Pradesh').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.district || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                        placeholder="Enter district"
                        className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Area Sector</label>
                    <select
                      value={formData.areaType || 'Urban'}
                      onChange={(e: any) => setFormData({ ...formData, areaType: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="Rural">Rural</option>
                      <option value="Urban">Urban</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Marital Status</label>
                    <select
                      value={formData.maritalStatus || 'Single'}
                      onChange={(e: any) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 text-stone-800"
                    >
                      <option value="Single">Single / Unmarried</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced / Separated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="font-bold text-stone-800 text-sm">2. Education & Social Category</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Highest Qualification</label>
                    <select
                      value={formData.highestEducation || 'Undergraduate (UG)'}
                      onChange={(e: any) => setFormData({ ...formData, highestEducation: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
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
                    <label className="block text-stone-600 font-semibold mb-1">Social Category</label>
                    <select
                      value={formData.category || 'General'}
                      onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Current Education Status</label>
                    <select
                      value={formData.currentEducationStatus || 'Pursuing'}
                      onChange={(e: any) => {
                        const val = e.target.value as 'Pursuing' | 'Completed' | 'Dropped Out';
                        const isStudentNow = val === 'Pursuing' && formData.employmentStatus === 'Student';
                        setFormData(prev => ({
                          ...prev,
                          currentEducationStatus: val,
                          isStudent: val === 'Pursuing' ? (prev.employmentStatus === 'Student' || prev.isStudent) : false
                        }));
                      }}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                    >
                      <option value="Pursuing">Pursuing / Active Student</option>
                      <option value="Completed">Completed</option>
                      <option value="Dropped Out">Dropped Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Annual Family Income (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.annualFamilyIncome || ''}
                      onChange={(e) => setFormData({ ...formData, annualFamilyIncome: Number(e.target.value) })}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Livelihood and Specific Statuses */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="font-bold text-stone-800 text-sm">3. Employment Status & Entitlements</div>
                
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Employment Status (Sole Basis for Scheme Recommendations)</label>
                  <select
                    id="edit-profile-employment-status"
                    value={formData.employmentStatus || 'Student'}
                    onChange={(e: any) => {
                      const status = e.target.value as EmploymentStatus;
                      const isStud = status === 'Student';
                      const isFarm = status === 'Farmer';
                      const isBiz = status === 'Business Holder';
                      const isSenior = status === 'Senior Citizen';
                      const isWomen = status === 'Women';

                      setFormData(prev => {
                        let newAge = prev.age || 28;
                        if (isSenior && newAge < 60) {
                          newAge = 62;
                        }

                        return {
                          ...prev,
                          employmentStatus: status,
                          age: newAge,
                          isStudent: isStud,
                          currentEducationStatus: isStud ? (prev.currentEducationStatus || 'Pursuing') : (prev.currentEducationStatus === 'Pursuing' ? 'Completed' : prev.currentEducationStatus),
                          isFarmer: isFarm,
                          isBusinessOwner: isBiz,
                          isSeniorCitizen: isSenior,
                          isWomanEntrepreneur: isWomen,
                          gender: isWomen ? 'female' : prev.gender
                        };
                      });
                    }}
                    className="w-full min-h-[44px] p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-600 text-stone-800 font-medium"
                  >
                    <option value="Business Holder">1. Business Holder</option>
                    <option value="Farmer">2. Farmer</option>
                    <option value="Student">3. Student</option>
                    <option value="Senior Citizen">4. Senior Citizen</option>
                    <option value="Women">5. Women</option>
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Schemes and scholarships will be recommended exclusively based on your selected Employment Status.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-stone-500 text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
                    Entitlement Indicators (Check all that apply)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isFarmer}
                        onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">Farmer / Agri</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isBusinessOwner}
                        onChange={(e) => setFormData({ ...formData, isBusinessOwner: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">Business / MSME</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isWomanEntrepreneur}
                        onChange={(e) => setFormData({ ...formData, isWomanEntrepreneur: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">Woman Entrepreneur</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isSeniorCitizen}
                        onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">Senior Citizen</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isDisability}
                        onChange={(e) => setFormData({ ...formData, isDisability: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">PwD (Disability)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={!!formData.isMinority}
                        onChange={(e) => setFormData({ ...formData, isMinority: e.target.checked })}
                        className="rounded-sm text-emerald-800"
                      />
                      <span className="font-medium text-stone-700">Minority</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Recalculate Recommendations</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
