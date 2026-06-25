export type EventOperationalStatus = "scheduled" | "completed" | "cancelled";
export type EventStatus = EventOperationalStatus;

export type EventWorkflowState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "published"
  | "rejected";

export type EventsCanonicalTab = "overview" | "events" | "calendar";

export type EventsLegacyTab =
  | "all_events"
  | "create_event"
  | "detail"
  | "edit"
  | "calendar_notes";

export type EventDialogIntent =
  | { type: "create" }
  | { type: "edit"; eventId: string }
  | null;

export type EventsCalendarView = "month" | "week" | "day" | "list";

export type EventsLocale = "en" | "fr";

export type EventDepartmentSummary = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  isPrimary: boolean;
};

export type EventApprovalSummary = {
  id: string;
  status: string;
  currentStage: string;
  currentAssigneeRoleCode: string | null;
  priority: string;
  submittedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
};

export type EventPermissions = {
  canViewEvents: boolean;
  canManageEvents: boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canChangeStatus: boolean;
  canOpenApprovalQueue: boolean;
};

export type EventsWorkspaceFilters = {
  q: string;
  status: EventOperationalStatus | "all";
  workflow: EventWorkflowState | "all";
  eventType: string;
  departmentId: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: 25 | 50 | 100;
  eventId: string;
  calendarView: EventsCalendarView;
  calendarDate: string;
};

export type EventRegistryRow = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  primaryDepartmentId: string | null;
  departments: EventDepartmentSummary[];
  location: string | null;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  status: EventOperationalStatus;
  workflowState: EventWorkflowState;
  approvalNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventDetailsViewModel = EventRegistryRow & {
  approval: EventApprovalSummary | null;
  approvalLoadError?: string | null;
};

export type EventCalendarItem = EventRegistryRow & {
  calendarDateKey: string;
};

export type EventsSummaryMetrics = {
  totalEvents: number;
  filteredEvents: number;
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  upcomingCount: number;
  pendingApprovalCount: number;
  departmentLinkedCount: number;
};

export type EventsOverviewData = {
  upcoming: EventRegistryRow[];
  needsAttention: EventRegistryRow[];
  recentlyUpdated: EventRegistryRow[];
  departmentParticipation: Array<{
    departmentId: string;
    departmentName: string;
    eventCount: number;
  }>;
  statusBreakdown: Array<{ key: EventOperationalStatus; label: string; count: number }>;
  workflowBreakdown: Array<{ key: EventWorkflowState; label: string; count: number }>;
};

export type EventsRegistryData = {
  rows: EventRegistryRow[];
  total: number;
  page: number;
  pageSize: 25 | 50 | 100;
  pageCount: number;
};

export type EventsCalendarData = {
  items: EventCalendarItem[];
  rangeStart: string;
  rangeEnd: string;
};

export type EventTypeOption = {
  value: string;
  label: string;
};

export type EventFormDepartmentOption = EventDepartmentSummary;

export type EventsFormOptions = {
  departments: EventFormDepartmentOption[];
  eventTypes: EventTypeOption[];
};

export type EventsNavigationState = {
  activeTab: EventsCanonicalTab;
  selectedEventId: string;
  dialog: EventDialogIntent;
  legacyTab: EventsLegacyTab | null;
};

export type EventsWorkspaceData = {
  church: {
    id: string;
    slug: string;
    name: string;
    timezone: string;
  };
  locale: EventsLocale;
  navigation: EventsNavigationState;
  filters: EventsWorkspaceFilters;
  permissions: EventPermissions;
  summary: EventsSummaryMetrics;
  registry: EventsRegistryData;
  overview: EventsOverviewData;
  calendar: EventsCalendarData;
  selectedEvent: EventDetailsViewModel | null;
  formOptions: EventsFormOptions;
};

export type ChurchEventRecord = {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  event_type: string;
  department_id: string | null;
  location: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  status: EventOperationalStatus;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  workflow_state?: EventWorkflowState;
  approval_note?: string | null;
  department?: {
    id: string;
    department_name: string;
    code: string | null;
  } | null;
  departments?: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
};

export type EventListItem = ChurchEventRecord;

export type EventFormValues = {
  title: string;
  description: string;
  event_type: string;
  department_ids: string[];
  location: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  status: EventOperationalStatus;
};

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  createdEventIds?: string[];
  updatedEventId?: string;
  deletedEventId?: string;
  workflowState?: EventWorkflowState;
};
