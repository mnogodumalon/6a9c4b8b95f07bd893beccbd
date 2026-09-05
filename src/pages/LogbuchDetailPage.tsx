import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Logbuch, Boote, Mitglieder } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { LogbuchDialog } from '@/components/dialogs/LogbuchDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Logbuch';
import { evalComputed } from '@/config/form-enhancements/types';
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

export default function LogbuchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Logbuch | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [booteList, setBooteList] = useState<Boote[]>([]);
  const [mitgliederList, setMitgliederList] = useState<Mitglieder[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, booteData, mitgliederData] = await Promise.all([
        LivingAppsService.getLogbuch(),
        LivingAppsService.getBoote(),
        LivingAppsService.getMitglieder(),
      ]);
      setBooteList(booteData);
      setMitgliederList(mitgliederData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Logbuch['fields']) {
    if (!record) return;
    await LivingAppsService.updateLogbuchEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteLogbuchEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/logbuch');
  }

  function getBooteDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return booteList.find(r => r.record_id === refId)?.fields.name ?? '—';
  }

  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === refId)?.fields.vorname ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/logbuch')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/logbuch')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.veranstaltungsort ?? appLabel('logbuch')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          boot: booteList,
          ruderer: mitgliederList,
          steuermann: mitgliederList,
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
        <RecordField label={fieldLabel('logbuch', 'boot')} value={getBooteDisplayName(record.fields.boot)} format="text" />
        <RecordField label={fieldLabel('logbuch', 'startzeit')} value={record.fields.startzeit} format="datetime" />
        <RecordField label={fieldLabel('logbuch', 'zweck')} value={record.fields.zweck} format="pill" />
        <RecordField label={fieldLabel('logbuch', 'ruderer')} value={Array.isArray(record.fields.ruderer) ? record.fields.ruderer.map((u: unknown) => getMitgliederDisplayName(u)).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('logbuch', 'steuermann')} value={getMitgliederDisplayName(record.fields.steuermann)} format="text" />
        <RecordField label={fieldLabel('logbuch', 'gastruderer_anzahl')} value={record.fields.gastruderer_anzahl} format="text" />
        <RecordField label={fieldLabel('logbuch', 'gastruderer_namen')} value={record.fields.gastruderer_namen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('logbuch', 'endzeit')} value={record.fields.endzeit} format="datetime" />
        <RecordField label={fieldLabel('logbuch', 'strecke_km')} value={record.fields.strecke_km} format="text" />
        <RecordField label={fieldLabel('logbuch', 'veranstaltungsort')} value={record.fields.veranstaltungsort} format="text" />
        <RecordField label={fieldLabel('logbuch', 'schaden_gemeldet')} value={record.fields.schaden_gemeldet} format="bool" />
        <RecordField label={fieldLabel('logbuch', 'allgemeine_notizen')} value={record.fields.allgemeine_notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.LOGBUCH} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
        </Button>
      </div>

      <LogbuchDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        booteList={booteList}
        mitgliederList={mitgliederList}
        enablePhotoScan={AI_PHOTO_SCAN['Logbuch']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Logbuch']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('logbuch') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
