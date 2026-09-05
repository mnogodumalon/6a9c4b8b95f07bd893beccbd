import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { useMemo, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { formatDate, formatDateTime, lookupKey } from '@/lib/formatters';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS, lookupOption, LOOKUP_OPTIONS } from '@/types/app';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { ChartWidget, type ChartRow, type ChartSegment } from '@/components/widgets/ChartWidget';
import {
  IconRowInsertTop,
  IconAlertTriangle,
  IconAnchor,
  IconUsers,
  IconMap2,
  IconAlertCircle,
  IconCheck,
  IconClockHour4,
  IconChartBar,
} from '@tabler/icons-react';
import type { Logbuch } from '@/types/app';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    mitglieder, boote, logbuch, schadensmeldungen,
    mitgliederMap, booteMap, logbuchMap,
    fetchAll,
    setSchadensmeldungen,
  } = data;

  const clock = useClock();
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'logbuch') {
        const rec = top.record;
        if (!rec.fields.endzeit) {
          return {
            label: tx('Ausfahrt beenden'),
            onClick: () => crud.logbuch.openEdit(rec),
          };
        }
      }
      if (top.type === 'schadensmeldungen') {
        const rec = top.record;
        const status = lookupKey(rec.fields.status_meldung);
        if (status !== 'erledigt') {
          return {
            label: tx('Als erledigt markieren'),
            onClick: () => markSchadenErledigt(rec),
          };
        }
      }
      return undefined;
    },
  });

  const enrichedLogbuch = crud.enriched.logbuch;
  const enrichedSchadensmeldungen = crud.enriched.schadensmeldungen;

  // --- Derived state ---
  const currentYear = clock.getFullYear();
  const todayKey = format(clock, 'yyyy-MM-dd');

  // Active trips = logbuch entries with no endzeit (still on the water)
  const activeTrips = useMemo(
    () => enrichedLogbuch.filter(r => !r.fields.endzeit),
    [enrichedLogbuch]
  );

  // Trips this year
  const thisYearTrips = useMemo(
    () => enrichedLogbuch.filter(r => {
      if (!r.fields.startzeit) return false;
      try {
        const d = parseISO(r.fields.startzeit);
        return isValid(d) && d.getFullYear() === currentYear;
      } catch { return false; }
    }),
    [enrichedLogbuch, currentYear]
  );

  // Total km this year
  const totalKmYear = useMemo(
    () => thisYearTrips.reduce((sum, r) => sum + (r.fields.strecke_km ?? 0), 0),
    [thisYearTrips]
  );

  // Open damage reports
  const openSchaeden = useMemo(
    () => enrichedSchadensmeldungen.filter(r => lookupKey(r.fields.status_meldung) !== 'erledigt'),
    [enrichedSchadensmeldungen]
  );

  // Critical damage (schweregrad = hoch)
  const criticalSchaeden = useMemo(
    () => openSchaeden.filter(r => lookupKey(r.fields.schweregrad) === 'hoch'),
    [openSchaeden]
  );

  // Available boats
  const availableBoote = useMemo(
    () => boote.filter(b => lookupKey(b.fields.boot_status) === 'verfuegbar'),
    [boote]
  );

  // Recent trips (last 10, sorted by startzeit desc)
  const recentTrips = useMemo(
    () => [...enrichedLogbuch]
      .filter(r => !!r.fields.startzeit)
      .sort((a, b) => (b.fields.startzeit ?? '').localeCompare(a.fields.startzeit ?? ''))
      .slice(0, 10),
    [enrichedLogbuch]
  );

  // Context line: active boats or recent activity
  const contextLine = useMemo(() => {
    if (activeTrips.length > 0) {
      const bootNames = activeTrips.map(t => t.bootName).filter(Boolean);
      return tx`${namen(bootNames)} ${activeTrips.length === 1 ? tx('ist gerade auf dem Wasser') : tx('sind gerade auf dem Wasser')}`;
    }
    if (recentTrips.length > 0) {
      const last = recentTrips[0];
      const bootsname = last.bootName || tx('Unbekanntes Boot');
      return tx`Letzte Ausfahrt mit ${bootsname} — ${formatDate(last.fields.startzeit)}`;
    }
    return tx('Noch keine Ausfahrten eingetragen.');
  }, [activeTrips, recentTrips]);

  // Chart: km per member (this year)
  const [memberChartFilter, setMemberChartFilter] = useState<ChartSegment<Logbuch> | null>(null);

  const memberKmRows = useMemo<ChartRow<Logbuch>[]>(
    () => thisYearTrips
      .filter(r => (r.fields.strecke_km ?? 0) > 0)
      .map(r => ({ id: `logbuch:${r.record_id}`, data: r })),
    [thisYearTrips]
  );

  // Chart: km per boat (this year)
  const boatKmRows = useMemo<ChartRow<Logbuch>[]>(
    () => thisYearTrips
      .filter(r => (r.fields.strecke_km ?? 0) > 0)
      .map(r => ({ id: `logbuch:${r.record_id}`, data: r })),
    [thisYearTrips]
  );

  // Mark schaden as erledigt
  const markSchadenErledigt = async (rec: (typeof enrichedSchadensmeldungen)[0]) => {
    const snapshot = [...schadensmeldungen];
    const today = format(clock, 'yyyy-MM-dd');
    const optimistic = schadensmeldungen.map(s =>
      s.record_id === rec.record_id
        ? { ...s, fields: { ...s.fields, status_meldung: lookupOption('schadensmeldungen', 'status_meldung', 'erledigt'), erledigt_am: today } }
        : s
    );
    setSchadensmeldungen(optimistic);
    undoToast(tx`${rec.fields.titel ?? tx('Meldung')} — als erledigt markiert`, async () => {
      setSchadensmeldungen(snapshot);
      await LivingAppsService.updateSchadensmeldungenEntry(rec.record_id, {
        status_meldung: 'offen',
        erledigt_am: undefined,
      }).catch(() => fetchAll());
    });
    try {
      await LivingAppsService.updateSchadensmeldungenEntry(rec.record_id, {
        status_meldung: 'erledigt',
        erledigt_am: today,
      });
    } catch {
      setSchadensmeldungen(snapshot);
      fetchAll();
    }
  };

  // Hero: critical damage report blocking a boat
  const heroBanner = criticalSchaeden.length > 0 ? (() => {
    const first = criticalSchaeden[0];
    const bootId = extractRecordId(first.fields.ausfahrt ? logbuchMap.get(extractRecordId(first.fields.ausfahrt) ?? '')?.fields.boot : undefined);
    const bootName = bootId ? booteMap.get(bootId)?.fields.name : undefined;
    return (
      <HeroBanner
        icon={<IconAlertTriangle size={18} />}
        action={{ label: tx('Als erledigt markieren'), onClick: () => markSchadenErledigt(first) }}
      >
        <b>{first.fields.titel ?? tx('Schwerer Schaden')}</b>
        {bootName ? tx` — Boot "${bootName}" nicht nutzbar.` : tx` — Boot nicht nutzbar.`}
        {' '}{tx('Bitte sofort dem Bootswart melden.')}
      </HeroBanner>
    );
  })() : null;

  // Empty state
  if (logbuch.length === 0 && boote.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-1">{tx('Richte dein Logbuch ein — starte mit Booten und Mitgliedern.')}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-border">
          <IconAnchor size={48} className="text-muted-foreground" stroke={1.5} />
          <div className="text-center">
            <h2 className="font-semibold text-foreground mb-1">{tx('Logbuch einrichten')}</h2>
            <p className="text-muted-foreground text-sm">{tx('Trag zuerst eure Boote ein, dann Mitglieder — und los gehts!')}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => crud.boote.openCreate({})}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              <IconAnchor size={16} className="shrink-0" />
              {tx('Erstes Boot aufnehmen')}
            </button>
            <button
              onClick={() => crud.mitglieder.openCreate({})}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
            >
              <IconUsers size={16} className="shrink-0" />
              {tx('Mitglied hinzufügen')}
            </button>
          </div>
        </div>
        {crud.surfaces}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-1">{contextLine}</p>
        </div>
        <button
          onClick={() => crud.logbuch.openCreate({ startzeit: format(clock, "yyyy-MM-dd'T'HH:mm") })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0"
        >
          <IconRowInsertTop size={16} className="shrink-0" />
          {tx('Neue Ausfahrt')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={heroBanner}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Aktiv auf dem Wasser')}
              value={activeTrips.length}
              icon={<IconAnchor size={16} className="shrink-0" />}
              tone={activeTrips.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Boote verfügbar')}
              value={availableBoote.length}
              icon={<IconAnchor size={16} className="shrink-0" />}
              tone={availableBoote.length === 0 ? 'warning' : 'success'}
            />
            <StatStripItem
              title={tx('km dieses Jahr')}
              value={`${Math.round(totalKmYear).toLocaleString()} km`}
              icon={<IconMap2 size={16} className="shrink-0" />}
            />
            <StatStripItem
              title={tx('Offene Meldungen')}
              value={openSchaeden.length}
              icon={<IconAlertCircle size={16} className="shrink-0" />}
              tone={openSchaeden.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Mitglieder')}
              value={mitglieder.filter(m => lookupKey(m.fields.status) === 'aktiv').length}
              icon={<IconUsers size={16} className="shrink-0" />}
            />
          </StatStrip>
        }
        primary={
          <div className="space-y-4">
            {/* Active trips on the water */}
            {activeTrips.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <IconClockHour4 size={16} className="text-primary shrink-0" />
                  <h2 className="font-semibold text-foreground text-sm">{tx('Aktuell auf dem Wasser')}</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{activeTrips.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {activeTrips.map(trip => {
                    const ruderersRaw = Array.isArray(trip.fields.ruderer) ? trip.fields.ruderer : [];
                    const rudererNames = ruderersRaw
                      .map(url => {
                        const id = extractRecordId(url);
                        if (!id) return null;
                        const m = mitgliederMap.get(id);
                        return m ? `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim() : null;
                      })
                      .filter(Boolean) as string[];
                    const gastCount = trip.fields.gastruderer_anzahl ?? 0;
                    const allNames = [...rudererNames];
                    if (gastCount > 0) allNames.push(tx`${gastCount} ${gastCount === 1 ? tx('Gast') : tx('Gäste')}`);

                    return (
                      <div
                        key={trip.record_id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => crud.logbuch.openDetail(trip)}
                      >
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-foreground truncate">
                            {trip.bootName || tx('Unbekanntes Boot')}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {allNames.length > 0 ? namen(allNames) : tx('Keine Ruderer eingetragen')}
                            {trip.fields.startzeit && ` · ${tx('seit')} ${format(parseISO(trip.fields.startzeit), 'HH:mm')}`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {trip.fields.zweck?.label ?? ''}
                        </div>
                        <span
                          role="button"
                          onClick={e => {
                            e.stopPropagation();
                            crud.logbuch.openEdit(trip);
                          }}
                          className="text-xs text-primary font-medium px-2 py-1 rounded-md hover:bg-primary/10 shrink-0"
                        >
                          {tx('Beenden')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent trips table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <IconChartBar size={16} className="text-muted-foreground shrink-0" />
                <h2 className="font-semibold text-foreground text-sm">{tx('Letzte Ausfahrten')}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{tx('Logbuch')}</span>
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{tx('Boot')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{tx('Ruderer')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{tx('Start')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{tx('Ende')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">{tx('km')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{tx('Zweck')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentTrips.map(trip => {
                      const isActive = !trip.fields.endzeit;
                      return (
                        <tr
                          key={trip.record_id}
                          className="hover:bg-muted/40 cursor-pointer"
                          onClick={() => crud.logbuch.openDetail(trip)}
                        >
                          <td className="px-4 py-2.5 font-medium truncate max-w-[140px]">
                            {isActive && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1.5 align-middle" />}
                            {trip.bootName || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[160px]">
                            {(() => {
                              const ruderersRaw = Array.isArray(trip.fields.ruderer) ? trip.fields.ruderer : [];
                              const names = ruderersRaw
                                .map(url => {
                                  const id = extractRecordId(url);
                                  if (!id) return null;
                                  const m = mitgliederMap.get(id);
                                  return m ? `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim() : null;
                                })
                                .filter(Boolean) as string[];
                              const gastCount = trip.fields.gastruderer_anzahl ?? 0;
                              if (gastCount > 0) names.push(`+${gastCount} ${tx('Gast')}`);
                              return namen(names) || '—';
                            })()}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            {trip.fields.startzeit ? format(parseISO(trip.fields.startzeit), 'dd.MM. HH:mm') : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            {isActive
                              ? <span className="text-primary text-xs font-medium">{tx('Aktiv')}</span>
                              : (trip.fields.endzeit ? format(parseISO(trip.fields.endzeit), 'HH:mm') : '—')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">
                            {trip.fields.strecke_km != null ? `${trip.fields.strecke_km} km` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {trip.fields.zweck?.label ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {recentTrips.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          {tx('Noch keine Ausfahrten eingetragen.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {recentTrips.map(trip => {
                  const isActive = !trip.fields.endzeit;
                  const ruderersRaw = Array.isArray(trip.fields.ruderer) ? trip.fields.ruderer : [];
                  const names = ruderersRaw
                    .map(url => {
                      const id = extractRecordId(url);
                      if (!id) return null;
                      const m = mitgliederMap.get(id);
                      return m ? `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim() : null;
                    })
                    .filter(Boolean) as string[];
                  return (
                    <div
                      key={trip.record_id}
                      className="px-4 py-3 flex gap-3 hover:bg-muted/40 cursor-pointer"
                      onClick={() => crud.logbuch.openDetail(trip)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                          {isActive && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <span className="truncate">{trip.bootName || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {namen(names) || tx('Keine Ruderer')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {trip.fields.startzeit ? format(parseISO(trip.fields.startzeit), 'dd.MM.yy HH:mm') : '—'}
                          {trip.fields.strecke_km != null && ` · ${trip.fields.strecke_km} km`}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 self-center">
                        {isActive
                          ? <span className="text-primary font-medium">{tx('Aktiv')}</span>
                          : (trip.fields.zweck?.label ?? '')}
                      </div>
                    </div>
                  );
                })}
                {recentTrips.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {tx('Noch keine Ausfahrten eingetragen.')}
                  </div>
                )}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartWidget
                title={tx('km pro Ruderer — dieses Jahr')}
                rows={memberKmRows}
                dimension={{
                  kind: 'category',
                  accessor: r => {
                    const urls = Array.isArray(r.data.fields.ruderer) ? r.data.fields.ruderer : [];
                    if (urls.length === 0) return null;
                    const names = urls
                      .map((url: string) => {
                        const id = extractRecordId(url);
                        if (!id) return null;
                        const m = mitgliederMap.get(id);
                        return m ? `${m.fields.vorname ?? ''} ${m.fields.nachname ?? ''}`.trim() : null;
                      })
                      .filter(Boolean);
                    return names;
                  },
                }}
                measure={{
                  aggregate: 'sum',
                  label: tx('km'),
                  value: r => r.data.fields.strecke_km ?? null,
                  format: 'number',
                }}
                interaction={{
                  mode: 'filter',
                  selectedKey: memberChartFilter?.key ?? null,
                  onSelect: setMemberChartFilter,
                }}
              />
              <ChartWidget
                title={tx('km pro Boot — dieses Jahr')}
                rows={boatKmRows}
                dimension={{
                  kind: 'category',
                  accessor: r => {
                    const id = extractRecordId(r.data.fields.boot);
                    if (!id) return null;
                    const b = booteMap.get(id);
                    return b?.fields.name ?? null;
                  },
                }}
                measure={{
                  aggregate: 'sum',
                  label: tx('km'),
                  value: r => r.data.fields.strecke_km ?? null,
                  format: 'number',
                }}
              />
            </div>
          </div>
        }
        aside={
          <>
            {/* Damage reports work list */}
            <WorkList
              title={tx('Offene Meldungen')}
              items={openSchaeden.map(s => {
                const logEntry = (() => {
                  const id = extractRecordId(s.fields.ausfahrt);
                  return id ? logbuchMap.get(id) : undefined;
                })();
                const bootId = logEntry ? extractRecordId(logEntry.fields.boot) : null;
                const bootName = bootId ? booteMap.get(bootId)?.fields.name : undefined;
                const schweregrad = lookupKey(s.fields.schweregrad);
                return {
                  id: s.record_id,
                  title: s.fields.titel ?? tx('Unbekannte Meldung'),
                  secondLine: (
                    <>
                      <span className={
                        schweregrad === 'hoch'
                          ? 'font-medium text-destructive'
                          : schweregrad === 'mittel'
                          ? 'font-medium text-amber-600'
                          : 'text-muted-foreground'
                      }>
                        {s.fields.schweregrad?.label ?? s.fields.meldungstyp?.label ?? ''}
                      </span>
                      {bootName && (
                        <span className="text-muted-foreground"> · {bootName}</span>
                      )}
                    </>
                  ),
                  action: {
                    label: tx('Erledigt'),
                    onClick: () => markSchadenErledigt(s),
                  },
                };
              })}
              onItemClick={id => {
                const s = enrichedSchadensmeldungen.find(x => x.record_id === id);
                if (s) crud.schadensmeldungen.openDetail(s);
              }}
              empty={{
                text: tx('Keine offenen Meldungen — alles in Ordnung!'),
                action: {
                  label: tx('Meldung hinzufügen'),
                  onClick: () => crud.schadensmeldungen.openCreate({}),
                },
              }}
              max={6}
            />

            {/* Boat status list */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <IconAnchor size={16} className="text-muted-foreground shrink-0" />
                <h2 className="font-semibold text-foreground text-sm">{appLabel('boote')}</h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {availableBoote.length}/{boote.length} {tx('verfügbar')}
                </span>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {boote.map(boot => {
                  const status = lookupKey(boot.fields.boot_status);
                  const isActive = activeTrips.some(t => {
                    const id = extractRecordId(t.fields.boot);
                    return id === boot.record_id;
                  });
                  return (
                    <div
                      key={boot.record_id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 cursor-pointer"
                      onClick={() => crud.boote.openDetail(boot)}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? 'bg-primary animate-pulse' :
                        status === 'verfuegbar' ? 'bg-emerald-500' :
                        status === 'in_reparatur' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">
                          {boot.fields.name ?? tx('Unbenanntes Boot')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {boot.fields.bootstyp?.label ?? ''}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {isActive ? (
                          <span className="text-primary font-medium">{tx('unterwegs')}</span>
                        ) : (
                          boot.fields.boot_status?.label ?? ''
                        )}
                      </div>
                    </div>
                  );
                })}
                {boote.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                    {tx('Noch keine Boote eingetragen.')}
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <button
                  onClick={() => crud.logbuch.openCreate({ startzeit: format(clock, "yyyy-MM-dd'T'HH:mm") })}
                  className="w-full text-sm text-primary font-medium text-center hover:underline"
                >
                  + {tx('Neue Ausfahrt starten')}
                </button>
              </div>
            </div>
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
