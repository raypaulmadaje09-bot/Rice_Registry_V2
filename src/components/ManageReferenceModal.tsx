import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiceVariety } from '../data/riceVarieties';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Wheat,
  Droplets,
  Shield,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';

export type ManageType = 'variety' | 'ecosystem' | 'tenure' | 'season' | 'irrigationAssociation';

interface ManageReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ManageType;
  onSelect?: (val: string) => void;
}

export const ManageReferenceModal: React.FC<ManageReferenceModalProps> = ({
  isOpen,
  onClose,
  type,
  onSelect
}) => {
  const {
    varieties,
    addVariety,
    updateVariety,
    deleteVariety,
    ecosystems,
    addEcosystem,
    updateEcosystem,
    deleteEcosystem,
    tenures,
    addTenure,
    updateTenure,
    deleteTenure,
    seasons,
    addSeason,
    updateSeason,
    deleteSeason,
    irrigationAssociations,
    addIrrigationAssociation,
    updateIrrigationAssociation,
    deleteIrrigationAssociation
  } = useApp();

  // Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Simple string input state for ecosystem, tenure, season, IA
  const [inputName, setInputName] = useState('');

  // Complex input state for Rice Variety
  const [varietyForm, setVarietyForm] = useState<Partial<RiceVariety>>({
    name: '',
    code: '',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 49,
    reproductiveMaturityDas: 84,
    maturityDays: 114,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 6.0,
    potentialYieldMt: 9.5
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const getTitleInfo = () => {
    switch (type) {
      case 'variety':
        return {
          title: 'Manage Rice Varieties',
          icon: <Wheat className="w-5 h-5 text-amber-600" />,
          desc: 'Add, edit, or remove certified inbred, hybrid, and traditional rice varieties.'
        };
      case 'ecosystem':
        return {
          title: 'Manage Water Sources & Ecosystems',
          icon: <Droplets className="w-5 h-5 text-blue-600" />,
          desc: 'Add, edit, or remove agro-ecosystems and irrigation water categories.'
        };
      case 'tenure':
        return {
          title: 'Manage Tenurial Statuses',
          icon: <Shield className="w-5 h-5 text-emerald-600" />,
          desc: 'Add, edit, or remove land tenure categories (e.g., Owner, Tenant, ARB).'
        };
      case 'season':
        return {
          title: 'Manage Cropping Seasons',
          icon: <Calendar className="w-5 h-5 text-purple-600" />,
          desc: 'Add, edit, or remove cropping seasons (e.g., Wet Season, Dry Season).'
        };
      case 'irrigationAssociation':
        return {
          title: 'Manage Irrigation Associations (IA)',
          icon: <Layers className="w-5 h-5 text-teal-600" />,
          desc: 'Add, edit, or remove accredited Irrigation Associations and water user groups.'
        };
    }
  };

  const info = getTitleInfo();

  // Reset form
  const resetForm = () => {
    setInputName('');
    setEditingItem(null);
    setMode('list');
    setConfirmDelete(null);
    setVarietyForm({
      name: '',
      code: '',
      seedType: 'INBRED',
      category: 'Certified_Seeds',
      newlyPlantedDays: 7,
      vegetativeMaturityNet: 49,
      reproductiveMaturityDas: 84,
      maturityDays: 114,
      ecosystem: 'Irrigated Lowland (NIA)',
      aveYieldMt: 6.0,
      potentialYieldMt: 9.5
    });
  };

  // Start Edit
  const handleStartEdit = (name: string) => {
    setEditingItem(name);
    setConfirmDelete(null);

    if (type === 'variety') {
      const v = varieties.find((item) => item.name === name);
      if (v) {
        setVarietyForm({ ...v });
      }
      setMode('edit');
    } else {
      setInputName(name);
      setMode('edit');
    }
  };

  // Save Add/Edit for simple string types
  const handleSaveSimple = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputName.trim();
    if (!val) return;

    if (mode === 'add') {
      if (type === 'ecosystem') addEcosystem(val);
      else if (type === 'tenure') addTenure(val);
      else if (type === 'season') addSeason(val);
      else if (type === 'irrigationAssociation') addIrrigationAssociation(val);

      if (onSelect) onSelect(val);
    } else if (mode === 'edit' && editingItem) {
      if (type === 'ecosystem') updateEcosystem(editingItem, val);
      else if (type === 'tenure') updateTenure(editingItem, val);
      else if (type === 'season') updateSeason(editingItem, val);
      else if (type === 'irrigationAssociation') updateIrrigationAssociation(editingItem, val);

      if (onSelect) onSelect(val);
    }

    resetForm();
  };

  // Save Add/Edit for Variety
  const handleSaveVariety = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (varietyForm.name || '').trim();
    if (!name) return;

    const fullVariety: RiceVariety = {
      name,
      code: (varietyForm.code || name.replace(/[^a-zA-Z0-9]/g, '')).substring(0, 10),
      seedType: varietyForm.seedType || 'INBRED',
      category: varietyForm.category || 'Certified_Seeds',
      newlyPlantedDays: 7,
      vegetativeMaturityNet: Number(varietyForm.vegetativeMaturityNet) || 49,
      reproductiveMaturityDas: Number(varietyForm.reproductiveMaturityDas) || 84,
      maturityDays: Number(varietyForm.maturityDays) || 114,
      ecosystem: varietyForm.ecosystem || 'Irrigated Lowland (NIA)',
      aveYieldMt: Number(varietyForm.aveYieldMt) || 6.0,
      potentialYieldMt: Number(varietyForm.potentialYieldMt) || 9.5
    };

    if (mode === 'add') {
      addVariety(fullVariety);
      if (onSelect) onSelect(fullVariety.name);
    } else if (mode === 'edit' && editingItem) {
      updateVariety(editingItem, fullVariety);
      if (onSelect) onSelect(fullVariety.name);
    }

    resetForm();
  };

  // Delete handler
  const handleDelete = (name: string) => {
    if (type === 'variety') deleteVariety(name);
    else if (type === 'ecosystem') deleteEcosystem(name);
    else if (type === 'tenure') deleteTenure(name);
    else if (type === 'season') deleteSeason(name);
    else if (type === 'irrigationAssociation') deleteIrrigationAssociation(name);
    setConfirmDelete(null);
  };

  // Simple string items list
  const getSimpleItems = (): string[] => {
    if (type === 'ecosystem') return ecosystems;
    if (type === 'tenure') return tenures;
    if (type === 'season') return seasons;
    if (type === 'irrigationAssociation') return irrigationAssociations;
    return [];
  };

  const simpleItems = getSimpleItems().filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVarieties = varieties.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.seedType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              {info.icon}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {info.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {info.desc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {mode === 'list' && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMode('add');
                    setInputName('');
                    setConfirmDelete(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {/* Items List */}
              {type === 'variety' ? (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredVarieties.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No varieties found. Click "+ Add New" to create one.
                    </div>
                  ) : (
                    filteredVarieties.map((v) => (
                      <div
                        key={v.name}
                        className="p-3 bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {v.name}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                v.seedType === 'HYBRID'
                                  ? 'bg-amber-100 text-amber-800'
                                  : v.seedType === 'INBRED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {v.seedType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Maturity: <span className="font-bold text-slate-700">{v.maturityDays} DAS</span> • Veg Net: <span className="font-bold text-slate-700">{v.vegetativeMaturityNet}d</span> • Rep: <span className="font-bold text-slate-700">{v.reproductiveMaturityDas}d</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onSelect && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelect(v.name);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 transition cursor-pointer"
                              title="Select this variety"
                            >
                              Select
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(v.name)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === v.name ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(v.name)}
                                className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(v.name)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {simpleItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No items found. Click "+ Add New" to add.
                    </div>
                  ) : (
                    simpleItems.map((item) => (
                      <div
                        key={item}
                        className="p-3 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition"
                      >
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {item}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onSelect && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelect(item);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 transition cursor-pointer"
                              title="Select"
                            >
                              Select
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === item ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(item)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* Form for Simple Types */}
          {mode !== 'list' && type !== 'variety' && (
            <form onSubmit={handleSaveSimple} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {mode === 'add' ? 'Add New Item' : 'Edit Item Name'}
                </label>
                <input
                  type="text"
                  required
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{mode === 'add' ? 'Save & Add' : 'Update Item'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Form for Variety */}
          {mode !== 'list' && type === 'variety' && (
            <form onSubmit={handleSaveVariety} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">
                    Variety Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={varietyForm.name}
                    onChange={(e) => setVarietyForm({ ...varietyForm, name: e.target.value })}
                    placeholder="e.g. NSIC Rc 222 (Tubigan 18)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Seed Type</label>
                  <select
                    value={varietyForm.seedType}
                    onChange={(e) =>
                      setVarietyForm({ ...varietyForm, seedType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
                  >
                    <option value="INBRED">INBRED (Certified Seeds)</option>
                    <option value="HYBRID">HYBRID (Hybrid Seeds)</option>
                    <option value="UNKNOWN">UNKNOWN / Farmers Saved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Total Maturity Days (DAS) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={60}
                    max={180}
                    value={varietyForm.maturityDays}
                    onChange={(e) =>
                      setVarietyForm({ ...varietyForm, maturityDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Vegetative Maturity (DAS)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={90}
                    value={varietyForm.vegetativeMaturityNet}
                    onChange={(e) =>
                      setVarietyForm({
                        ...varietyForm,
                        vegetativeMaturityNet: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Reproductive Maturity (DAS)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={120}
                    value={varietyForm.reproductiveMaturityDas}
                    onChange={(e) =>
                      setVarietyForm({
                        ...varietyForm,
                        reproductiveMaturityDas: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{mode === 'add' ? 'Save Variety' : 'Update Variety'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
