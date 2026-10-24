'use client';

export { cn } from './lib/cn';

export { Avatar } from './components/avatar';
export { Banner } from './components/banner';
export {
  Button,
  IconButton,
  buttonStyles,
  type ButtonProps,
  type IconButtonProps,
} from './components/button';
export { Card, CardContent, CardHeader, CardTitle } from './components/card';
export {
  Field,
  TextInput,
  Textarea,
  type TextInputProps,
  type TextareaProps,
} from './components/field';
export {
  DeltaBadge,
  IconTile,
  KpiCard,
  Sparkline,
  type Delta,
  type KpiCardProps,
  type Tint,
} from './components/kpi-card';
export { PageHeader } from './components/page-header';
export {
  Skeleton,
  SkeletonChart,
  SkeletonForm,
  SkeletonKpiCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonTable,
  SkeletonText,
} from './components/skeleton';
export { Spinner } from './components/spinner';
export { StatusChip, type AnimalStatus } from './components/status-chip';
export {
  EmptyState,
  ErrorState,
  FilteredEmptyState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
  type EmptyStateProps,
  type ErrorStateProps,
  type FilteredEmptyStateProps,
} from './components/states';

export { AppShell } from './shell/app-shell';
export { Sidebar, type NavItem } from './shell/sidebar';
export {
  FarmSwitcher,
  LanguageSwitcher,
  MenuItem,
  MenuLabel,
  NotificationBell,
  SearchTrigger,
  ThemeToggle,
  UserMenu,
} from './shell/top-bar';

export { Chart } from './charts/chart';
export { SessionsChart } from './charts/sessions-chart';
export { useChartTheme, type ChartTheme } from './charts/use-chart-theme';

export {
  Checkbox,
  MoneyInput,
  NumberInput,
  RadioPills,
  Select,
  Switch,
  type SelectOption,
} from './components/controls';
export {
  DataTable,
  dataTableColumns,
  dataTableFeatures,
  type DataTableColumn,
  type Density,
  type ServerTable,
  type ServerTableState,
} from './components/data-table';
export { DataTableToolbar } from './components/data-table-toolbar';
export { downloadCsv, toCsv, type CsvColumn } from './lib/csv';
export {
  DateTile,
  DonutCard,
  ListCard,
  type DonutSlice,
  type ListItem,
} from './components/data-cards';
export {
  ConfirmDialog,
  Dialog,
  Sheet,
  Tabs,
  Tooltip,
  TooltipProvider,
} from './components/overlays';
export { Toaster, toast, type ToastInput } from './components/toast';

export {
  Accordion,
  FormSummary,
  Popover,
  SectionHeader,
  Stepper,
  type FormIssue,
} from './components/disclosure';
export {
  HealthScoreRing,
  MiniTable,
  Timeline,
  type TimelineEvent,
} from './components/data-display';
export { FileUpload, type FileProblem } from './components/file-upload';
export {
  Combobox,
  DatePicker,
  MultiSelect,
  PhoneInput,
  TimePicker,
  type ComboOption,
} from './components/pickers';
export {
  CommandPalette,
  useCommandShortcut,
  type PaletteGroup,
  type PaletteItem,
} from './shell/palette';
export {
  NotificationCenter,
  OfflineBanner,
  SyncPill,
  type NotificationItem,
  type SyncStatus,
} from './shell/status';

export {
  PasswordField,
  SubmitButton,
  TextAreaField,
  TextField,
  focusFirstInvalid,
  formProps,
  problemToFormErrors,
  revalidateWhileInvalid,
  useAppForm,
  useErrorText,
  withForm,
  type ErrorParams,
  type FormErrors,
} from './form/form-kit';
