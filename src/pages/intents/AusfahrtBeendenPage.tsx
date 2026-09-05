/**
 * Ausfahrt beenden — 2-Schritt-Wizard.
 * Steps: 1) Laufende Ausfahrt auswählen → 2) Rückgabe-Daten eintragen & bestätigen.
 * Reads: logbuch, booteMap, mitgliederMap. Writes: logbuch (updateLogbuchEntry),
 *        schadensmeldungen (createSchadensmeldungenEntry, falls Schaden gemeldet).
 * Composes: IntentWizardShell, EntitySelectStep.
 */
import { useState } from 'react';
import { format } from 'date-fns';
import {
  IconAnchor,
  IconAlertTriangle,
  IconCheck,
  IconRuler2,
  IconNote,
} from '@tabler/icons-react';
import { tx } from '@/i18n';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichLogbuch } from '@/lib/enrich';
import type { EnrichedLogbuch } from '@/types/enriched';
import { LOOKUP_OPTIONS, APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const MELDUNGSTYP_OPTIONS = LOOKUP_OPTIONS['schadensmeldungen']?.['meldungstyp'] ?? [];
const SCHWEREGRAD_OPTIONS = LOOKUP_OPTIONS['schadensmeldungen']?.['schweregrad'] ?? [];

export default function AusfahrtBeendenPage() {
  const { logbuch, booteMap, mitgliederMap, loading, error, fetchAll } = useDashboardData();

  const [step, setStep] = useState(1);
  const [selectedLogbuch, setSelectedLogbuch] = useState<EnrichedLogbuch | null>(null);

  // Step 2 form state
  const [endzeit, setEndzeit] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [streckeKm, setStreckeKm] = useState('');
  const [schadenGemeldet, setSchadenGemeldet] = useState(false);
  const [meldungstypKey, setMeldungstypKey] = useState(MELDUNGSTYP_OPTIONS[0]?.key ?? '');
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [schweregradKey, setSchweregradKey] = useState('');
  const [allgemeineNotizen, setAllgemeineNotizen] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Enrich logbuch entries
  const enrichedLogbuch = enrichLogbuch(logbuch, { booteMap, mitgliederMap });

  // Filter: only running Ausfahrten (endzeit is null/undefined)
  const laufendeAusfahrten = enrichedLogbuch.filter(
    (e) => e.fields.endzeit == null || e.fields.endzeit === ''
  );

  const handleSelectAusfahrt = (id: string) => {
    const found = laufendeAusfahrten.find((e) => e.record_id === id) ?? null;
    setSelectedLogbuch(found);
    if (found) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (!selectedLogbuch) return;

    const strecke = parseFloat(streckeKm);
    if (!endzeit) {
      setSubmitError(tx('Bitte gib eine Endzeit an.'));
      return;
    }
    if (!streckeKm || isNaN(strecke) || strecke <= 0) {
      setSubmitError(tx('Bitte gib eine gültige Strecke (> 0 km) an.'));
      return;
    }
    if (schadenGemeldet) {
      if (!meldungstypKey) {
        setSubmitError(tx('Bitte wähle einen Meldungstyp.'));
        return;
      }
      if (!titel.trim()) {
        setSubmitError(tx('Bitte gib einen Titel für die Schadensmeldung an.'));
        return;
      }
      if (!beschreibung.trim()) {
        setSubmitError(tx('Bitte beschreibe den Schaden.'));
        return;
      }
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await LivingAppsService.updateLogbuchEntry(selectedLogbuch.record_id, {
        endzeit,
        strecke_km: strecke,
        schaden_gemeldet: schadenGemeldet,
        allgemeine_notizen: allgemeineNotizen.trim() || undefined,
      });

      if (schadenGemeldet) {
        await LivingAppsService.createSchadensmeldungenEntry({
          ausfahrt: createRecordUrl(APP_IDS.LOGBUCH, selectedLogbuch.record_id),
          meldungstyp: meldungstypKey,
          titel: titel.trim(),
          beschreibung: beschreibung.trim(),
          schweregrad: schweregradKey || undefined,
          status_meldung: 'offen',
        });
      }

      await fetchAll();
      setDone(true);
    } catch {
      setSubmitError(tx('Fehler beim Speichern. Bitte versuche es erneut.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedLogbuch(null);
    setEndzeit(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setStreckeKm('');
    setSchadenGemeldet(false);
    setMeldungstypKey(MELDUNGSTYP_OPTIONS[0]?.key ?? '');
    setTitel('');
    setBeschreibung('');
    setSchweregradKey('');
    setAllgemeineNotizen('');
    setSubmitError(null);
    setDone(false);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <IconCheck size={36} className="text-emerald-600" stroke={2} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{tx('Ausfahrt erfolgreich beendet')}</h2>
          <p className="text-muted-foreground text-sm">
            {tx('Das Logbuch wurde aktualisiert.')}{schadenGemeldet ? ` ${tx('Die Schadensmeldung wurde angelegt.')}` : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleReset}>
            {tx('Weitere Ausfahrt beenden')}
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
      title={tx('Ausfahrt beenden')}
      subtitle={tx('Rückgabe und Logbucheintrag in 2 Schritten')}
      steps={[{ label: tx('Ausfahrt wählen') }, { label: tx('Rückgabe-Daten') }]}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* Step 1 — Ausfahrt auswählen */}
      {step === 1 && (
        <EntitySelectStep
          items={laufendeAusfahrten.map((e) => ({
            id: e.record_id,
            title: e.bootName || tx('Unbekanntes Boot'),
            subtitle: [
              e.fields.startzeit ? formatDate(e.fields.startzeit) : null,
              e.fields.zweck?.label ?? null,
              e.rudererName ? e.rudererName : null,
            ]
              .filter(Boolean)
              .join(' · '),
            icon: <IconAnchor size={20} className="text-primary" stroke={1.5} />,
          }))}
          onSelect={handleSelectAusfahrt}
          searchPlaceholder={tx('Boot oder Ruderer suchen …')}
          emptyText={tx('Keine laufenden Ausfahrten gefunden')}
          emptyIcon={<IconAnchor size={32} className="text-muted-foreground" stroke={1.5} />}
        />
      )}

      {/* Step 2 — Rückgabe-Daten eintragen */}
      {step === 2 && (
        selectedLogbuch ? (
          <div className="space-y-6">
            {/* Context card */}
            <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
              <IconAnchor size={24} className="text-primary shrink-0 mt-0.5" stroke={1.5} />
              <div className="min-w-0">
                <p className="font-medium truncate">{selectedLogbuch.bootName || tx('Boot')}</p>
                <p className="text-sm text-muted-foreground">
                  {tx('Gestartet')}: {selectedLogbuch.fields.startzeit ? formatDate(selectedLogbuch.fields.startzeit) : '—'}
                  {selectedLogbuch.fields.zweck?.label ? ` · ${selectedLogbuch.fields.zweck.label}` : ''}
                  {selectedLogbuch.rudererName ? ` · ${selectedLogbuch.rudererName}` : ''}
                </p>
              </div>
            </div>

            {/* Endzeit */}
            <div className="space-y-2">
              <Label htmlFor="endzeit" className="flex items-center gap-1.5">
                <IconAnchor size={15} stroke={1.5} />
                {tx('Endzeit')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endzeit"
                type="datetime-local"
                value={endzeit}
                onChange={(e) => setEndzeit(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Strecke */}
            <div className="space-y-2">
              <Label htmlFor="strecke_km" className="flex items-center gap-1.5">
                <IconRuler2 size={15} stroke={1.5} />
                {tx('Zurückgelegte Strecke (km)')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="strecke_km"
                type="number"
                min="0.1"
                step="0.1"
                placeholder={tx('z. B. 12.5')}
                value={streckeKm}
                onChange={(e) => setStreckeKm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Schaden gemeldet Toggle */}
            <div className="rounded-2xl border p-4 space-y-4">
              <button
                type="button"
                onClick={() => setSchadenGemeldet((v) => !v)}
                className={`flex items-center gap-3 w-full text-left rounded-xl p-3 transition-colors ${
                  schadenGemeldet
                    ? 'bg-destructive/10 border border-destructive/30'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <IconAlertTriangle
                  size={20}
                  stroke={1.5}
                  className={schadenGemeldet ? 'text-destructive shrink-0' : 'text-muted-foreground shrink-0'}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${schadenGemeldet ? 'text-destructive' : ''}`}>
                    {tx('Schaden melden')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {schadenGemeldet
                      ? tx('Schadensmeldung wird angelegt')
                      : tx('Kein Schaden aufgetreten')}
                  </p>
                </div>
                <span
                  className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative ${
                    schadenGemeldet ? 'bg-destructive' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      schadenGemeldet ? 'left-5' : 'left-1'
                    }`}
                  />
                </span>
              </button>

              {/* Schadens-Felder (nur wenn Schaden gemeldet) */}
              {schadenGemeldet && (
                <div className="space-y-4 pt-2">
                  {/* Meldungstyp */}
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {tx('Meldungstyp')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {MELDUNGSTYP_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setMeldungstypKey(opt.key)}
                          className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                            meldungstypKey === opt.key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:bg-secondary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Titel */}
                  <div className="space-y-2">
                    <Label htmlFor="schaden_titel" className="text-sm">
                      {tx('Kurze Beschreibung')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="schaden_titel"
                      type="text"
                      placeholder={tx('z. B. Riss im Dollbord, Steuerblatt verbogen')}
                      value={titel}
                      onChange={(e) => setTitel(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Beschreibung */}
                  <div className="space-y-2">
                    <Label htmlFor="schaden_beschreibung" className="text-sm">
                      {tx('Detailbeschreibung')} <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="schaden_beschreibung"
                      placeholder={tx('Wo genau? Wie ist es passiert?')}
                      value={beschreibung}
                      onChange={(e) => setBeschreibung(e.target.value)}
                      rows={3}
                      className="w-full resize-none"
                    />
                  </div>

                  {/* Schweregrad */}
                  <div className="space-y-2">
                    <Label className="text-sm">{tx('Schweregrad')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {SCHWEREGRAD_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setSchweregradKey((prev) => (prev === opt.key ? '' : opt.key))
                          }
                          className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                            schweregradKey === opt.key
                              ? opt.key === 'hoch'
                                ? 'bg-red-600 text-white border-red-600'
                                : opt.key === 'mittel'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-card border-border hover:bg-secondary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Allgemeine Notizen */}
            <div className="space-y-2">
              <Label htmlFor="allgemeine_notizen" className="flex items-center gap-1.5">
                <IconNote size={15} stroke={1.5} />
                {tx('Allgemeine Notizen')}
                <span className="text-xs text-muted-foreground ml-1">({tx('optional')})</span>
              </Label>
              <Textarea
                id="allgemeine_notizen"
                placeholder={tx('Besonderheiten, Beobachtungen, …')}
                value={allgemeineNotizen}
                onChange={(e) => setAllgemeineNotizen(e.target.value)}
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3">
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="sm:w-auto w-full"
              >
                {tx('Zurück')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting || !endzeit || !streckeKm}
                className="sm:flex-1 w-full"
              >
                {submitting ? tx('Wird gespeichert …') : tx('Ausfahrt abschliessen')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">
              {tx('Dieser Schritt benötigt eine ausgewählte Ausfahrt.')}
            </p>
            <Button variant="outline" onClick={() => setStep(1)}>
              {tx('Neu starten')}
            </Button>
          </div>
        )
      )}
    </IntentWizardShell>
  );
}
