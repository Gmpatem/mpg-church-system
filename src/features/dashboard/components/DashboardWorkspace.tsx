import type { Translations } from "@/features/i18n/en";
import type { DashboardData } from "../types";
import { DashboardActionCenter } from "./DashboardActionCenter";
import { DashboardAgendaPanel } from "./DashboardAgendaPanel";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardMinistrySnapshot } from "./DashboardMinistrySnapshot";
import { DashboardPeopleMinistryPanel } from "./DashboardPeopleMinistryPanel";
import { DashboardPulseStrip } from "./DashboardPulseStrip";
import { DashboardUpdatesPanel } from "./DashboardUpdatesPanel";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

export function DashboardWorkspace({
  data,
  labels,
  locale,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  locale: string;
}) {
  const renderAgendaPanel = () => <DashboardAgendaPanel data={data} labels={labels} locale={locale} />;
  const renderPeoplePanel = () => <DashboardPeopleMinistryPanel data={data} labels={labels} locale={locale} />;
  const renderActionPanel = () => <DashboardActionCenter data={data} labels={labels} />;
  const renderUpdatesPanel = () => <DashboardUpdatesPanel data={data} labels={labels} locale={locale} />;
  const renderMinistryPanel = () => <DashboardMinistrySnapshot data={data} labels={labels} />;

  return (
    <div className="flex min-w-0 max-w-none flex-col gap-5 [container-type:inline-size]">
      <DashboardHeader data={data} labels={labels} locale={locale} />
      <DashboardPulseStrip data={data} labels={labels} />

      <div className="grid min-w-0 gap-5 lg:hidden">
        <div className="min-w-0">{renderActionPanel()}</div>
        <div className="min-w-0">{renderAgendaPanel()}</div>
        <div className="min-w-0">{renderPeoplePanel()}</div>
        <div className="min-w-0">{renderUpdatesPanel()}</div>
        <div className="min-w-0">{renderMinistryPanel()}</div>
      </div>

      <div className="hidden min-w-0 items-start gap-5 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.9fr)] xl:hidden">
        <div className="flex min-w-0 flex-col gap-5">
          {renderAgendaPanel()}
          {renderPeoplePanel()}
          {renderMinistryPanel()}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {renderActionPanel()}
          {renderUpdatesPanel()}
        </div>
      </div>

      <div className="hidden min-w-0 items-start gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(20rem,1fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(21.25rem,0.95fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {renderAgendaPanel()}
          {renderMinistryPanel()}
        </div>

        <div className="min-w-0">{renderPeoplePanel()}</div>

        <div className="flex min-w-0 flex-col gap-5">
          {renderActionPanel()}
          {renderUpdatesPanel()}
        </div>
      </div>
    </div>
  );
}
