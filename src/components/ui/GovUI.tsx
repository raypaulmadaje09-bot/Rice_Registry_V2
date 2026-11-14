import React from 'react';

/**
 * Silago Gov UI — shared primitives for the formal Municipal Agriculture Office workspace.
 * White & slate surfaces, dark LGU green accents, flat panels, compact tables, serif headings.
 * Pair with the `.gov-*` classes defined in `src/index.css`.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* ---------------------------------------------------------------- PageHeader */

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/** Standard top-of-page header: eyebrow, serif title, description, and right-aligned actions. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow = 'Municipal Agriculture Office',
  title,
  description,
  icon: Icon,
  actions,
  meta,
  className
}) => (
  <header className={cx('mb-5 pb-4 border-b border-gov-line', className)}>
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="mt-0.5 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gov-line bg-white text-gov-green">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="gov-eyebrow">{eyebrow}</div>}
          <h1 className="gov-heading text-[22px] sm:text-[26px] font-semibold leading-tight mt-0.5">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-gov-muted">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">{actions}</div>}
    </div>
  </header>
);

/* ---------------------------------------------------------------- Panel */

interface GovPanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

/** Flat bordered panel with an optional uppercase title strip. */
export const GovPanel: React.FC<GovPanelProps> = ({
  title,
  subtitle,
  actions,
  noPadding = false,
  className,
  bodyClassName,
  children
}) => (
  <section className={cx('gov-panel overflow-hidden', className)}>
    {(title || actions) && (
      <div className="gov-panel-header">
        <div className="min-w-0">
          {title && <h2 className="gov-panel-title">{title}</h2>}
          {subtitle && <p className="text-[11.5px] text-gov-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={cx(noPadding ? '' : 'p-4', bodyClassName)}>{children}</div>
  </section>
);

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface GovButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: React.ElementType;
}

/** Rectangular office button. Defaults to `type="button"`. */
export const GovButton: React.FC<GovButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={cx('gov-btn', `gov-btn-${variant}`, size === 'sm' && 'gov-btn-sm', className)}
    {...rest}
  >
    {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
    {children}
  </button>
);

/* ---------------------------------------------------------------- Badge */

type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'gold';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[#f4f6f3] border-gov-line text-[#34413a]',
  green: 'bg-gov-green-soft border-[#bcd3c5] text-gov-green',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  red: 'bg-red-50 border-red-200 text-red-700',
  blue: 'bg-slate-50 border-slate-300 text-slate-700',
  gold: 'bg-gov-gold-soft border-[#e3cf9f] text-[#7a5714]'
};

/** Small status label. */
export const GovBadge: React.FC<{ tone?: BadgeTone; className?: string; children: React.ReactNode }> = ({
  tone = 'neutral',
  className,
  children
}) => <span className={cx('gov-badge', BADGE_TONES[tone], className)}>{children}</span>;

/* ---------------------------------------------------------------- StatStrip */

export interface GovStatItem {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  icon?: React.ElementType;
  tone?: 'default' | 'green' | 'amber' | 'red';
}

const STAT_TONE: Record<NonNullable<GovStatItem['tone']>, string> = {
  default: 'text-gov-ink',
  green: 'text-gov-green',
  amber: 'text-amber-700',
  red: 'text-red-700'
};

/** Horizontal ledger of key figures separated by hairline dividers. */
export const GovStatStrip: React.FC<{ items: GovStatItem[]; className?: string }> = ({ items, className }) => {
  const cols =
    items.length <= 2
      ? 'sm:grid-cols-2'
      : items.length === 3
      ? 'sm:grid-cols-3'
      : items.length === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : 'sm:grid-cols-3 xl:grid-cols-5';
  return (
    <section
      className={cx(
        'gov-panel grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-gov-line overflow-hidden',
        cols,
        className
      )}
    >
      {items.map(({ label, value, note, icon: Icon, tone = 'default' }) => (
        <article key={label} className="px-4 py-3.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-gov-muted truncate">{label}</span>
            {Icon && <Icon className="h-4 w-4 shrink-0 text-[#8a948e]" />}
          </div>
          <div className={cx('mt-1.5 gov-heading text-[26px] font-semibold tabular-nums leading-none', STAT_TONE[tone])}>
            {value}
          </div>
          {note && <div className="mt-1.5 text-[11px] text-gov-muted truncate">{note}</div>}
        </article>
      ))}
    </section>
  );
};

/* ---------------------------------------------------------------- Tabs */

export interface GovTabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ElementType;
}

interface GovTabsProps<T extends string> {
  tabs: Array<GovTabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Underlined document-style tab strip. */
export function GovTabs<T extends string>({ tabs, active, onChange, className }: GovTabsProps<T>) {
  return (
    <div className={cx('flex items-end gap-1 overflow-x-auto no-scrollbar border-b border-gov-line', className)}>
      {tabs.map(({ id, label, count, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cx(
              '-mb-px shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold border-b-2 transition cursor-pointer',
              isActive
                ? 'border-gov-forest text-gov-forest'
                : 'border-transparent text-gov-muted hover:text-gov-ink hover:border-gov-line-strong'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={cx(
                  'ml-0.5 rounded-sm px-1.5 text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-gov-forest text-white' : 'bg-[#eceee9] text-gov-muted'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Toolbar */

/** Filter / search row placed above tables. */
export const GovToolbar: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cx('flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-gov-line bg-white', className)}>
    {children}
  </div>
);

/* ---------------------------------------------------------------- EmptyState */

interface GovEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Quiet placeholder for empty lists and tables. */
export const GovEmptyState: React.FC<GovEmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div className={cx('px-6 py-10 text-center', className)}>
    {Icon && (
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded border border-gov-line bg-[#fafbf9] text-[#8a948e]">
        <Icon className="h-5 w-5" />
      </span>
    )}
    <p className="text-[13px] font-semibold text-gov-ink">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-md text-[12px] text-gov-muted">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

/* ---------------------------------------------------------------- Field */

interface GovFieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + optional hint wrapper for office forms. */
export const GovField: React.FC<GovFieldProps> = ({ label, required, hint, className, children }) => (
  <div className={cx('min-w-0', className)}>
    <label className="gov-label">
      {label}
      {required && <span className="ml-0.5 text-red-600">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[10.5px] text-gov-muted">{hint}</p>}
  </div>
);

/* ---------------------------------------------------------------- DefinitionList */

/** Two-column key/value record listing used in dossiers and detail panels. */
export const GovDefinitionList: React.FC<{
  items: Array<{ label: string; value: React.ReactNode }>;
  columns?: 1 | 2 | 3;
  className?: string;
}> = ({ items, columns = 2, className }) => (
  <dl
    className={cx(
      'grid gap-x-6 gap-y-3',
      columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3',
      className
    )}
  >
    {items.map((item) => (
      <div key={item.label} className="min-w-0 border-b border-[#eceee9] pb-2">
        <dt className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-gov-muted">{item.label}</dt>
        <dd className="mt-0.5 text-[13px] font-medium text-gov-ink break-words">{item.value || '—'}</dd>
      </div>
    ))}
  </dl>
);
