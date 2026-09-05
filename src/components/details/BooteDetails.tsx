import type { Boote, Logbuch } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface BooteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Boote;
  /** 1:N „Logbuch" (boot): VOLLE Liste — der Block filtert auf diesen Record. */
  logbuchList: Logbuch[];
  /** Zeilen-Klick → overlay.push auf das Logbuch-Detail (nie der Edit-Dialog). */
  onOpenLogbuch: (record: Logbuch) => void;
  /** Kontextuelles „+": öffnet den Logbuch-Dialog mit diesem Record vorgesetzt. */
  onAddLogbuch: () => void;
}

export function BooteDetails({
  record,
  logbuchList,
  onOpenLogbuch,
  onAddLogbuch,
}: BooteDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('boote', 'name')} value={record.fields.name} format="text" />
        <RecordField label={fieldLabel('boote', 'bootstyp')} value={record.fields.bootstyp} format="pill" />
        <RecordField label={fieldLabel('boote', 'max_ruderer')} value={record.fields.max_ruderer} format="pill" />
        <RecordField label={fieldLabel('boote', 'steuermann_erforderlich')} value={record.fields.steuermann_erforderlich} format="bool" />
        <RecordField label={fieldLabel('boote', 'baujahr')} value={record.fields.baujahr} format="text" />
        <RecordField label={fieldLabel('boote', 'hersteller')} value={record.fields.hersteller} format="text" />
        <RecordField label={fieldLabel('boote', 'zustand')} value={record.fields.zustand} format="pill" />
        <RecordField label={fieldLabel('boote', 'boot_status')} value={record.fields.boot_status} format="pill" />
        <RecordField label={fieldLabel('boote', 'lagerplatz')} value={record.fields.lagerplatz} format="text" />
        <RecordField label={fieldLabel('boote', 'notizen_boot')} value={record.fields.notizen_boot} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('logbuch')}
        items={logbuchList.filter(r => extractRecordId(r.fields.boot) === record.record_id)}
        map={r => ({ name: r.fields.veranstaltungsort ?? appLabel('logbuch'), meta: r.fields.startzeit })}
        onOpen={onOpenLogbuch}
        onAdd={onAddLogbuch}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BOOTE} recordId={record.record_id} />
    </>
  );
}
