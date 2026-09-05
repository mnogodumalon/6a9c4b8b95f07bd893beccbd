import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitglieder, Boote, Logbuch, Schadensmeldungen, Vereinskonfiguration } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
export function useDashboardData() {
  const [mitglieder, setMitglieder] = useState<Mitglieder[]>([]);
  const [boote, setBoote] = useState<Boote[]>([]);
  const [logbuch, setLogbuch] = useState<Logbuch[]>([]);
  const [schadensmeldungen, setSchadensmeldungen] = useState<Schadensmeldungen[]>([]);
  const [vereinskonfiguration, setVereinskonfiguration] = useState<Vereinskonfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitgliederData, booteData, logbuchData, schadensmeldungenData, vereinskonfigurationData] = await Promise.all([
        LivingAppsService.getMitglieder(),
        LivingAppsService.getBoote(),
        LivingAppsService.getLogbuch(),
        LivingAppsService.getSchadensmeldungen(),
        LivingAppsService.getVereinskonfiguration(),
      ]);
      setMitglieder(mitgliederData);
      setBoote(booteData);
      setLogbuch(logbuchData);
      setSchadensmeldungen(schadensmeldungenData);
      setVereinskonfiguration(vereinskonfigurationData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [mitgliederData, booteData, logbuchData, schadensmeldungenData, vereinskonfigurationData] = await Promise.all([
          LivingAppsService.getMitglieder(),
          LivingAppsService.getBoote(),
          LivingAppsService.getLogbuch(),
          LivingAppsService.getSchadensmeldungen(),
          LivingAppsService.getVereinskonfiguration(),
        ]);
        setMitglieder(mitgliederData);
        setBoote(booteData);
        setLogbuch(logbuchData);
        setSchadensmeldungen(schadensmeldungenData);
        setVereinskonfiguration(vereinskonfigurationData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, []);

  const mitgliederMap = useMemo(() => {
    const m = new Map<string, Mitglieder>();
    mitglieder.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitglieder]);

  const booteMap = useMemo(() => {
    const m = new Map<string, Boote>();
    boote.forEach(r => m.set(r.record_id, r));
    return m;
  }, [boote]);

  const logbuchMap = useMemo(() => {
    const m = new Map<string, Logbuch>();
    logbuch.forEach(r => m.set(r.record_id, r));
    return m;
  }, [logbuch]);

  return { mitglieder, setMitglieder, boote, setBoote, logbuch, setLogbuch, schadensmeldungen, setSchadensmeldungen, vereinskonfiguration, setVereinskonfiguration, loading, error, fetchAll, mitgliederMap, booteMap, logbuchMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;