import type { Schadensmeldungen, Logbuch } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface SchadensmeldungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schadensmeldungen | null;
  onEdit: (record: Schadensmeldungen) => void;
  logbuchList: Logbuch[];
}

export function SchadensmeldungenViewDialog({ open, onClose, record, onEdit, logbuchList }: SchadensmeldungenViewDialogProps) {
  function getLogbuchDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return logbuchList.find(r => r.record_id === id)?.fields.gastruderer_namen ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('schadensmeldungen') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'ausfahrt')}</Label>
            <p className="text-sm">{getLogbuchDisplayName(record.fields.ausfahrt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'meldungstyp')}</Label>
            <Badge variant="secondary">{lookupLabel('schadensmeldungen', 'meldungstyp', record.fields.meldungstyp?.key) ?? record.fields.meldungstyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'titel')}</Label>
            <p className="text-sm">{record.fields.titel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'beschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'schweregrad')}</Label>
            <Badge variant="secondary">{lookupLabel('schadensmeldungen', 'schweregrad', record.fields.schweregrad?.key) ?? record.fields.schweregrad?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'foto')}</Label>
            {record.fields.foto ? (
              <MediaThumbnail src={record.fields.foto} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'status_meldung')}</Label>
            <Badge variant="secondary">{lookupLabel('schadensmeldungen', 'status_meldung', record.fields.status_meldung?.key) ?? record.fields.status_meldung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'erledigt_am')}</Label>
            <p className="text-sm">{formatDate(record.fields.erledigt_am)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schadensmeldungen', 'bootswart_notiz')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bootswart_notiz ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.SCHADENSMELDUNGEN} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}