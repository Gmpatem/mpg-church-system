export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  event_type: string;
  department_id: string | null;
  location: string | null;
  is_all_day: boolean;
}

export interface ChurchCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  status: string;
  eventType: string;
  location?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  description?: string | null;
  churchSlug: string;
}

export interface CalendarDepartmentOption {
  id: string;
  department_name: string;
  color: string;
}
