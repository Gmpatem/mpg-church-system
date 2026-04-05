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
