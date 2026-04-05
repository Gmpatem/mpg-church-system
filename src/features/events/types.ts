export type EventStatus = "scheduled" | "completed" | "cancelled";

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
  status: EventStatus;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
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
  status: EventStatus;
};

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};
