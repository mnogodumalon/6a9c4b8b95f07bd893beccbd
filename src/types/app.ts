import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Mitglieder {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    mitgliedsnummer?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    email?: string;
    telefon?: string;
    eintrittsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    rollen?: LookupValue[];
    notizen_mitglied?: string;
  };
}

export interface Boote {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    bootstyp?: LookupValue;
    max_ruderer?: LookupValue;
    steuermann_erforderlich?: boolean;
    baujahr?: number;
    hersteller?: string;
    zustand?: LookupValue;
    boot_status?: LookupValue;
    lagerplatz?: string;
    notizen_boot?: string;
  };
}

export interface Logbuch {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    boot?: RecordUrl; // applookup -> URL zu 'Boote' Record
    startzeit?: string; // Format: YYYY-MM-DD oder ISO String
    zweck?: LookupValue;
    ruderer?: RecordUrl[];
    steuermann?: RecordUrl; // applookup -> URL zu 'Mitglieder' Record
    gastruderer_anzahl?: number;
    gastruderer_namen?: string;
    endzeit?: string; // Format: YYYY-MM-DD oder ISO String
    strecke_km?: number;
    veranstaltungsort?: string;
    schaden_gemeldet?: boolean;
    allgemeine_notizen?: string;
  };
}

export interface Schadensmeldungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    ausfahrt?: RecordUrl; // applookup -> URL zu 'Logbuch' Record
    meldungstyp?: LookupValue;
    titel?: string;
    beschreibung?: string;
    schweregrad?: LookupValue;
    foto?: string;
    status_meldung?: LookupValue;
    erledigt_am?: string; // Format: YYYY-MM-DD oder ISO String
    bootswart_notiz?: string;
  };
}

export interface Vereinskonfiguration {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vereinsname?: string;
    vereinskuerzel?: string;
    gruendungsjahr?: number;
    vereinswebsite?: string;
    vereinsemail?: string;
    logo?: string;
    primaerfarbe?: string;
    sekundaerfarbe?: string;
    vereinsmotto?: string;
    bootshaus_name?: string;
    bootshaus_adresse_strasse?: string;
    bootshaus_adresse_hausnummer?: string;
    bootshaus_adresse_plz?: string;
    bootshaus_adresse_ort?: string;
  };
}

