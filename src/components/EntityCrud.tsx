/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'mitglieder'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.mitglieder.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.mitglieder.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.mitglieder.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.mitglieder              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   mitglieder: vorname, nachname, mitgliedsnummer, geburtsdatum, email, telefon, eintrittsdatum, status, …  ·  ← logbuch (list + contextual +) · ← logbuch (list + contextual +)
 *   boote: name, bootstyp, max_ruderer, steuermann_erforderlich, baujahr, hersteller, zustand, boot_status, …  ·  ← logbuch (list + contextual +)
 *   logbuch: boot, startzeit, zweck, ruderer, steuermann, gastruderer_anzahl, gastruderer_namen, endzeit, …  ·  → boote · → mitglieder · ← schadensmeldungen (list + contextual +)
 *   schadensmeldungen: ausfahrt, meldungstyp, titel, beschreibung, schweregrad, foto, status_meldung, erledigt_am, …  ·  → logbuch
 *   vereinskonfiguration: vereinsname, vereinskuerzel, gruendungsjahr, vereinswebsite, vereinsemail, logo, primaerfarbe, sekundaerfarbe, …
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Mitglieder, Boote, Logbuch, Schadensmeldungen, Vereinskonfiguration } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichLogbuch, enrichSchadensmeldungen } from '@/lib/enrich';
import type { EnrichedLogbuch, EnrichedSchadensmeldungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { MitgliederDialog, type MitgliederDialogDefaults } from '@/components/dialogs/MitgliederDialog';
import { MitgliederDetails } from '@/components/details/MitgliederDetails';
import { BooteDialog, type BooteDialogDefaults } from '@/components/dialogs/BooteDialog';
import { BooteDetails } from '@/components/details/BooteDetails';
import { LogbuchDialog, type LogbuchDialogDefaults } from '@/components/dialogs/LogbuchDialog';
import { LogbuchDetails } from '@/components/details/LogbuchDetails';
import { SchadensmeldungenDialog, type SchadensmeldungenDialogDefaults } from '@/components/dialogs/SchadensmeldungenDialog';
import { SchadensmeldungenDetails } from '@/components/details/SchadensmeldungenDetails';
import { VereinskonfigurationDialog, type VereinskonfigurationDialogDefaults } from '@/components/dialogs/VereinskonfigurationDialog';
import { VereinskonfigurationDetails } from '@/components/details/VereinskonfigurationDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'mitglieder'; record: Mitglieder }
  | { type: 'boote'; record: Boote }
  | { type: 'logbuch'; record: EnrichedLogbuch }
  | { type: 'schadensmeldungen'; record: EnrichedSchadensmeldungen }
  | { type: 'vereinskonfiguration'; record: Vereinskonfiguration };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  mitglieder: EntityCrudApi<Mitglieder, MitgliederDialogDefaults>;
  boote: EntityCrudApi<Boote, BooteDialogDefaults>;
  logbuch: EntityCrudApi<Logbuch, LogbuchDialogDefaults>;
  schadensmeldungen: EntityCrudApi<Schadensmeldungen, SchadensmeldungenDialogDefaults>;
  vereinskonfiguration: EntityCrudApi<Vereinskonfiguration, VereinskonfigurationDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { mitglieder: Mitglieder[]; boote: Boote[]; logbuch: EnrichedLogbuch[]; schadensmeldungen: EnrichedSchadensmeldungen[]; vereinskonfiguration: Vereinskonfiguration[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [mitgliederDialog, setMitgliederDialog] = useState<{ defaults?: MitgliederDialogDefaults; editing?: Mitglieder } | null>(null);
  const [booteDialog, setBooteDialog] = useState<{ defaults?: BooteDialogDefaults; editing?: Boote } | null>(null);
  const [logbuchDialog, setLogbuchDialog] = useState<{ defaults?: LogbuchDialogDefaults; editing?: Logbuch } | null>(null);
  const [schadensmeldungenDialog, setSchadensmeldungenDialog] = useState<{ defaults?: SchadensmeldungenDialogDefaults; editing?: Schadensmeldungen } | null>(null);
  const [vereinskonfigurationDialog, setVereinskonfigurationDialog] = useState<{ defaults?: VereinskonfigurationDialogDefaults; editing?: Vereinskonfiguration } | null>(null);
  const enrichedLogbuch = useMemo(() => enrichLogbuch(data.logbuch, { booteMap: data.booteMap, mitgliederMap: data.mitgliederMap }), [data.logbuch, data.booteMap, data.mitgliederMap]);
  const enrichedSchadensmeldungen = useMemo(() => enrichSchadensmeldungen(data.schadensmeldungen, { logbuchMap: data.logbuchMap }), [data.schadensmeldungen, data.logbuchMap]);

  function detailMitglieder(record: Mitglieder, push = false) {
    const item: OverlayItem = { type: 'mitglieder', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitMitglieder(fields: Mitglieder['fields']) {
    const editing = mitgliederDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setMitglieder(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateMitgliederEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('mitglieder')} — ${t('crud_updated')}`, async () => {
        data.setMitglieder(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateMitgliederEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createMitgliederEntry(fields);
      undoToast(`${appLabel('mitglieder')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBoote(record: Boote, push = false) {
    const item: OverlayItem = { type: 'boote', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBoote(fields: Boote['fields']) {
    const editing = booteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBoote(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBooteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('boote')} — ${t('crud_updated')}`, async () => {
        data.setBoote(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBooteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBooteEntry(fields);
      undoToast(`${appLabel('boote')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailLogbuch(record: Logbuch, push = false) {
    const rec = enrichedLogbuch.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'logbuch', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLogbuch(fields: Logbuch['fields']) {
    const editing = logbuchDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLogbuch(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLogbuchEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('logbuch')} — ${t('crud_updated')}`, async () => {
        data.setLogbuch(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLogbuchEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLogbuchEntry(fields);
      undoToast(`${appLabel('logbuch')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailSchadensmeldungen(record: Schadensmeldungen, push = false) {
    const rec = enrichedSchadensmeldungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'schadensmeldungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSchadensmeldungen(fields: Schadensmeldungen['fields']) {
    const editing = schadensmeldungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSchadensmeldungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSchadensmeldungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('schadensmeldungen')} — ${t('crud_updated')}`, async () => {
        data.setSchadensmeldungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSchadensmeldungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSchadensmeldungenEntry(fields);
      undoToast(`${appLabel('schadensmeldungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailVereinskonfiguration(record: Vereinskonfiguration, push = false) {
    const item: OverlayItem = { type: 'vereinskonfiguration', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVereinskonfiguration(fields: Vereinskonfiguration['fields']) {
    const editing = vereinskonfigurationDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVereinskonfiguration(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVereinskonfigurationEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('vereinskonfiguration')} — ${t('crud_updated')}`, async () => {
        data.setVereinskonfiguration(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVereinskonfigurationEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVereinskonfigurationEntry(fields);
      undoToast(`${appLabel('vereinskonfiguration')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <MitgliederDialog
        open={mitgliederDialog !== null}
        onClose={() => setMitgliederDialog(null)}
        onSubmit={submitMitglieder}
        defaultValues={mitgliederDialog?.defaults}
        recordId={mitgliederDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Mitglieder']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitglieder']}
      />
      <BooteDialog
        open={booteDialog !== null}
        onClose={() => setBooteDialog(null)}
        onSubmit={submitBoote}
        defaultValues={booteDialog?.defaults}
        recordId={booteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Boote']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Boote']}
      />
      <LogbuchDialog
        open={logbuchDialog !== null}
        onClose={() => setLogbuchDialog(null)}
        onSubmit={submitLogbuch}
        defaultValues={logbuchDialog?.defaults}
        recordId={logbuchDialog?.editing?.record_id}
        booteList={data.boote}
        mitgliederList={data.mitglieder}
        enablePhotoScan={AI_PHOTO_SCAN['Logbuch']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Logbuch']}
      />
      <SchadensmeldungenDialog
        open={schadensmeldungenDialog !== null}
        onClose={() => setSchadensmeldungenDialog(null)}
        onSubmit={submitSchadensmeldungen}
        defaultValues={schadensmeldungenDialog?.defaults}
        recordId={schadensmeldungenDialog?.editing?.record_id}
        logbuchList={data.logbuch}
        enablePhotoScan={AI_PHOTO_SCAN['Schadensmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schadensmeldungen']}
      />
      <VereinskonfigurationDialog
        open={vereinskonfigurationDialog !== null}
        onClose={() => setVereinskonfigurationDialog(null)}
        onSubmit={submitVereinskonfiguration}
        defaultValues={vereinskonfigurationDialog?.defaults}
        recordId={vereinskonfigurationDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Vereinskonfiguration']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vereinskonfiguration']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'mitglieder') {
            return (
              <>
                <RecordHeader title={top.record.fields.vorname ?? appLabel('mitglieder')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <MitgliederDetails
                  record={top.record}
                  logbuchRudererList={data.logbuch}
                  onOpenLogbuchRuderer={(r) => detailLogbuch(r, true)}
                  onAddLogbuchRuderer={() => setLogbuchDialog({ defaults: { ruderer: [createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id)] } })}
                  logbuchSteuermannList={data.logbuch}
                  onOpenLogbuchSteuermann={(r) => detailLogbuch(r, true)}
                  onAddLogbuchSteuermann={() => setLogbuchDialog({ defaults: { steuermann: createRecordUrl(APP_IDS.MITGLIEDER, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'boote') {
            return (
              <>
                <RecordHeader title={top.record.fields.name ?? appLabel('boote')} subtitle={undefined} />
                <BooteDetails
                  record={top.record}
                  logbuchList={data.logbuch}
                  onOpenLogbuch={(r) => detailLogbuch(r, true)}
                  onAddLogbuch={() => setLogbuchDialog({ defaults: { boot: createRecordUrl(APP_IDS.BOOTE, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'logbuch') {
            return (
              <>
                <RecordHeader title={top.record.fields.veranstaltungsort ?? appLabel('logbuch')} subtitle={top.record.fields.startzeit ? formatDate(top.record.fields.startzeit) : undefined} />
                <LogbuchDetails
                  record={top.record}
                  booteList={data.boote}
                  onOpenBoote={(r) => detailBoote(r, true)}
                  mitgliederList={data.mitglieder}
                  onOpenMitglieder={(r) => detailMitglieder(r, true)}
                  schadensmeldungenList={data.schadensmeldungen}
                  onOpenSchadensmeldungen={(r) => detailSchadensmeldungen(r, true)}
                  onAddSchadensmeldungen={() => setSchadensmeldungenDialog({ defaults: { ausfahrt: createRecordUrl(APP_IDS.LOGBUCH, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'schadensmeldungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('schadensmeldungen')} subtitle={top.record.fields.erledigt_am ? formatDate(top.record.fields.erledigt_am) : undefined} />
                <SchadensmeldungenDetails
                  record={top.record}
                  logbuchList={data.logbuch}
                  onOpenLogbuch={(r) => detailLogbuch(r, true)}
                />
              </>
            );
          }
          if (top.type === 'vereinskonfiguration') {
            return (
              <>
                <RecordHeader title={top.record.fields.vereinsname ?? appLabel('vereinskonfiguration')} subtitle={undefined} />
                <VereinskonfigurationDetails
                  record={top.record}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'mitglieder') setMitgliederDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'boote') setBooteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'logbuch') setLogbuchDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'schadensmeldungen') setSchadensmeldungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'vereinskonfiguration') setVereinskonfigurationDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    mitglieder: {
      openCreate: (defaults?: MitgliederDialogDefaults) => setMitgliederDialog({ defaults }),
      openEdit: (record: Mitglieder) => setMitgliederDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Mitglieder) => detailMitglieder(record, false),
    },
    boote: {
      openCreate: (defaults?: BooteDialogDefaults) => setBooteDialog({ defaults }),
      openEdit: (record: Boote) => setBooteDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Boote) => detailBoote(record, false),
    },
    logbuch: {
      openCreate: (defaults?: LogbuchDialogDefaults) => setLogbuchDialog({ defaults }),
      openEdit: (record: Logbuch) => setLogbuchDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Logbuch) => detailLogbuch(record, false),
    },
    schadensmeldungen: {
      openCreate: (defaults?: SchadensmeldungenDialogDefaults) => setSchadensmeldungenDialog({ defaults }),
      openEdit: (record: Schadensmeldungen) => setSchadensmeldungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Schadensmeldungen) => detailSchadensmeldungen(record, false),
    },
    vereinskonfiguration: {
      openCreate: (defaults?: VereinskonfigurationDialogDefaults) => setVereinskonfigurationDialog({ defaults }),
      openEdit: (record: Vereinskonfiguration) => setVereinskonfigurationDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Vereinskonfiguration) => detailVereinskonfiguration(record, false),
    },
    enriched: { mitglieder: data.mitglieder, boote: data.boote, logbuch: enrichedLogbuch, schadensmeldungen: enrichedSchadensmeldungen, vereinskonfiguration: data.vereinskonfiguration },
  };
}
