import React from 'react';
import { FarmParcel, GovernmentSubsidyProgram, SubsidyClaimRecord, SubsidyHistoryEntry } from '../types';
import { OfficialSealsTrio } from './Seals';
import { Printer, X } from 'lucide-react';

interface ChecklistPrintProps {
  mode: 'checklist';
  program: GovernmentSubsidyProgram | null;
  parcels: FarmParcel[];
  claimMap: Map<string, SubsidyClaimRecord>;
  preparedBy: string;
  municipalityName?: string;
  onClose: () => void;
}

interface HistoryPrintProps {
  mode: 'history';
  historyEntries: SubsidyHistoryEntry[];
  preparedBy: string;
  municipalityName?: string;
  onClose: () => void;
}

type SubsidyTalaanPrintModalProps = ChecklistPrintProps | HistoryPrintProps;

/**
 * Official printable Municipal Agriculture Office Distribution Talaan (Logbook Sheet)
 * with blank signature cells for owner receipt sign-off and official LGU header.
 */
export const SubsidyTalaanPrintModal: React.FC<SubsidyTalaanPrintModalProps> = (props) => {
  const municipality = (props.municipalityName || 'Municipality of Silago').toUpperCase();

  const handlePrintSheet = () => {
    const target = document.getElementById('printable-talaan-sheet');
    if (!target) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    doc.open();
    doc.write(`<!doctype html>
      <html>
        <head>
          <title>MAO Official Distribution Talaan - Silago</title>
          <style>
            @page { size: 11in 8.5in landscape; margin: 0.45in; }
            * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
            body { margin: 0; padding: 0; font-size: 11px; }
            .doc-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .doc-header h1 { margin: 2px 0; font-size: 14px; letter-spacing: 0.03em; }
            .doc-header p { margin: 1px 0; font-size: 10px; color: #334155; }
            .meta-bar { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 8px; padding: 6px 8px; background: #f8fafc; border: 1px solid #cbd5e1; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #334155; padding: 5px 6px; text-align: left; vertical-align: top; font-size: 10px; }
            th { background: #e2e8f0; font-weight: 700; text-transform: uppercase; font-size: 9px; }
            .signatories { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 28px; page-break-inside: avoid; }
            .sig-line { border-top: 1px solid #0f172a; padding-top: 4px; text-align: center; font-size: 10px; }
          </style>
        </head>
        <body>${target.innerHTML}</body>
      </html>`);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 500);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Official Office Print Preview — Distribution Talaan (Logbook)
            </h3>
            <p className="text-[11px] text-slate-500">
              Landscape office logbook format ready for Municipal Agriculture Office filing &amp; farmer sign-off
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSheet}
              className="px-4 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Talaan</span>
            </button>
            <button
              type="button"
              onClick={props.onClose}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
              aria-label="Close print preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div
            id="printable-talaan-sheet"
            className="bg-white border border-slate-300 p-6 mx-auto max-w-[1000px] shadow-xs"
          >
            <div className="doc-header text-center border-b-2 border-slate-900 pb-3 mb-3">
              <div className="flex items-center justify-center gap-3 mb-1">
                <OfficialSealsTrio />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Republic of the Philippines &bull; Province of Southern Leyte
              </p>
              <h1 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                {municipality} &mdash; MUNICIPAL AGRICULTURE OFFICE
              </h1>
              <p className="text-xs font-bold uppercase text-emerald-900 mt-1">
                {props.mode === 'checklist'
                  ? 'OFFICIAL GOVERNMENT SEEDLINGS & FERTILIZER DISTRIBUTION TALAAN (LOGBOOK)'
                  : 'OFFICIAL LEDGER OF PREVIOUS GOVERNMENT SEEDLINGS & FERTILIZER GIVE-AWAYS'}
              </p>
            </div>

            {props.mode === 'checklist' ? (
              <>
                <div className="meta-bar grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] bg-slate-50 border border-slate-300 px-3 py-2 mb-3">
                  <div>
                    <strong>Assistance Batch:</strong> {props.program?.title || 'All Batches'} (
                    {props.program?.category || '—'})
                  </div>
                  <div>
                    <strong>Funding Source:</strong> {props.program?.fundingSource || 'DA / LGU-Silago'}
                  </div>
                  <div>
                    <strong>Cropping Season:</strong> {props.program?.season || 'Current Season'}
                  </div>
                  <div>
                    <strong>Standard Allocation:</strong> {props.program?.defaultQuantity || '—'} &bull;{' '}
                    <strong>Printed:</strong> {new Date().toLocaleDateString()}
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 uppercase text-[10px]">
                      <th className="border border-slate-400 px-2 py-1.5 w-9 text-center">No.</th>
                      <th className="border border-slate-400 px-2 py-1.5">Riceland Owner</th>
                      <th className="border border-slate-400 px-2 py-1.5">RSBSA No. / Contact</th>
                      <th className="border border-slate-400 px-2 py-1.5">Barangay &amp; Area</th>
                      <th className="border border-slate-400 px-2 py-1.5">Type &amp; Qty Given</th>
                      <th className="border border-slate-400 px-2 py-1.5">Date Given &amp; Slip #</th>
                      <th className="border border-slate-400 px-2 py-1.5 w-32">Recipient / Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.parcels.map((parcel, idx) => {
                      const claim = props.claimMap.get(parcel.tagNumber);
                      const areaHa = Number(parcel.areaHa || parcel.weightKg || 0).toFixed(2);
                      return (
                        <tr key={parcel.tagNumber}>
                          <td className="border border-slate-400 px-2 py-1.5 text-center font-semibold tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5 font-bold">
                            {parcel.raiserName}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5 font-mono text-[10px]">
                            {parcel.swineNameOrId || parcel.tagNumber}
                            {parcel.contactNumber && (
                              <div className="text-slate-600">{parcel.contactNumber}</div>
                            )}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5">
                            Brgy. {parcel.barangay} ({areaHa} ha)
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5">
                            {claim?.claimed ? (
                              <>
                                <strong>{claim.inputType || props.program?.category}</strong>
                                <div>{claim.quantityReceived || props.program?.defaultQuantity}</div>
                              </>
                            ) : (
                              <span className="text-slate-500">
                                {props.program?.category} (Pending)
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5">
                            {claim?.claimed ? (
                              <>
                                <div>{claim.claimedAt || 'Recorded'}</div>
                                {claim.slipOrVoucherNo && (
                                  <div className="text-[10px] font-mono">
                                    Slip: {claim.slipOrVoucherNo}
                                  </div>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="border border-slate-400 px-2 py-1.5 text-[10px]">
                            {claim?.claimed ? (claim.recipientName || 'Owner (Signed)') : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 uppercase text-[10px]">
                    <th className="border border-slate-400 px-2 py-1.5 w-9 text-center">No.</th>
                    <th className="border border-slate-400 px-2 py-1.5">Date Given</th>
                    <th className="border border-slate-400 px-2 py-1.5">Riceland Owner &amp; RSBSA</th>
                    <th className="border border-slate-400 px-2 py-1.5">Barangay</th>
                    <th className="border border-slate-400 px-2 py-1.5">Give-away Type</th>
                    <th className="border border-slate-400 px-2 py-1.5">Item &amp; Qty Given</th>
                    <th className="border border-slate-400 px-2 py-1.5">Program &amp; Slip #</th>
                    <th className="border border-slate-400 px-2 py-1.5">Released By</th>
                  </tr>
                </thead>
                <tbody>
                  {props.historyEntries.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td className="border border-slate-400 px-2 py-1.5 text-center font-semibold tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 font-mono">
                        {entry.dateGiven || '—'}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5">
                        <strong>{entry.ownerName}</strong>
                        <div className="text-[10px] font-mono">{entry.rsbsaNo || entry.parcelTag}</div>
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5">Brgy. {entry.barangay}</td>
                      <td className="border border-slate-400 px-2 py-1.5 font-semibold">
                        {entry.inputType}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5">
                        {entry.itemGiven} &bull; <strong>{entry.quantityGiven}</strong>
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 text-[10px]">
                        {entry.programTitle}
                        {entry.slipOrVoucherNo && <div>Slip: {entry.slipOrVoucherNo}</div>}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5">{entry.releasedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="signatories grid grid-cols-3 gap-6 mt-8 text-[11px] text-center">
              <div className="pt-4">
                <div className="border-t border-slate-900 pt-1 font-bold">{props.preparedBy}</div>
                <div className="text-[10px] text-slate-600">Prepared &amp; Released By (MAO Staff)</div>
              </div>
              <div className="pt-4">
                <div className="border-t border-slate-900 pt-1 font-bold">RSBSA / LFT Focal Person</div>
                <div className="text-[10px] text-slate-600">Verified Distribution Records</div>
              </div>
              <div className="pt-4">
                <div className="border-t border-slate-900 pt-1 font-bold">Municipal Agriculturist</div>
                <div className="text-[10px] text-slate-600">Noted &amp; Approved (LGU Silago)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
