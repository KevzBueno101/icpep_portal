import { Target, ScrollText, History, Gavel, FolderOpen, Wallet, Flag } from 'lucide-react'

export const SECTION_TYPES = [
  { value: 'MISSION', label: 'Mission' },
  { value: 'VISION', label: 'Vision' },
  { value: 'GOALS', label: 'Goals' },
  { value: 'HISTORY', label: 'History' },
  { value: 'CONSTITUTION', label: 'Constitution & By-Laws' },
  { value: 'RESOLUTION', label: 'Resolution' },
  { value: 'BUDGET_PROPOSAL', label: 'Budget Proposal' },
  { value: 'ACCOMPLISHMENT_REPORT', label: 'Accomplishment Report' },
  { value: 'CUSTOM', label: 'Custom' },
]

export const CATEGORY_DEFS = [
  {
    key: 'MVC',
    label: 'MVC',
    subtitle: 'Mission, Vision, Core Values & Goals',
    icon: Target,
    iconBox: 'bg-sky-50 text-sky-600',
    chip: 'bg-sky-100 text-sky-700',
    defaultType: 'MISSION',
  },
  {
    key: 'CONSTITUTION',
    label: 'Constitution',
    subtitle: 'Constitution & By-Laws (CBL)',
    icon: ScrollText,
    iconBox: 'bg-blue-50 text-blue-600',
    chip: 'bg-blue-100 text-blue-700',
    defaultType: 'CONSTITUTION',
  },
  {
    key: 'RESOLUTION',
    label: 'Resolution',
    subtitle: 'Resolutions & decisions',
    icon: Gavel,
    iconBox: 'bg-violet-50 text-violet-600',
    chip: 'bg-violet-100 text-violet-700',
    defaultType: 'RESOLUTION',
  },
  {
    key: 'HISTORY',
    label: 'History',
    subtitle: 'History of the organization',
    icon: History,
    iconBox: 'bg-amber-50 text-amber-600',
    chip: 'bg-amber-100 text-amber-700',
    defaultType: 'HISTORY',
  },
  {
    key: 'BUDGET',
    label: 'Budget',
    subtitle: 'Budget proposals & financial documents',
    icon: Wallet,
    iconBox: 'bg-emerald-50 text-emerald-600',
    chip: 'bg-emerald-100 text-emerald-700',
    defaultType: 'BUDGET_PROPOSAL',
  },
  {
    key: 'ACCOMPLISHMENT',
    label: 'Accomplishments',
    subtitle: 'Accomplishment reports & achievements',
    icon: Flag,
    iconBox: 'bg-orange-50 text-orange-600',
    chip: 'bg-orange-100 text-orange-700',
    defaultType: 'ACCOMPLISHMENT_REPORT',
  },
  {
    key: 'CUSTOM',
    label: 'Other Documents',
    subtitle: 'Other sections',
    icon: FolderOpen,
    iconBox: 'bg-slate-100 text-slate-600',
    chip: 'bg-slate-100 text-slate-700',
    defaultType: 'CUSTOM',
  },
]

export const TYPE_LABELS = {
  MISSION: 'Mission',
  VISION: 'Vision',
  GOALS: 'Goals',
  HISTORY: 'History',
  CONSTITUTION: 'Constitution & By-Laws',
  RESOLUTION: 'Resolution',
  BUDGET_PROPOSAL: 'Budget Proposal',
  ACCOMPLISHMENT_REPORT: 'Accomplishment Report',
  CUSTOM: 'Section',
}

export const typeLabel = (t) => TYPE_LABELS[t] || t || 'Section'

export const FEED_COLORS = {
  HISTORY: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  CONSTITUTION: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  RESOLUTION: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  BUDGET_PROPOSAL: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ACCCOMPLISHMENT_REPORT: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  CUSTOM: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
}

export const isCoreValues = (section) =>
  section?.section_type === 'CUSTOM' &&
  (section.title || '').toLowerCase().includes('core value')

export const categoryFor = (section) => {
  if (!section) return 'CUSTOM'
  if (isCoreValues(section)) return 'MVC'
  if (['MISSION', 'VISION', 'GOALS'].includes(section.section_type)) return 'MVC'
  if (section.section_type === 'CONSTITUTION') return 'CONSTITUTION'
  if (section.section_type === 'HISTORY') return 'HISTORY'
  if (section.section_type === 'RESOLUTION') return 'RESOLUTION'
  if (section.section_type === 'BUDGET_PROPOSAL') return 'BUDGET'
  if (section.section_type === 'ACCOMPLISHMENT_REPORT') return 'ACCOMPLISHMENT'
  return 'CUSTOM'
}