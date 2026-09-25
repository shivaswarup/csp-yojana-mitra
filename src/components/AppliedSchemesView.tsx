import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Plus,
  Building2,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApplicationStatus, Scheme } from '../types';
import { SCHEMES_DATABASE } from '../data/schemes';

interface AppliedSchemesViewProps {
  onSelectScheme: (scheme: Scheme) => void;
}

export const AppliedSchemesView: React.FC<AppliedSchemesViewProps> = ({ onSelectScheme }) => {
  const { appliedSchemes, updateApplicationStatus, removeApplication, setActiveTab } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('Applied');
  const [editNotes, setEditNotes] = useState('');

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Under Review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Applied':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  const handleStartEdit = (app: typeof appliedSchemes[0]) => {
    setEditingId(app.id);
    setEditStatus(app.status);
    setEditNotes(app.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    updateApplicationStatus(id, editStatus, editNotes);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-800" />
            <span>My Applied Schemes & Applications Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Monitor the status, verification progress, and acknowledgment records for all your submitted government schemes.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('schemes')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Browse More Schemes</span>
        </button>
      </div>

      {/* Applied List */}
      {appliedSchemes.length > 0 ? (
        <div className="space-y-4">
          {appliedSchemes.map((app) => {
            const isEditing = editingId === app.id;
            const fullScheme = SCHEMES_DATABASE.find(s => s.id === app.schemeId);

            return (
              <div 
                key={app.id} 
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded">
                        {app.schemeCategory}
                      </span>
                      {app.applicationReferenceNumber && (
                        <span className="text-xs font-mono font-medium text-stone-600 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
                          Ref: {app.applicationReferenceNumber}
                        </span>
                      )}
                    </div>
                    <h3 
                      onClick={() => fullScheme && onSelectScheme(fullScheme)}
                      className="text-base sm:text-lg font-bold text-stone-900 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      {app.schemeName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                    <button
                      onClick={() => handleStartEdit(app)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                      title="Update status or notes"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeApplication(app.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove from tracking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Date and Notes details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-stone-100">
                  <div>
                    <span className="text-stone-400">Date Applied:</span>
                    <div className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>{app.appliedDate}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400">Application Deadline:</span>
                    <div className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>{app.deadline}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400">Official Portal:</span>
                    <div>
                      <a
                        href={app.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>Check Status on Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Notes Block */}
                {app.notes && !isEditing && (
                  <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-700 border border-stone-200">
                    <strong className="text-stone-900">Application Notes: </strong>
                    {app.notes}
                  </div>
                )}

                {/* In-place Editing Form */}
                {isEditing && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-300 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-stone-900">Update Application Status & Notes</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e: any) => setEditStatus(e.target.value)}
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Not Applied">Not Applied</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Progress Notes</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="e.g. Bio-metric verification done at MeeSeva / CSC."
                          className="w-full p-2 bg-white border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(app.id)}
                        className="px-3 py-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 mx-auto flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">You haven't added any applications yet</h3>
            <p className="text-xs text-stone-500 mt-1">
              When you apply for a scheme or scholarship, click <strong>"Mark as Applied"</strong> on the scheme page to track submission details and status here.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('schemes')}
            className="px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
          >
            Explore All Schemes
          </button>
        </div>
      )}

    </div>
  );
};
