import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  GraduationCap, 
  IndianRupee, 
  ShieldCheck, 
  Edit3, 
  Save, 
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, EmploymentStatus } from '../types';
import { ALL_INDIAN_STATES, getDistrictsForState } from '../data/statesAndDistricts';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateProfile 
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
      isBusinessOwner: formData.isBusinessOwner || false,
      isSeniorCitizen: isSenior ? true : (formData.isSeniorCitizen || adjustedAge >= 60),
      isWomanEntrepreneur: isWomen ? true : (formData.isWomanEntrepreneur || false)
    };
    updateProfile(cleanData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Top Profile Summary Card - Strict White & Green Theme */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-2xl shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-emerald-950">
                  {currentUser.name}
                </h1>
                <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                  Verified Citizen
                </span>
              </div>
              <p className="text-xs text-emerald-700 flex items-center gap-2 mt-1">
                <span>{currentUser.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {currentUser.district ? `${currentUser.district}, ` : ''}{currentUser.state} ({currentUser.areaType})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              id="edit-profile-btn"
              onClick={() => { setFormData(currentUser); setIsEditing(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Schemes count details stats strip has been completely removed as requested */}
      </div>

      {/* Profile Detail Cards Grid - Strict White & Green Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal & Demographics */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <User className="w-4 h-4 text-emerald-800" />
            <span>Personal & Demographics</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-emerald-700/80 font-medium">Age:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.age} years ({currentUser.gender})</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Social Category:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.category}</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Marital Status:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.maritalStatus}</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Location Area:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.areaType} Sector</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Disability Status:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.isDisability ? 'Person with Benchmark Disability (PwD)' : 'None'}</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Minority Community:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.isMinority ? (currentUser.minorityCommunity || 'Yes') : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Education & Academic Profile */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <GraduationCap className="w-4 h-4 text-emerald-800" />
            <span>Education & Academic Status</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-emerald-700/80 font-medium">Highest Qualification:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.highestEducation}</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Current Status:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.currentEducationStatus}</p>
            </div>
            <div className="col-span-2">
              <span className="text-emerald-700/80 font-medium">Course / Stream:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.courseStream || 'General'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-emerald-700/80 font-medium">College / Institution:</span>
              <p className="font-bold text-emerald-950 mt-0.5">{currentUser.institutionName || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Financial & Livelihood */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <IndianRupee className="w-4 h-4 text-emerald-800" />
            <span>Financial & Livelihood Information</span>
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-emerald-700/80 font-medium">Annual Family Income:</span>
              <p className="font-bold text-emerald-950 mt-0.5">₹{currentUser.annualFamilyIncome.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-emerald-700/80 font-medium">Employment Status:</span>
              <p className="font-bold text-emerald-900 mt-0.5">{currentUser.employmentStatus}</p>
            </div>
          </div>
        </div>

        {/* Specific Entitlement Indicators */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Special Entitlement Indicators</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-900 font-medium">Active Student:</span>
              <span className={`font-bold ${currentUser.isStudent ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                {currentUser.isStudent ? 'Yes (Enrolled Student)' : 'No (Non-Student / Working)'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-900 font-medium">Farmer / Agricultural Landholder:</span>
              <span className={`font-bold ${currentUser.isFarmer ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                {currentUser.isFarmer ? 'Yes (Cultivator)' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-900 font-medium">Business Owner / Micro-Enterprise:</span>
              <span className={`font-bold ${currentUser.isBusinessOwner ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                {currentUser.isBusinessOwner ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-900 font-medium">Woman Entrepreneur:</span>
              <span className={`font-bold ${currentUser.isWomanEntrepreneur ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                {currentUser.isWomanEntrepreneur ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-emerald-900 font-medium">Senior Citizen (60+ yrs):</span>
              <span className={`font-bold ${currentUser.isSeniorCitizen ? 'text-emerald-800' : 'text-emerald-600/70'}`}>
                {currentUser.isSeniorCitizen ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal - Strict White & Green Theme */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-emerald-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-bold text-emerald-950">Edit Citizen Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              
              {/* Personal Section */}
              <div className="space-y-3">
                <div className="font-bold text-emerald-900 text-sm">1. Personal & Location</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Gender</label>
                    <select
                      value={formData.gender || 'male'}
                      onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">State / UT</label>
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
                      className="w-full min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    >
                      {ALL_INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-emerald-800 font-semibold">District</label>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ({getDistrictsForState(formData.state || 'Andhra Pradesh').length} available)
                      </span>
                    </div>
                    {getDistrictsForState(formData.state || 'Andhra Pradesh').length > 0 ? (
                      <select
                        value={formData.district || getDistrictsForState(formData.state || 'Andhra Pradesh')[0]}
                        onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
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
                        className="w-full min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Area Sector</label>
                    <select
                      value={formData.areaType || 'Urban'}
                      onChange={(e: any) => setFormData({ ...formData, areaType: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    >
                      <option value="Rural">Rural</option>
                      <option value="Urban">Urban</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Marital Status</label>
                    <select
                      value={formData.maritalStatus || 'Single'}
                      onChange={(e: any) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
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
              <div className="space-y-3 pt-3 border-t border-emerald-100">
                <div className="font-bold text-emerald-900 text-sm">2. Education & Social Category</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Highest Qualification</label>
                    <select
                      value={formData.highestEducation || 'Undergraduate (UG)'}
                      onChange={(e: any) => setFormData({ ...formData, highestEducation: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
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
                    <label className="block text-emerald-800 font-semibold mb-1">Social Category</label>
                    <select
                      value={formData.category || 'General'}
                      onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Current Education Status</label>
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
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                    >
                      <option value="Pursuing">Pursuing / Active Student</option>
                      <option value="Completed">Completed</option>
                      <option value="Dropped Out">Dropped Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Annual Family Income (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.annualFamilyIncome || ''}
                      onChange={(e) => setFormData({ ...formData, annualFamilyIncome: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Livelihood and Specific Statuses */}
              <div className="space-y-3 pt-3 border-t border-emerald-100">
                <div className="font-bold text-emerald-900 text-sm">3. Employment Status & Entitlements</div>
                
                <div>
                  <label className="block text-emerald-800 font-semibold mb-1">Employment Status (Sole Basis for Scheme Recommendations)</label>
                  <select
                    id="edit-profile-employment-status"
                    value={formData.employmentStatus === 'Business Holder' ? 'Student' : (formData.employmentStatus || 'Student')}
                    onChange={(e: any) => {
                      const status = e.target.value as EmploymentStatus;
                      const isStud = status === 'Student';
                      const isFarm = status === 'Farmer';
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
                          isBusinessOwner: false,
                          isSeniorCitizen: isSenior,
                          isWomanEntrepreneur: isWomen,
                          gender: isWomen ? 'female' : prev.gender
                        };
                      });
                    }}
                    className="w-full min-h-[44px] p-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-950 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    <option value="Farmer">1. Farmer</option>
                    <option value="Student">2. Student</option>
                    <option value="Senior Citizen">3. Senior Citizen</option>
                    <option value="Women">4. Women</option>
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Schemes and scholarships will be recommended exclusively based on your selected Employment Status.
                  </p>
                </div>

                <div className="pt-2">
                  <div className="text-emerald-800 text-[11px] font-semibold mb-1.5 uppercase tracking-wider">
                    Entitlement Indicators (Check all that apply)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isFarmer}
                        onChange={(e) => setFormData({ ...formData, isFarmer: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">Farmer / Agri</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isBusinessOwner}
                        onChange={(e) => setFormData({ ...formData, isBusinessOwner: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">Business / MSME</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isWomanEntrepreneur}
                        onChange={(e) => setFormData({ ...formData, isWomanEntrepreneur: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">Woman Entrepreneur</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isSeniorCitizen}
                        onChange={(e) => setFormData({ ...formData, isSeniorCitizen: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">Senior Citizen</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isDisability}
                        onChange={(e) => setFormData({ ...formData, isDisability: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">PwD (Disability)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:bg-emerald-100/60">
                      <input
                        type="checkbox"
                        checked={!!formData.isMinority}
                        onChange={(e) => setFormData({ ...formData, isMinority: e.target.checked })}
                        className="rounded text-emerald-800 accent-emerald-700"
                      />
                      <span className="font-semibold text-emerald-900">Minority</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
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
