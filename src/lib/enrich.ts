import type { EnrichedLogbuch, EnrichedSchadensmeldungen } from '@/types/enriched';
import type { Boote, Logbuch, Mitglieder, Schadensmeldungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface LogbuchMaps {
  booteMap: Map<string, Boote>;
  mitgliederMap: Map<string, Mitglieder>;
}

export function enrichLogbuch(
  logbuch: Logbuch[],
  maps: LogbuchMaps
): EnrichedLogbuch[] {
  return logbuch.map(r => ({
    ...r,
    bootName: resolveDisplay(r.fields.boot, maps.booteMap, 'name'),
    rudererName: resolveDisplay(r.fields.ruderer, maps.mitgliederMap, 'vorname', 'nachname'),
    steuermannName: resolveDisplay(r.fields.steuermann, maps.mitgliederMap, 'vorname', 'nachname'),
  }));
}

interface SchadensmeldungenMaps {
  logbuchMap: Map<string, Logbuch>;
}

export function enrichSchadensmeldungen(
  schadensmeldungen: Schadensmeldungen[],
  maps: SchadensmeldungenMaps
): EnrichedSchadensmeldungen[] {
  return schadensmeldungen.map(r => ({
    ...r,
    ausfahrtName: resolveDisplay(r.fields.ausfahrt, maps.logbuchMap, 'gastruderer_namen'),
  }));
}
