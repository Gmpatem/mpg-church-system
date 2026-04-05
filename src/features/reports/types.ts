export type ReportTabKey =
  | "overview"
  | "members"
  | "departments"
  | "treasury"
  | "events"
  | "unified";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface NormalizedReportFilters {
  dateFrom: string;
  dateTo: string;
  label: string;
}

export interface ReportStat {
  label: string;
  value: string | number;
  hint?: string;
}

export interface ReportDatum {
  name: string;
  value: number;
}

export interface ReportTrendDatum {
  label: string;
  [key: string]: string | number;
}

export interface ReportListItem {
  label: string;
  value?: string | number;
  sublabel?: string | null;
}

export interface ReportInsight {
  title: string;
  description: string;
  tone?: "default" | "success" | "warning";
}

export interface DepartmentHealthRow {
  name: string;
  memberCount: number;
  eventCount: number;
  outflowTotal: number;
}

export interface OverviewReport {
  stats: ReportStat[];
  membershipStatus: ReportDatum[];
  eventStatus: ReportDatum[];
  treasuryTrend: ReportTrendDatum[];
  topDepartments: ReportListItem[];
  highlights: ReportInsight[];
}

export interface MembersReport {
  stats: ReportStat[];
  statusBreakdown: ReportDatum[];
  byDepartment: ReportDatum[];
  recentTrend: ReportTrendDatum[];
  recentMembers: ReportListItem[];
  health: ReportInsight[];
}

export interface DepartmentsReport {
  stats: ReportStat[];
  membersByDepartment: ReportDatum[];
  eventsByDepartment: ReportDatum[];
  outflowByDepartment: ReportDatum[];
  rankings: ReportListItem[];
  watchlist: ReportInsight[];
}

export interface TreasuryReport {
  stats: ReportStat[];
  inflowByType: ReportDatum[];
  outflowByType: ReportDatum[];
  inflowByFund: ReportDatum[];
  outflowByFund: ReportDatum[];
  outflowByDepartment: ReportDatum[];
  trend: ReportTrendDatum[];
}

export interface EventsReport {
  stats: ReportStat[];
  byStatus: ReportDatum[];
  byType: ReportDatum[];
  byDepartment: ReportDatum[];
  trend: ReportTrendDatum[];
  upcoming: ReportListItem[];
}

export interface UnifiedReport {
  stats: ReportStat[];
  insights: ReportInsight[];
  departmentHealth: DepartmentHealthRow[];
}

export interface ReportsWorkspaceData {
  churchId: string;
  churchSlug: string;
  churchName: string;
  filters: NormalizedReportFilters;
  overview: OverviewReport;
  members: MembersReport;
  departments: DepartmentsReport;
  treasury: TreasuryReport;
  events: EventsReport;
  unified: UnifiedReport;
}
