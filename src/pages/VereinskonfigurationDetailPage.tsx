import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Vereinskonfiguration } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { VereinskonfigurationDialog } from '@/components/dialogs/VereinskonfigurationDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Vereinskonfiguration';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function VereinskonfigurationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Vereinskonfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const list = await LivingAppsService.getVereinskonfiguration();
      setRecord(list.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Vereinskonfiguration['fields']) {
    if (!record) return;
    await LivingAppsService.updateVereinskonfigurationEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteVereinskonfigurationEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/vereinskonfiguration');
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/vereinskonfiguration')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/vereinskonfiguration')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.vereinsname ?? appLabel('vereinskonfiguration')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinsname')} value={record.fields.vereinsname} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinskuerzel')} value={record.fields.vereinskuerzel} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'gruendungsjahr')} value={record.fields.gruendungsjahr} format="text" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinswebsite')} value={record.fields.vereinswebsite} format="url" />
        <RecordField label={fieldLabel('vereinskonfiguration', 'vereinsemail')} value={record.fields.vereinsemail} format="email" />
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

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <VereinskonfigurationDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Vereinskonfiguration']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Vereinskonfiguration']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('vereinskonfiguration') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
