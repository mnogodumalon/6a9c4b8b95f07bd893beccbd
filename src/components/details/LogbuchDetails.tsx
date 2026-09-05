import type { Logbuch, Boote, Mitglieder, Schadensmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface LogbuchDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Logbuch;
  /** N:1-Ziel „Boote": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  booteList: Boote[];
  /** Klick auf die Boote-Relation → overlay.push auf dessen Detail. */
  onOpenBoote?: (record: Boote) => void;
  /** N:1-Ziel „Mitglieder": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  mitgliederList: Mitglieder[];
  /** Klick auf die Mitglieder-Relation → overlay.push auf dessen Detail. */
  onOpenMitglieder?: (record: Mitglieder) => void;
  /** 1:N „Schadensmeldungen" (ausfahrt): VOLLE Liste — der Block filtert auf diesen Record. */
  schadensmeldungenList: Schadensmeldungen[];
  /** Zeilen-Klick → overlay.push auf das Schadensmeldungen-Detail (nie der Edit-Dialog). */
  onOpenSchadensmeldungen: (record: Schadensmeldungen) => void;
  /** Kontextuelles „+": öffnet den Schadensmeldungen-Dialog mit diesem Record vorgesetzt. */
  onAddSchadensmeldungen: () => void;
}

export function LogbuchDetails({
  record,
  booteList,
  onOpenBoote,
  mitgliederList,
  onOpenMitglieder,
  schadensmeldungenList,
  onOpenSchadensmeldungen,
  onAddSchadensmeldungen,
}: LogbuchDetailsProps) {
  const bootTarget = booteList.find(r => r.record_id === extractRecordId(record.fields.boot));
  const steuermannTarget = mitgliederList.find(r => r.record_id === extractRecordId(record.fields.steuermann));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('logbuch', 'startzeit')} value={record.fields.startzeit} format="datetime" />
        <RecordField label={fieldLabel('logbuch', 'zweck')} value={record.fields.zweck} format="pill" />
        <RecordField label={fieldLabel('logbuch', 'ruderer')} value={Array.isArray(record.fields.ruderer) ? record.fields.ruderer.map((u: unknown) => mitgliederList.find(t => t.record_id === extractRecordId(u))?.fields.vorname ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('logbuch', 'gastruderer_anzahl')} value={record.fields.gastruderer_anzahl} format="text" />
        <RecordField label={fieldLabel('logbuch', 'gastruderer_namen')} value={record.fields.gastruderer_namen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('logbuch', 'endzeit')} value={record.fields.endzeit} format="datetime" />
        <RecordField label={fieldLabel('logbuch', 'strecke_km')} value={record.fields.strecke_km} format="text" />
        <RecordField label={fieldLabel('logbuch', 'veranstaltungsort')} value={record.fields.veranstaltungsort} format="text" />
        <RecordField label={fieldLabel('logbuch', 'schaden_gemeldet')} value={record.fields.schaden_gemeldet} format="bool" />
        <RecordField label={fieldLabel('logbuch', 'allgemeine_notizen')} value={record.fields.allgemeine_notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('logbuch', 'boot')}
          name={bootTarget?.fields.name ?? '—'}
          meta={[bootTarget?.fields.hersteller, bootTarget?.fields.lagerplatz].filter(Boolean).join(' · ') || undefined}
          onClick={bootTarget && onOpenBoote ? () => onOpenBoote!(bootTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('logbuch', 'steuermann')}
          name={steuermannTarget?.fields.vorname ?? '—'}
          meta={[steuermannTarget?.fields.email, steuermannTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={steuermannTarget && onOpenMitglieder ? () => onOpenMitglieder!(steuermannTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('schadensmeldungen')}
        items={schadensmeldungenList.filter(r => extractRecordId(r.fields.ausfahrt) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('schadensmeldungen'), meta: r.fields.erledigt_am })}
        onOpen={onOpenSchadensmeldungen}
        onAdd={onAddSchadensmeldungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.LOGBUCH} recordId={record.record_id} />
    </>
  );
}
