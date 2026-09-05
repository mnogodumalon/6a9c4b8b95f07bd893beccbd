import type { Logbuch, Schadensmeldungen } from './app';

export type EnrichedLogbuch = Logbuch & {
  bootName: string;
  rudererName: string;
  steuermannName: string;
};

export type EnrichedSchadensmeldungen = Schadensmeldungen & {
  ausfahrtName: string;
};
