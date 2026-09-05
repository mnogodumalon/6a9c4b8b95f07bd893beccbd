/**
 * Ausfahrt starten — 3-Schritt-Wizard zum Anlegen einer neuen Logbuch-Ausfahrt.
 * Steps: 1) Boot wählen (nur verfügbare Boote) → 2) Besatzung & Details erfassen
 *        → 3) Zusammenfassung bestätigen & Ausfahrt anlegen.
 * Reads: boote (gefiltert auf boot_status = 'verfuegbar'), mitglieder (gefiltert auf status = 'aktiv').
 * Writes: logbuch (createLogbuchEntry).
 * Composes: IntentWizardShell, EntitySelectStep, StatusBadge.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { IconRowInsertBottom, IconUsers, IconAnchor, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Boote, Mitglieder } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { tx } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ZWECK_OPTIONS = LOOKUP_OPTIONS['logbuch']?.['zweck'] ?? [];
const ZWECK_MIT_ORT = ['regatta', 'trainingslager', 'wanderfahrt'];

export default function AusfahrtStartenPage() {
  const { boote, mitglieder, loading, error, fetchAll } = useDashboardData();

  // Wizard step
  const [step, setStep] = useState(1);

  // Step 1: selected boot
  const [selectedBoot, setSelectedBoot] = useState<Boote | null>(null);

  // Step 2: crew & details
  const [selectedRudererIds, setSelectedRudererIds] = useState<Set<string>>(new Set());
  const [steuermannId, setSteuermannId] = useState<string>('none');
  const [showSteuermann, setShowSteuermann] = useState(false);
  const [gastAnzahl, setGastAnzahl] = useState<string>('');
  const [gastNamen, setGastNamen] = useState('');
  const [zweckKey, setZweckKey] = useState<string>('none');
  const [veranstaltungsort, setVeranstaltungsort] = useState('');
  const [startzeit, setStartzeit] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Derived data — all hooks before any early returns
  const verfuegbareBoote = boote.filter(b => b.fields.boot_status?.key === 'verfuegbar');
  const aktiveMitglieder = mitglieder.filter(m => m.fields.status?.key === 'aktiv');

  const selectedRudererList = aktiveMitglieder.filter(m => selectedRudererIds.has(m.record_id));
  const selectedSteuermann = steuermannId !== 'none'
    ? aktiveMitglieder.find(m => m.record_id === steuermannId) ?? null
    : null;

  const zweckOption = ZWECK_OPTIONS.find(o => o.key === zweckKey);
  const showOrt = zweckKey !== 'none' && ZWECK_MIT_ORT.includes(zweckKey);
  const gastAnzahlNum = parseInt(gastAnzahl, 10);
  const showGastNamen = !isNaN(gastAnzahlNum) && gastAnzahlNum > 0;

  // Step 2 validation
  const step2Valid = selectedRudererIds.size >= 1 && zweckKey !== 'none';

  // Boot name helper
  const bootDisplayName = (b: Boote) =>
    [b.fields.name, b.fields.bootstyp?.label].filter(Boolean).join(' · ');

  const mitgliedName = (m: Mitglieder) =>
    [m.fields.vorname, m.fields.nachname].filter(Boolean).join(' ') || m.record_id;

  const handleSelectBoot = (id: string) => {
    const boot = verfuegbareBoote.find(b => b.record_id === id);
    if (!boot) return;
    setSelectedBoot(boot);
    // Auto-show steuermann if required
    setShowSteuermann(!!boot.fields.steuermann_erforderlich);
    setStep(2);
  };

  const toggleRuderer = (id: string) => {
    setSelectedRudererIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selectedBoot || !step2Valid) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const rudererUrls = Array.from(selectedRudererIds).map(id =>
        createRecordUrl(APP_IDS.MITGLIEDER, id)
      );
      await LivingAppsService.createLogbuchEntry({
        boot: createRecordUrl(APP_IDS.BOOTE, selectedBoot.record_id),
        startzeit,
        zweck: zweckKey,
        ruderer: rudererUrls.length > 0 ? rudererUrls : undefined,
        steuermann: steuermannId !== 'none' ? createRecordUrl(APP_IDS.MITGLIEDER, steuermannId) : undefined,
        gastruderer_anzahl: showGastNamen && !isNaN(gastAnzahlNum) ? gastAnzahlNum : undefined,
        gastruderer_namen: showGastNamen && gastNamen.trim() ? gastNamen.trim() : undefined,
        veranstaltungsort: showOrt && veranstaltungsort.trim() ? veranstaltungsort.trim() : undefined,
      });
      await fetchAll();
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : tx('Fehler beim Anlegen der Ausfahrt.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedBoot(null);
    setSelectedRudererIds(new Set());
    setSteuermannId('none');
    setShowSteuermann(false);
    setGastAnzahl('');
    setGastNamen('');
    setZweckKey('none');
    setVeranstaltungsort('');
    setStartzeit(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setSubmitError(null);
    setDone(false);
    setStep(1);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="rounded-full bg-emerald-100 p-5">
          <IconCheck size={40} className="text-emerald-600" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold">{tx('Ausfahrt gestartet!')}</h2>
          <p className="text-sm text-muted-foreground">
            {tx('Der Logbucheintrag wurde erfolgreich angelegt.')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleReset} variant="outline">
            {tx('Neue Ausfahrt starten')}
          </Button>
          <Button asChild>
            <a href="#/">{tx('Zurück zum Dashboard')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <IntentWizardShell
      title={tx('Ausfahrt starten')}
      subtitle={tx('Logbucheintrag in 3 Schritten anlegen')}
      steps={[
        { label: tx('Boot') },
        { label: tx('Besatzung') },
        { label: tx('Bestätigen') },
      ]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ── Step 1: Boot wählen ── */}
      {step === 1 && (
        <EntitySelectStep
          items={verfuegbareBoote.map(b => ({
            id: b.record_id,
            title: b.fields.name ?? tx('Unbenanntes Boot'),
            subtitle: [
              b.fields.bootstyp?.label,
              b.fields.max_ruderer?.label,
              b.fields.steuermann_erforderlich ? tx('Steuermann erforderlich') : null,
            ].filter(Boolean).join(' · '),
            status: b.fields.zustand
              ? { key: b.fields.zustand.key, label: b.fields.zustand.label }
              : undefined,
            icon: <IconAnchor size={20} className="text-primary" />,
          }))}
          onSelect={handleSelectBoot}
          searchPlaceholder={tx('Boot suchen …')}
          emptyText={tx('Kein Boot verfügbar')}
          emptyIcon={<IconAnchor size={32} className="text-muted-foreground" />}
        />
      )}

      {/* ── Step 2: Besatzung & Details ── */}
      {step === 2 && (
        selectedBoot ? (
          <div className="space-y-6">
            {/* Selected boot summary */}
            <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
              <IconAnchor size={20} className="text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{selectedBoot.fields.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[selectedBoot.fields.bootstyp?.label, selectedBoot.fields.max_ruderer?.label]
                    .filter(Boolean).join(' · ')}
                </p>
                {selectedBoot.fields.steuermann_erforderlich && (
                  <p className="text-xs text-amber-600 mt-1">{tx('Steuermann erforderlich')}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto shrink-0"
                onClick={() => setStep(1)}
              >
                {tx('Ändern')}
              </Button>
            </div>

            {/* Ruderer multi-select */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <IconUsers size={16} className="shrink-0" />
                {tx('Ruderer')}
                <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  {selectedRudererIds.size > 0
                    ? tx`${selectedRudererIds.size} gewählt`
                    : tx('mind. 1 erforderlich')}
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aktiveMitglieder.map(m => {
                  const selected = selectedRudererIds.has(m.record_id);
                  return (
                    <button
                      key={m.record_id}
                      type="button"
                      onClick={() => toggleRuderer(m.record_id)}
                      className={[
                        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card hover:bg-secondary',
                      ].join(' ')}
                    >
                      <span className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                      ].join(' ')}>
                        {selected && <IconCheck size={12} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{mitgliedName(m)}</span>
                        {m.fields.rollen && m.fields.rollen.length > 0 && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {m.fields.rollen.map(r => r.label).join(', ')}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {aktiveMitglieder.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {tx('Keine aktiven Mitglieder gefunden.')}
                </p>
              )}
            </div>

            {/* Steuermann — required if boot requires it, optional otherwise */}
            <div className="space-y-2">
              {!selectedBoot.fields.steuermann_erforderlich && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tx('Steuermann')}</span>
                  <span className="text-xs text-muted-foreground">{tx('(optional)')}</span>
                  {!showSteuermann && (
                    <button
                      type="button"
                      className="text-xs text-primary underline ml-1"
                      onClick={() => setShowSteuermann(true)}
                    >
                      {tx('hinzufügen')}
                    </button>
                  )}
                </div>
              )}
              {(selectedBoot.fields.steuermann_erforderlich || showSteuermann) && (
                <>
                  {selectedBoot.fields.steuermann_erforderlich && (
                    <label className="text-sm font-medium block">
                      {tx('Steuermann')} <span className="text-destructive">*</span>
                    </label>
                  )}
                  <Select value={steuermannId} onValueChange={setSteuermannId}>
                    <SelectTrigger>
                      <SelectValue placeholder={tx('Steuermann wählen …')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{tx('Kein Steuermann')}</SelectItem>
                      {aktiveMitglieder.map(m => (
                        <SelectItem key={m.record_id} value={m.record_id}>
                          {mitgliedName(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Gastruderer */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                {tx('Gastruderer')} <span className="text-muted-foreground text-xs font-normal">{tx('(optional)')}</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder={tx('Anzahl Gäste ohne Mitgliedschaft')}
                value={gastAnzahl}
                onChange={e => setGastAnzahl(e.target.value)}
              />
              {showGastNamen && (
                <Textarea
                  placeholder={tx('Namen der Gastruderer (optional)')}
                  value={gastNamen}
                  onChange={e => setGastNamen(e.target.value)}
                  rows={2}
                />
              )}
            </div>

            {/* Zweck */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                {tx('Zweck')} <span className="text-destructive">*</span>
              </label>
              <Select value={zweckKey} onValueChange={setZweckKey}>
                <SelectTrigger>
                  <SelectValue placeholder={tx('Zweck wählen …')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tx('Zweck wählen …')}</SelectItem>
                  {ZWECK_OPTIONS.map(o => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Veranstaltungsort — nur bei regatta/trainingslager/wanderfahrt */}
            {showOrt && (
              <div className="space-y-2">
                <label className="text-sm font-medium block">
                  {tx('Veranstaltungsort')} <span className="text-muted-foreground text-xs font-normal">{tx('(optional)')}</span>
                </label>
                <Input
                  placeholder={tx('Ort der Veranstaltung')}
                  value={veranstaltungsort}
                  onChange={e => setVeranstaltungsort(e.target.value)}
                />
              </div>
            )}

            {/* Startzeit */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">
                {tx('Startzeit')} <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={startzeit}
                onChange={e => setStartzeit(e.target.value)}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {tx('Zurück')}
              </Button>
              <Button
                disabled={!step2Valid}
                onClick={() => setStep(3)}
              >
                {tx('Weiter zur Bestätigung')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}

      {/* ── Step 3: Bestätigung ── */}
      {step === 3 && (
        selectedBoot && step2Valid ? (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card divide-y">
              {/* Boot */}
              <div className="flex items-start gap-3 p-4">
                <IconAnchor size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{tx('Boot')}</p>
                  <p className="font-medium truncate">{selectedBoot.fields.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedBoot.fields.bootstyp?.label, selectedBoot.fields.max_ruderer?.label]
                      .filter(Boolean).join(' · ')}
                  </p>
                  {selectedBoot.fields.zustand && (
                    <StatusBadge
                      statusKey={selectedBoot.fields.zustand.key}
                      label={selectedBoot.fields.zustand.label}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>

              {/* Startzeit */}
              <div className="flex items-start gap-3 p-4">
                <IconRowInsertBottom size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{tx('Startzeit')}</p>
                  <p className="font-medium">{startzeit.replace('T', ' ')}</p>
                </div>
              </div>

              {/* Zweck */}
              <div className="flex items-start gap-3 p-4">
                <IconRowInsertBottom size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{tx('Zweck')}</p>
                  <p className="font-medium">{zweckOption?.label ?? zweckKey}</p>
                  {showOrt && veranstaltungsort && (
                    <p className="text-sm text-muted-foreground">{veranstaltungsort}</p>
                  )}
                </div>
              </div>

              {/* Ruderer */}
              <div className="flex items-start gap-3 p-4">
                <IconUsers size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {tx`${selectedRudererIds.size} Ruderer`}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRudererList.map(m => (
                      <Badge key={m.record_id} variant="secondary" className="text-xs">
                        {mitgliedName(m)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Steuermann */}
              {selectedSteuermann && (
                <div className="flex items-start gap-3 p-4">
                  <IconUsers size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{tx('Steuermann')}</p>
                    <p className="font-medium">{mitgliedName(selectedSteuermann)}</p>
                  </div>
                </div>
              )}

              {/* Gäste */}
              {showGastNamen && (
                <div className="flex items-start gap-3 p-4">
                  <IconUsers size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{tx('Gastruderer')}</p>
                    <p className="font-medium">{tx`${gastAnzahlNum} Gast/Gäste`}</p>
                    {gastNamen && (
                      <p className="text-sm text-muted-foreground">{gastNamen}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-2">
                <IconAlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                {tx('Zurück')}
              </Button>
              <Button onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? tx('Wird angelegt …') : tx('Ausfahrt starten')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Bitte fülle zuerst die vorherigen Schritte aus.')}
            </p>
            <Button variant="outline" onClick={() => setStep(selectedBoot ? 2 : 1)}>
              {tx('Zurück')}
            </Button>
          </div>
        )
      )}
    </IntentWizardShell>
  );
}
