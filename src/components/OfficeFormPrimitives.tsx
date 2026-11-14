import React from 'react';
import { X, Settings2, Upload, Loader2 } from 'lucide-react';
import { OfficialSealsTrio } from './Seals';
import { SafeImage } from './SafeImage';
import { BARANGAYS } from '../data/barangays';
import { RegistryField } from '../data/formSchema';

export const OFFICE_LABEL_CLASS = 'block text-[11px] font-semibold text-[#34413a]';

export const OFFICE_INPUT_CLASS =
  'w-full px-3 py-2 bg-white border border-gov-line-strong rounded text-xs text-gov-ink placeholder:text-slate-400 focus:border-gov-green focus:ring-1 focus:ring-gov-green outline-none transition';

export const OFFICE_SELECT_CLASS =
  'w-full px-3 py-2 bg-white border border-gov-line-strong rounded text-xs font-medium text-gov-ink focus:border-gov-green focus:ring-1 focus:ring-gov-green outline-none cursor-pointer transition disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';

interface OfficeModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

/**
 * Standardized official Municipal Agriculture Office modal header with LGU seals.
 */
export const OfficeModalHeader: React.FC<OfficeModalHeaderProps> = ({
  title,
  subtitle = 'Municipal Agriculture Office • Southern Leyte',
  onClose
}) => (
  <div className="bg-white px-5 py-3.5 border-b-2 border-gov-forest flex items-center justify-between shrink-0">
    <div className="flex items-center gap-3.5 min-w-0">
      <OfficialSealsTrio className="shrink-0" />
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gov-muted block truncate">
          Republic of the Philippines &bull; Municipality of Silago
        </span>
        <h2 className="font-serif text-base font-bold text-gov-ink leading-tight truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-gov-muted truncate">{subtitle}</p>}
      </div>
    </div>

    <button
      type="button"
      onClick={onClose}
      aria-label="Close form"
      className="w-8 h-8 rounded hover:bg-gov-canvas text-gov-muted hover:text-gov-ink flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

interface OfficeSectionCardProps {
  title: string;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Clean bordered section panel for Municipal Agriculture Office forms.
 */
export const OfficeSectionCard: React.FC<OfficeSectionCardProps> = ({
  title,
  rightContent,
  children
}) => (
  <div className="bg-white border border-gov-line rounded overflow-hidden">
    <div className="bg-gov-canvas/70 px-4 py-2 border-b border-gov-line flex items-center justify-between gap-2 flex-wrap">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gov-ink">{title}</h3>
      {rightContent}
    </div>
    <div className="p-4 space-y-3.5">{children}</div>
  </div>
);

interface OfficeFieldManageButtonProps {
  label?: string;
  onClick: () => void;
}

/**
 * Subtle office utility link to manage reference dropdown options.
 */
export const OfficeFieldManageButton: React.FC<OfficeFieldManageButtonProps> = ({
  label = 'Manage',
  onClick
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
  >
    <Settings2 className="w-3 h-3" />
    <span>{label}</span>
  </button>
);

interface OfficePhotoFieldProps {
  label: string;
  uploadButtonLabel: string;
  urlPlaceholder: string;
  altText: string;
  fallbackType: 'farmer' | 'field';
  value?: string;
  isUploading: boolean;
  previewRounded?: 'circle' | 'square';
  fallbackIcon: React.ReactNode;
  onUploadFile: (file: File) => void;
  onChangeUrl: (url: string) => void;
  onRemove: () => void;
}

/**
 * Compact office-style photo attachment row with upload, URL fallback, and preview.
 */
export const OfficePhotoField: React.FC<OfficePhotoFieldProps> = ({
  label,
  uploadButtonLabel,
  urlPlaceholder,
  altText,
  fallbackType,
  value,
  isUploading,
  previewRounded = 'square',
  fallbackIcon,
  onUploadFile,
  onChangeUrl,
  onRemove
}) => (
  <div className="pt-3 border-t border-slate-200 space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <label className={OFFICE_LABEL_CLASS}>{label}</label>
      {isUploading && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading...
        </span>
      )}
    </div>
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-2.5 rounded-md border border-slate-200">
      <div
        className={`w-12 h-12 ${
          previewRounded === 'circle' ? 'rounded-full' : 'rounded-md'
        } overflow-hidden border border-slate-300 shrink-0 bg-white flex items-center justify-center`}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
        ) : value ? (
          <SafeImage
            src={value}
            alt={altText}
            fallbackType={fallbackType}
            className="w-full h-full object-cover"
          />
        ) : (
          fallbackIcon
        )}
      </div>

      <div className="flex-1 w-full space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            className={`px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
              isUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Uploading...' : uploadButtonLabel}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
              }}
            />
          </label>
          {value && !isUploading && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-medium px-1.5 py-0.5 cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChangeUrl(e.target.value)}
          placeholder={urlPlaceholder}
          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-700 focus:border-emerald-700 outline-none"
        />
      </div>
    </div>
  </div>
);

interface OfficePanelProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}

/**
 * Crisp office panel container with subtle slate header strip and hairline border.
 */
