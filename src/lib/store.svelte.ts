import type { HanziDataObject } from '../vite-env';

export class GlobalState {
    selected = $state<HanziDataObject | null>(null);
}

export const appState = new GlobalState();
