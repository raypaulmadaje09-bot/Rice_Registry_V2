import React, { useState } from 'react';
import { OfficialReportLetter } from '../data/reportLetters';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';

interface LetterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (letter: OfficialReportLetter) => void;
  initialLetter?: OfficialReportLetter | null;
  activeBarangay: string;
  activeSeason: string;
  farmerCount: number;
  totalAreaHa: number;
}

export const LetterEditorModal: React.FC<LetterEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLetter,
  activeBarangay,
  activeSeason,
  farmerCount,
  totalAreaHa
}) => {
  const [formData, setFormData] = useState<OfficialReportLetter>(() => {
    if (initialLetter) {
      return { ...initialLetter };
    }
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    return {
      id: `letter-${Date.now()}`,
      title: 'Custom Transmittal Memorandum',
      memoRef: `SLG-MAO-RICE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      date: todayStr,
      memorandumFor: 'HON. LEMUEL P. HONOR',
      memorandumForTitle: 'Municipal Mayor, Municipality of Silago',
      thru: 'THE SANGGUNIANG BAYAN / COMMITTEE ON AGRICULTURE',
      thruTitle: 'Municipality of Silago, Province of Southern Leyte',
      from: 'ENGR. ARNALDO M. VALDEZ',
      fromTitle: 'Municipal Agriculturist / Municipal LFT Coordinator',
      subject: `TRANSMITTAL OF OFFICIAL RICE FARMERS MASTERLIST FOR BARANGAY ${activeBarangay.toUpperCase()}`,
      openingGreeting: 'Greetings of peace and progress in agriculture!',
      bodyParagraph1: `Respectfully submitting herewith the official, field-validated Masterlist and GIS Land Registry of registered rice farmers and agricultural parcels within the jurisdiction of Barangay {BARANGAY}, Municipality of Silago, Southern Leyte for the {SEASON} cropping period.`,
      includeStatsSummaryTable: true,
      bodyParagraph2: `This masterlist was comprehensively surveyed, geo-referenced, and cross-referenced with the RSBSA database by our designated Local Farmer Technicians (LFTs). All listed landholdings have been verified on-ground to ensure accuracy in boundary mapping and actual standing crop condition.`,
      closingStatement: `This submission is formally tendered for legislative noting, program validation, and inclusion in the municipal agricultural registry of Silago.`,
      preparedBy: 'Wella S. Bongons',
      preparedTitle: 'Local Farmer Technician (LFT)',
      reviewedBy: 'Engr. Arnaldo M. Valdez',
      reviewedTitle: 'Municipal Agriculturist',
      approvedBy: 'Hon. Lemuel P. Honor',
      approvedTitle: 'Municipal Mayor - Silago, Southern Leyte'
    };
  });

  // Re-sync when modal opens with a different letter
  React.useEffect(() => {
    if (initialLetter) {
      setFormData({ ...initialLetter });
    }
  }, [initialLetter, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a Letter Title.');
      return;
    }
    if (!formData.subject.trim()) {
      alert('Please enter a Subject.');
      return;
    }
    onSave(formData);
    onClose();
  };

  const insertVariable = (field: 'bodyParagraph1' | 'bodyParagraph2' | 'subject', variable: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] + ` ${variable} `
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              OFFICIAL GOVERNMENT TRANSMITTAL LETTER EDITOR
            </span>
            <h3 className="text-lg font-serif font-black text-slate-900 mt-1">
              {initialLetter ? `Edit: ${initialLetter.title}` : 'Create New Official Letter / Memorandum'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Top Row: Title, Memo Ref, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">LETTER TEMPLATE TITLE *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="e.g. Transmittal to Mayor & SB"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">MEMO / REFERENCE NO. *</label>
              <input
                type="text"
                required
                value={formData.memoRef}
                onChange={(e) => setFormData({ ...formData, memoRef: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                placeholder="e.g. SLG-MAO-RICE-2024-02B"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">OFFICIAL DATE *</label>
              <input
                type="text"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                placeholder="e.g. February 21, 2024"
              />
            </div>
          </div>

          {/* Addressee & Sender Information */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>MEMORANDUM RECIPIENTS &amp; SENDER</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">MEMORANDUM FOR (TO) *</label>
                <input
                  type="text"
                  required
                  value={formData.memorandumFor}
                  onChange={(e) => setFormData({ ...formData, memorandumFor: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  placeholder="e.g. HON. LEMUEL P. HONOR"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">RECIPIENT TITLE / DESIGNATION *</label>
                <input
                  type="text"
                  required
                  value={formData.memorandumForTitle}
                  onChange={(e) => setFormData({ ...formData, memorandumForTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  placeholder="e.g. Municipal Mayor, Municipality of Silago"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">THRU (OPTIONAL)</label>
                <input
                  type="text"
                  value={formData.thru || ''}
                  onChange={(e) => setFormData({ ...formData, thru: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  placeholder="e.g. THE SANGGUNIANG BAYAN"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">THRU TITLE / COMMITTEE (OPTIONAL)</label>
                <input
                  type="text"
                  value={formData.thruTitle || ''}
                  onChange={(e) => setFormData({ ...formData, thruTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  placeholder="e.g. Committee on Agriculture"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">FROM (SENDER) *</label>
                <input
                  type="text"
                  required
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  placeholder="e.g. ENGR. ARNALDO M. VALDEZ"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">SENDER TITLE / OFFICE *</label>
                <input
                  type="text"
                  required
                  value={formData.fromTitle}
                  onChange={(e) => setFormData({ ...formData, fromTitle: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  placeholder="e.g. Municipal Agriculturist"
                />
              </div>
            </div>
          </div>

          {/* Subject Line & Dynamic Placeholders */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700">MEMORANDUM SUBJECT *</label>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Available dynamic variables:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('subject', '{BARANGAY}')}
                  className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded text-[9px] font-mono cursor-pointer"
                >
                  {'{BARANGAY}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('subject', '{SEASON}')}
                  className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded text-[9px] font-mono cursor-pointer"
                >
                  {'{SEASON}'}
                </button>
              </div>
            </div>
            <textarea
              required
              rows={2}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold uppercase"
              placeholder="e.g. TRANSMITTAL AND ENDORSEMENT OF OFFICIAL MASTERLIST..."
            />
          </div>

          {/* Salutation / Opening Greeting */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">OPENING SALUTATION / GREETING</label>
            <input
              type="text"
              value={formData.openingGreeting}
              onChange={(e) => setFormData({ ...formData, openingGreeting: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              placeholder="e.g. Greetings of peace and progress in agriculture!"
            />
          </div>

          {/* Body Paragraph 1 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700">BODY PARAGRAPH 1 (TRANSMITTAL / PURPOSE)</label>
              <div className="flex items-center gap-1 text-[9.5px] text-slate-500">
                <span>Insert:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('bodyParagraph1', '{BARANGAY}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[9px]"
                >
                  {'{BARANGAY}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('bodyParagraph1', '{FARMER_COUNT}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[9px]"
                >
                  {'{FARMER_COUNT}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('bodyParagraph1', '{TOTAL_AREA}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[9px]"
                >
                  {'{TOTAL_AREA}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('bodyParagraph1', '{SEASON}')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[9px]"
                >
                  {'{SEASON}'}
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={formData.bodyParagraph1}
              onChange={(e) => setFormData({ ...formData, bodyParagraph1: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Checkbox: Include Stats Summary Table */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-950 text-xs block">
                Include Executive Database Summary Table in Letter
              </span>
              <p className="text-[10px] text-emerald-800">
                Displays live computed statistics: Barangay ({activeBarangay}), Total Farmers ({farmerCount}), Total Area ({totalAreaHa.toFixed(2)} ha), and Cropping Season ({activeSeason}).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeStatsSummaryTable}
                onChange={(e) => setFormData({ ...formData, includeStatsSummaryTable: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Body Paragraph 2 */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">BODY PARAGRAPH 2 (VALIDATION &amp; FIELD INSPECTION)</label>
            <textarea
              rows={3}
              value={formData.bodyParagraph2}
              onChange={(e) => setFormData({ ...formData, bodyParagraph2: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Closing Statement */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">FORMAL CLOSING STATEMENT / RECOMMENDATION</label>
            <input
              type="text"
              value={formData.closingStatement}
              onChange={(e) => setFormData({ ...formData, closingStatement: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          {/* Signatories Block */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
              OFFICIAL 3-COLUMN SIGNATORY BLOCKS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">1. PREPARED BY (LFT)</span>
                <input
                  type="text"
                  value={formData.preparedBy}
                  onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  placeholder="Officer Name"
                />
                <input
                  type="text"
                  value={formData.preparedTitle}
                  onChange={(e) => setFormData({ ...formData, preparedTitle: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[10.5px]"
                  placeholder="Officer Title"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">2. REVIEWED BY (AGRICULTURIST)</span>
                <input
                  type="text"
                  value={formData.reviewedBy}
                  onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  placeholder="Agriculturist Name"
                />
                <input
                  type="text"
                  value={formData.reviewedTitle}
                  onChange={(e) => setFormData({ ...formData, reviewedTitle: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[10.5px]"
                  placeholder="Agriculturist Title"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">3. APPROVED BY (MAYOR)</span>
                <input
                  type="text"
                  value={formData.approvedBy}
                  onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  placeholder="Mayor Name"
                />
                <input
                  type="text"
                  value={formData.approvedTitle}
                  onChange={(e) => setFormData({ ...formData, approvedTitle: e.target.value })}
                  className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[10.5px]"
                  placeholder="Mayor Title"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-300" />
              <span>Save Official Letter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
