import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Schadensmeldungen, Logbuch } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { SchadensmeldungenDialog } from '@/components/dialogs/SchadensmeldungenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Schadensmeldungen';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function SchadensmeldungenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Schadensmeldungen | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logbuchList, setLogbuchList] = useState<Logbuch[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, logbuchData] = await Promise.all([
        LivingAppsService.getSchadensmeldungen(),
        LivingAppsService.getLogbuch(),
      ]);
      setLogbuchList(logbuchData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Schadensmeldungen['fields']) {
    if (!record) return;
    await LivingAppsService.updateSchadensmeldungenEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteSchadensmeldungenEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/schadensmeldungen');
  }

  function getLogbuchDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return logbuchList.find(r => r.record_id === refId)?.fields.gastruderer_namen ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/schadensmeldungen')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/schadensmeldungen')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.titel ?? appLabel('schadensmeldungen')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          ausfahrt: logbuchList,
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
        <RecordField label={fieldLabel('schadensmeldungen', 'ausfahrt')} value={getLogbuchDisplayName(record.fields.ausfahrt)} format="text" />
        <RecordField label={fieldLabel('schadensmeldungen', 'meldungstyp')} value={record.fields.meldungstyp} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('schadensmeldungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('schadensmeldungen', 'schweregrad')} value={record.fields.schweregrad} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'status_meldung')} value={record.fields.status_meldung} format="pill" />
        <RecordField label={fieldLabel('schadensmeldungen', 'erledigt_am')} value={record.fields.erledigt_am} format="date" />
        <RecordField label={fieldLabel('schadensmeldungen', 'bootswart_notiz')} value={record.fields.bootswart_notiz} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.SCHADENSMELDUNGEN} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <SchadensmeldungenDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        logbuchList={logbuchList}
        enablePhotoScan={AI_PHOTO_SCAN['Schadensmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schadensmeldungen']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('schadensmeldungen') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