export const APP_IDS = {
  MITGLIEDER: '6a9c4b63d28dc5bea78a8881',
  BOOTE: '6a9c4b6916b903d9a0d4816b',
  LOGBUCH: '6a9c4b6a026e7a4c02f93855',
  SCHADENSMELDUNGEN: '6a9c4b6bf9f4552fbbc0e06d',
  VEREINSKONFIGURATION: '6a9c4b6c2b88bee26559df31',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'mitglieder': {
    status: [{ key: "aktiv", get label() { return lookupLabel('mitglieder', 'status', "aktiv") ?? "Aktiv"; } }, { key: "inaktiv", get label() { return lookupLabel('mitglieder', 'status', "inaktiv") ?? "Inaktiv"; } }, { key: "pausiert", get label() { return lookupLabel('mitglieder', 'status', "pausiert") ?? "Pausiert"; } }],
    rollen: [{ key: "ruderer", get label() { return lookupLabel('mitglieder', 'rollen', "ruderer") ?? "Ruderer"; } }, { key: "steuermann", get label() { return lookupLabel('mitglieder', 'rollen', "steuermann") ?? "Steuermann"; } }, { key: "bootswart", get label() { return lookupLabel('mitglieder', 'rollen', "bootswart") ?? "Bootswart"; } }, { key: "trainer", get label() { return lookupLabel('mitglieder', 'rollen', "trainer") ?? "Trainer"; } }, { key: "administrator", get label() { return lookupLabel('mitglieder', 'rollen', "administrator") ?? "Administrator"; } }, { key: "vorstand", get label() { return lookupLabel('mitglieder', 'rollen', "vorstand") ?? "Vorstand"; } }],
  },
  'boote': {
    bootstyp: [{ key: "einer", get label() { return lookupLabel('boote', 'bootstyp', "einer") ?? "Einer (1x)"; } }, { key: "zweier_ohne", get label() { return lookupLabel('boote', 'bootstyp', "zweier_ohne") ?? "Zweier ohne Steuermann (2-)"; } }, { key: "zweier_mit", get label() { return lookupLabel('boote', 'bootstyp', "zweier_mit") ?? "Zweier mit Steuermann (2+)"; } }, { key: "doppelzweier", get label() { return lookupLabel('boote', 'bootstyp', "doppelzweier") ?? "Doppelzweier (2x)"; } }, { key: "vierer_ohne", get label() { return lookupLabel('boote', 'bootstyp', "vierer_ohne") ?? "Vierer ohne Steuermann (4-)"; } }, { key: "vierer_mit", get label() { return lookupLabel('boote', 'bootstyp', "vierer_mit") ?? "Vierer mit Steuermann (4+)"; } }, { key: "doppelvierer", get label() { return lookupLabel('boote', 'bootstyp', "doppelvierer") ?? "Doppelvierer (4x)"; } }, { key: "doppelvierer_mit", get label() { return lookupLabel('boote', 'bootstyp', "doppelvierer_mit") ?? "Doppelvierer mit Steuermann (4x+)"; } }, { key: "achter", get label() { return lookupLabel('boote', 'bootstyp', "achter") ?? "Achter (8+)"; } }, { key: "gig_zweier", get label() { return lookupLabel('boote', 'bootstyp', "gig_zweier") ?? "Gig-Zweier"; } }, { key: "gig_vierer", get label() { return lookupLabel('boote', 'bootstyp', "gig_vierer") ?? "Gig-Vierer"; } }, { key: "gig_achter", get label() { return lookupLabel('boote', 'bootstyp', "gig_achter") ?? "Gig-Achter"; } }, { key: "sonstiges", get label() { return lookupLabel('boote', 'bootstyp', "sonstiges") ?? "Sonstiges"; } }],
    max_ruderer: [{ key: "ruderer_1", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_1") ?? "1 Ruderer"; } }, { key: "ruderer_2", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_2") ?? "2 Ruderer"; } }, { key: "ruderer_3", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_3") ?? "3 Ruderer"; } }, { key: "ruderer_4", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_4") ?? "4 Ruderer"; } }, { key: "ruderer_5", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_5") ?? "5 Ruderer"; } }, { key: "ruderer_8", get label() { return lookupLabel('boote', 'max_ruderer', "ruderer_8") ?? "8 Ruderer"; } }],
    zustand: [{ key: "sehr_gut", get label() { return lookupLabel('boote', 'zustand', "sehr_gut") ?? "Sehr gut"; } }, { key: "gut", get label() { return lookupLabel('boote', 'zustand', "gut") ?? "Gut"; } }, { key: "befriedigend", get label() { return lookupLabel('boote', 'zustand', "befriedigend") ?? "Befriedigend"; } }, { key: "reparaturbeduertig", get label() { return lookupLabel('boote', 'zustand', "reparaturbeduertig") ?? "Reparaturbedürftig"; } }],
    boot_status: [{ key: "verfuegbar", get label() { return lookupLabel('boote', 'boot_status', "verfuegbar") ?? "Verfügbar"; } }, { key: "in_reparatur", get label() { return lookupLabel('boote', 'boot_status', "in_reparatur") ?? "In Reparatur"; } }, { key: "ausser_betrieb", get label() { return lookupLabel('boote', 'boot_status', "ausser_betrieb") ?? "Außer Betrieb"; } }, { key: "gesperrt", get label() { return lookupLabel('boote', 'boot_status', "gesperrt") ?? "Gesperrt"; } }],
  },
  'logbuch': {
    zweck: [{ key: "trainingsfahrt", get label() { return lookupLabel('logbuch', 'zweck', "trainingsfahrt") ?? "Trainingsfahrt"; } }, { key: "regatta", get label() { return lookupLabel('logbuch', 'zweck', "regatta") ?? "Regatta"; } }, { key: "trainingslager", get label() { return lookupLabel('logbuch', 'zweck', "trainingslager") ?? "Trainingslager"; } }, { key: "wanderfahrt", get label() { return lookupLabel('logbuch', 'zweck', "wanderfahrt") ?? "Wanderfahrt"; } }, { key: "vereinsfahrt", get label() { return lookupLabel('logbuch', 'zweck', "vereinsfahrt") ?? "Vereinsfahrt"; } }, { key: "probefahrt", get label() { return lookupLabel('logbuch', 'zweck', "probefahrt") ?? "Probefahrt"; } }, { key: "sonstiges", get label() { return lookupLabel('logbuch', 'zweck', "sonstiges") ?? "Sonstiges"; } }],
  },
  'schadensmeldungen': {
    meldungstyp: [{ key: "bootsschaden", get label() { return lookupLabel('schadensmeldungen', 'meldungstyp', "bootsschaden") ?? "Bootsschaden"; } }, { key: "allgemeine_notiz", get label() { return lookupLabel('schadensmeldungen', 'meldungstyp', "allgemeine_notiz") ?? "Allgemeine Notiz"; } }, { key: "sicherheitshinweis", get label() { return lookupLabel('schadensmeldungen', 'meldungstyp', "sicherheitshinweis") ?? "Sicherheitshinweis"; } }],
    schweregrad: [{ key: "gering", get label() { return lookupLabel('schadensmeldungen', 'schweregrad', "gering") ?? "Gering – Boot weiterhin nutzbar"; } }, { key: "mittel", get label() { return lookupLabel('schadensmeldungen', 'schweregrad', "mittel") ?? "Mittel – eingeschränkte Nutzung"; } }, { key: "hoch", get label() { return lookupLabel('schadensmeldungen', 'schweregrad', "hoch") ?? "Hoch – Boot nicht nutzbar"; } }],
    status_meldung: [{ key: "offen", get label() { return lookupLabel('schadensmeldungen', 'status_meldung', "offen") ?? "Offen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('schadensmeldungen', 'status_meldung', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "erledigt", get label() { return lookupLabel('schadensmeldungen', 'status_meldung', "erledigt") ?? "Erledigt"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitglieder': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'mitgliedsnummer': 'string/text',
    'geburtsdatum': 'date/date',
    'email': 'string/email',
    'telefon': 'string/tel',
    'eintrittsdatum': 'date/date',
    'status': 'lookup/select',
    'rollen': 'multiplelookup/checkbox',
    'notizen_mitglied': 'string/textarea',
  },
  'boote': {
    'name': 'string/text',
    'bootstyp': 'lookup/select',
    'max_ruderer': 'lookup/select',
    'steuermann_erforderlich': 'bool',
    'baujahr': 'number',
    'hersteller': 'string/text',
    'zustand': 'lookup/select',
    'boot_status': 'lookup/select',
    'lagerplatz': 'string/text',
    'notizen_boot': 'string/textarea',
  },
  'logbuch': {
    'boot': 'applookup/select',
    'startzeit': 'date/datetimeminute',
    'zweck': 'lookup/select',
    'ruderer': 'multipleapplookup/select',
    'steuermann': 'applookup/select',
    'gastruderer_anzahl': 'number',
    'gastruderer_namen': 'string/textarea',
    'endzeit': 'date/datetimeminute',
    'strecke_km': 'number',
    'veranstaltungsort': 'string/text',
    'schaden_gemeldet': 'bool',
    'allgemeine_notizen': 'string/textarea',
  },
  'schadensmeldungen': {
    'ausfahrt': 'applookup/select',
    'meldungstyp': 'lookup/radio',
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'schweregrad': 'lookup/radio',
    'foto': 'file',
    'status_meldung': 'lookup/select',
    'erledigt_am': 'date/date',
    'bootswart_notiz': 'string/textarea',
  },
  'vereinskonfiguration': {
    'vereinsname': 'string/text',
    'vereinskuerzel': 'string/text',
    'gruendungsjahr': 'number',
    'vereinswebsite': 'string/url',
    'vereinsemail': 'string/email',
    'logo': 'file',
    'primaerfarbe': 'string/text',
    'sekundaerfarbe': 'string/text',
    'vereinsmotto': 'string/text',
    'bootshaus_name': 'string/text',
    'bootshaus_adresse_strasse': 'string/text',
    'bootshaus_adresse_hausnummer': 'string/text',
    'bootshaus_adresse_plz': 'string/text',
    'bootshaus_adresse_ort': 'string/text',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitglieder = StripLookup<Mitglieder['fields']>;
export type CreateBoote = StripLookup<Boote['fields']>;
export type CreateLogbuch = StripLookup<Logbuch['fields']>;
export type CreateSchadensmeldungen = StripLookup<Schadensmeldungen['fields']>;
export type CreateVereinskonfiguration = StripLookup<Vereinskonfiguration['fields']>;