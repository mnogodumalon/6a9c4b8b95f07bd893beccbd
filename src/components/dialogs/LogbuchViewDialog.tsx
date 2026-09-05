import type { Logbuch, Boote, Mitglieder } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface LogbuchViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Logbuch | null;
  onEdit: (record: Logbuch) => void;
  booteList: Boote[];
  mitgliederList: Mitglieder[];
}

export function LogbuchViewDialog({ open, onClose, record, onEdit, booteList, mitgliederList }: LogbuchViewDialogProps) {
  function getBooteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return booteList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  function getMitgliederDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitgliederList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('logbuch') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'boot')}</Label>
            <p className="text-sm">{getBooteDisplayName(record.fields.boot)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'startzeit')}</Label>
            <p className="text-sm">{formatDate(record.fields.startzeit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'zweck')}</Label>
            <Badge variant="secondary">{lookupLabel('logbuch', 'zweck', record.fields.zweck?.key) ?? record.fields.zweck?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'ruderer')}</Label>
            {Array.isArray(record.fields.ruderer) && record.fields.ruderer.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {record.fields.ruderer.map((url: any, i: number) => (
                  <span key={i} className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getMitgliederDisplayName(url)}</span>
                ))}
              </div>
            ) : <p className="text-sm">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'steuermann')}</Label>
            <p className="text-sm">{getMitgliederDisplayName(record.fields.steuermann)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'gastruderer_anzahl')}</Label>
            <p className="text-sm">{record.fields.gastruderer_anzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'gastruderer_namen')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.gastruderer_namen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'endzeit')}</Label>
            <p className="text-sm">{formatDate(record.fields.endzeit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'strecke_km')}</Label>
            <p className="text-sm">{record.fields.strecke_km ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'veranstaltungsort')}</Label>
            <p className="text-sm">{record.fields.veranstaltungsort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'schaden_gemeldet')}</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.schaden_gemeldet ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.schaden_gemeldet ? t('yes') : t('no')}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('logbuch', 'allgemeine_notizen')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.allgemeine_notizen ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.LOGBUCH} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}