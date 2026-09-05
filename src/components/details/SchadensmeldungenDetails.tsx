import type { Schadensmeldungen, Logbuch } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface SchadensmeldungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Schadensmeldungen;
  /** N:1-Ziel „Logbuch": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  logbuchList: Logbuch[];
  /** Klick auf die Logbuch-Relation → overlay.push auf dessen Detail. */
  onOpenLogbuch?: (record: Logbuch) => void;
}

export function SchadensmeldungenDetails({
  record,
  logbuchList,
  onOpenLogbuch,
}: SchadensmeldungenDetailsProps) {
  const ausfahrtTarget = logbuchList.find(r => r.record_id === extractRecordId(record.fields.ausfahrt));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('schadensmeldungen', 'meldungstyp')} value={record.fields.meldungstyp} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('schadensmeldungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('schadensmeldungen', 'schweregrad')} value={record.fields.schweregrad} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'foto')} className="md:col-span-2">
          {record.fields.foto ? (
            <MediaThumbnail src={record.fields.foto as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('schadensmeldungen', 'status_meldung')} value={record.fields.status_meldung} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'erledigt_am')} value={record.fields.erledigt_am} format="date" />
        <RecordField label={fieldLabel('schadensmeldungen', 'bootswart_notiz')} value={record.fields.bootswart_notiz} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('schadensmeldungen', 'ausfahrt')}
          name={ausfahrtTarget?.fields.gastruderer_namen ?? '—'}
          meta={[ausfahrtTarget?.fields.veranstaltungsort].filter(Boolean).join(' · ') || undefined}
          onClick={ausfahrtTarget && onOpenLogbuch ? () => onOpenLogbuch!(ausfahrtTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.SCHADENSMELDUNGEN} recordId={record.record_id} />
    </>
  );
}
