import type { Vereinskonfiguration } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface VereinskonfigurationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Vereinskonfiguration;
}

export function VereinskonfigurationDetails({
  record,
}: VereinskonfigurationDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinsname')} value={record.fields.vereinsname} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinskuerzel')} value={record.fields.vereinskuerzel} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'gruendungsjahr')} value={record.fields.gruendungsjahr} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinswebsite')} value={record.fields.vereinswebsite} format="url" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinsemail')} value={record.fields.vereinsemail} format="email" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'logo')} className="md:col-span-2">
          {record.fields.logo ? (
            <MediaThumbnail src={record.fields.logo as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('vereinskonfiguration', 'primaerfarbe')} value={record.fields.primaerfarbe} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'sekundaerfarbe')} value={record.fields.sekundaerfarbe} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinsmotto')} value={record.fields.vereinsmotto} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'bootshaus_name')} value={record.fields.bootshaus_name} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'bootshaus_adresse_strasse')} value={record.fields.bootshaus_adresse_strasse} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'bootshaus_adresse_hausnummer')} value={record.fields.bootshaus_adresse_hausnummer} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'bootshaus_adresse_plz')} value={record.fields.bootshaus_adresse_plz} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'bootshaus_adresse_ort')} value={record.fields.bootshaus_adresse_ort} format="text" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.VEREINSKONFIGURATION} recordId={record.record_id} />
    </>
  );
}
