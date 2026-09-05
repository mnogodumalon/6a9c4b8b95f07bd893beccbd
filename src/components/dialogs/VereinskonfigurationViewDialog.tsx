import type { Vereinskonfiguration } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel } from '@/i18n';

interface VereinskonfigurationViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Vereinskonfiguration | null;
  onEdit: (record: Vereinskonfiguration) => void;
}

export function VereinskonfigurationViewDialog({ open, onClose, record, onEdit }: VereinskonfigurationViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('vereinskonfiguration') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'vereinsname')}</Label>
            <p className="text-sm">{record.fields.vereinsname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'vereinskuerzel')}</Label>
            <p className="text-sm">{record.fields.vereinskuerzel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'gruendungsjahr')}</Label>
            <p className="text-sm">{record.fields.gruendungsjahr ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'vereinswebsite')}</Label>
            <p className="text-sm">{record.fields.vereinswebsite ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'vereinsemail')}</Label>
            <p className="text-sm">{record.fields.vereinsemail ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'logo')}</Label>
            {record.fields.logo ? (
              <MediaThumbnail src={record.fields.logo} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'primaerfarbe')}</Label>
            <p className="text-sm">{record.fields.primaerfarbe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'sekundaerfarbe')}</Label>
            <p className="text-sm">{record.fields.sekundaerfarbe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'vereinsmotto')}</Label>
            <p className="text-sm">{record.fields.vereinsmotto ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'bootshaus_name')}</Label>
            <p className="text-sm">{record.fields.bootshaus_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'bootshaus_adresse_strasse')}</Label>
            <p className="text-sm">{record.fields.bootshaus_adresse_strasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'bootshaus_adresse_hausnummer')}</Label>
            <p className="text-sm">{record.fields.bootshaus_adresse_hausnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'bootshaus_adresse_plz')}</Label>
            <p className="text-sm">{record.fields.bootshaus_adresse_plz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('vereinskonfiguration', 'bootshaus_adresse_ort')}</Label>
            <p className="text-sm">{record.fields.bootshaus_adresse_ort ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.VEREINSKONFIGURATION} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}