export const OfficePanel: React.FC<OfficePanelProps> = ({
  title,
  subtitle,
  rightContent,
  noPadding = false,
  children
}) => (
  <section className="gov-panel">
    <div className="gov-panel-header">
      <div className="min-w-0">
        <h2 className="gov-panel-title">{title}</h2>
        {subtitle && <p className="text-[11px] text-gov-muted mt-0.5">{subtitle}</p>}
      </div>
      {rightContent && <div className="flex items-center gap-2 flex-wrap">{rightContent}</div>}
    </div>
    <div className={noPadding ? '' : 'p-4'}>{children}</div>
  </section>
);

export interface OfficeKpiItem {
  label: string;
  value: string | number;
  note: string;
  icon?: React.ElementType;
  valueToneClass?: string;
}

/**
 * Horizontal Municipal Agriculture Office summary ledger bar with hairline dividers.
 */
export const OfficeKpiStrip: React.FC<{ items: OfficeKpiItem[] }> = ({ items }) => {
  const colsClass =
    items.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-5';

  return (
    <section
      className={`grid ${colsClass} bg-white border border-gov-line rounded divide-y min-[440px]:divide-y-0 min-[440px]:divide-x divide-gov-line overflow-hidden`}
    >
      {items.map(({ label, value, note, icon: Icon, valueToneClass }) => (
        <article key={label} className="px-4 py-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gov-muted">
              {label}
            </span>
            {Icon && <Icon className="w-4 h-4 text-gov-muted/70 shrink-0" />}
          </div>
          <div
            className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
              valueToneClass || 'text-gov-ink'
            }`}
          >
            {value}
          </div>
          <div className="mt-1 text-[11px] text-gov-muted">{note}</div>
        </article>
      ))}
    </section>
  );
};

interface OfficeCustomFieldsGridProps {
  fields: RegistryField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

/**
 * Renders dynamic custom fields added in Form Customization uniformly inside
 * Municipal Agriculture Office registration and crop modals.
 */
export const OfficeCustomFieldsGrid: React.FC<OfficeCustomFieldsGridProps> = ({
  fields,
  values,
  onChange
}) => {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {fields.map((field) => {
        const isFixed = field.valueBehavior === 'fixed' && Boolean(field.fixedValue);
        const currentValue = isFixed
          ? field.fixedValue || ''
          : values[field.id] ?? '';

        return (
          <div
            key={field.id}
            className={`space-y-1 ${field.fieldType === 'Text Area' ? 'sm:col-span-2' : ''}`}
          >
            <label className={OFFICE_LABEL_CLASS}>
              {field.name}{' '}
              {field.required && <span className="text-red-600">*</span>}
            </label>

            {field.fieldType === 'Dropdown Menu' ? (
              <select
                required={field.required}
                disabled={isFixed}
                value={currentValue}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={OFFICE_SELECT_CLASS}
              >
                <option value="">{field.placeholder || `Select ${field.name}...`}</option>
                {(field.options && field.options.length > 0 ? field.options : ['Yes', 'No']).map(
                  (opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  )
                )}
              </select>
            ) : field.fieldType === 'Barangay Selector' ? (
              <select
                required={field.required}
                disabled={isFixed}
                value={currentValue}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={OFFICE_SELECT_CLASS}
              >
                <option value="">{field.placeholder || 'Select Barangay...'}</option>
                {BARANGAYS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : field.fieldType === 'Text Area' ? (
              <textarea
                rows={2}
                required={field.required}
                readOnly={isFixed}
                value={currentValue}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.name}...`}
                className={`${OFFICE_INPUT_CLASS} resize-y`}
              />
            ) : (
              <input
                type={
                  field.fieldType === 'Date Field'
                    ? 'date'
                    : field.fieldType === 'Number Field'
                    ? 'number'
                    : 'text'
                }
                step={field.fieldType === 'Number Field' ? 'any' : undefined}
                required={field.required}
                readOnly={isFixed}
                value={currentValue}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.name}...`}
                className={OFFICE_INPUT_CLASS}
              />
            )}

            {field.helpText && (
              <p className="text-[10px] text-slate-500">{field.helpText}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Validates required dynamic custom fields before advancing or submitting a form.
 */
export function validateRequiredCustomFields(
  fields: RegistryField[],
  values: Record<string, string>
): string | null {
  for (const field of fields) {
    if (!field.required || field.visible === false) continue;
    const val =
      field.valueBehavior === 'fixed' && field.fixedValue
        ? field.fixedValue
        : values[field.id] ?? '';
    if (!String(val).trim()) {
      return `${field.name} is required.`;
    }
  }
  return null;
}

/**
 * Merges existing custom field answers, current draft answers, and fixed-behavior defaults.
 */
export function mergeCustomFieldValues(
  fields: RegistryField[],
  draftValues: Record<string, string>,
  existingValues: Record<string, string> = {}
): Record<string, string> {
  const merged: Record<string, string> = { ...existingValues, ...draftValues };
  for (const field of fields) {
    if (field.visible === false) continue;
    if (field.valueBehavior === 'fixed' && field.fixedValue) {
      merged[field.id] = field.fixedValue;
    }
  }
  return merged;
}
