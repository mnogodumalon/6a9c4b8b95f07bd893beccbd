import type { Mitglieder, Logbuch } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface MitgliederDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Mitglieder;
  /** 1:N „Logbuch" (ruderer): VOLLE Liste — der Block filtert auf diesen Record. */
  logbuchRudererList: Logbuch[];
  /** Zeilen-Klick → overlay.push auf das Logbuch-Detail (nie der Edit-Dialog). */
  onOpenLogbuchRuderer: (record: Logbuch) => void;
  /** Kontextuelles „+": öffnet den Logbuch-Dialog mit diesem Record vorgesetzt. */
  onAddLogbuchRuderer: () => void;
  /** 1:N „Logbuch" (steuermann): VOLLE Liste — der Block filtert auf diesen Record. */
  logbuchSteuermannList: Logbuch[];
  /** Zeilen-Klick → overlay.push auf das Logbuch-Detail (nie der Edit-Dialog). */
  onOpenLogbuchSteuermann: (record: Logbuch) => void;
  /** Kontextuelles „+": öffnet den Logbuch-Dialog mit diesem Record vorgesetzt. */
  onAddLogbuchSteuermann: () => void;
}

export function MitgliederDetails({
  record,
  logbuchRudererList,
  onOpenLogbuchRuderer,
  onAddLogbuchRuderer,
  logbuchSteuermannList,
  onOpenLogbuchSteuermann,
  onAddLogbuchSteuermann,
}: MitgliederDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('mitglieder', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'mitgliedsnummer')} value={record.fields.mitgliedsnummer} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'geburtsdatum')} value={record.fields.geburtsdatum} format="date" />
        <RecordField label={fieldLabel('mitglieder', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('mitglieder', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'eintrittsdatum')} value={record.fields.eintrittsdatum} format="date" />
        <RecordField label={fieldLabel('mitglieder', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('mitglieder', 'rollen')} value={Array.isArray(record.fields.rollen) ? record.fields.rollen.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('mitglieder', 'notizen_mitglied')} value={record.fields.notizen_mitglied} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('logbuch')} · ${fieldLabel('logbuch', 'ruderer')}`}
        items={logbuchRudererList.filter(r => Array.isArray(r.fields.ruderer) && r.fields.ruderer.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.veranstaltungsort ?? appLabel('logbuch'), meta: r.fields.startzeit })}
        onOpen={onOpenLogbuchRuderer}
        onAdd={onAddLogbuchRuderer}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('logbuch')} · ${fieldLabel('logbuch', 'steuermann')}`}
        items={logbuchSteuermannList.filter(r => extractRecordId(r.fields.steuermann) === record.record_id)}
        map={r => ({ name: r.fields.veranstaltungsort ?? appLabel('logbuch'), meta: r.fields.startzeit })}
        onOpen={onOpenLogbuchSteuermann}
        onAdd={onAddLogbuchSteuermann}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.MITGLIEDER} recordId={record.record_id} />
    </>
  );
}
