import React from 'react';
import { Barangay, FarmParcel } from '../types';
import { X, MapPin, User, Phone, Wheat, Droplets, Compass, Layers, ChevronRight } from 'lucide-react';
import { getLandPhoto } from '../data/photos';

interface BarangayDetailModalProps {
  barangay: Barangay | null;
  parcels: FarmParcel[];
  onClose: () => void;
  onSelectParcel: (parcel: FarmParcel) => void;
  onViewOnMap: (barangay: Barangay) => void;
}

export const BarangayDetailModal: React.FC<BarangayDetailModalProps> = ({
  barangay,
  parcels,
  onClose,
  onSelectParcel,
  onViewOnMap
}) => {
  if (!barangay) return null;

  const brgyParcels = parcels.filter(
    (p) => p.barangay.toLowerCase() === barangay.name.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0B1E38] text-white p-5 sm:p-6 relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {barangay.asfStatus}
                </span>
                <span className="text-xs text-slate-300">
                  Sector: {barangay.terrain}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                Barangay {barangay.name}
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Municipality of Silago, Southern Leyte • {barangay.puroks} Designated Puroks / Sitios
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* LFT Officer Info Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {barangay.focalPerson.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Designated Local Farm Technician (LFT)
                </span>
                <h4 className="text-sm font-bold text-slate-900">{barangay.focalPerson}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {barangay.contactNumber}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    @{barangay.username}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewOnMap(barangay);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Compass className="w-4 h-4" />
              Focus on GIS Map
            </button>
          </div>

          {/* Key Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rice Area</span>
              <strong className="text-lg font-serif font-black text-slate-900">
                {barangay.totalAreaHa.toFixed(1)} ha
              </strong>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">NIA Irrigated</span>
              <strong className="text-lg font-serif font-black text-blue-900">
                {barangay.irrigatedAreaHa.toFixed(1)} ha
              </strong>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Rainfed Sector</span>
              <strong className="text-lg font-serif font-black text-amber-900">
                {barangay.rainfedAreaHa.toFixed(1)} ha
              </strong>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Parcels Mapped</span>
              <strong className="text-lg font-serif font-black text-emerald-900">
                {brgyParcels.length}
              </strong>
            </div>
          </div>

          {/* Coordinates & Terrain */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-mono text-slate-600">
                Lat: {barangay.lat.toFixed(4)}, Lng: {barangay.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-700 font-semibold">{barangay.terrain}</span>
            </div>
          </div>

          {/* Registered Rice Parcels List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wheat className="w-4 h-4 text-emerald-600" />
                Georeferenced Farm Parcels in Brgy. {barangay.name} ({brgyParcels.length})
              </h4>
            </div>

            {brgyParcels.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No farm parcels registered yet for this barangay in the current demo season.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {brgyParcels.map((parcel) => (
                  <div
                    key={parcel.tagNumber}
                    onClick={() => {
                      onClose();
                      onSelectParcel(parcel);
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getLandPhoto(parcel)}
                        alt="Parcel"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                            {parcel.tagNumber}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {parcel.weightKg} ha
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {parcel.raiserName} • <span className="text-emerald-700 font-semibold">{parcel.breed}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {parcel.purok} • {parcel.healthStatus}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
