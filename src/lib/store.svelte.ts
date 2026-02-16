import type { ItemObject } from '../vite-env';

export class GlobalState {
    selected = $state<ItemObject | null>(null);
}

export const appState = new GlobalState();
