import Fuse from 'fuse.js';
import type { Data, ItemObject } from './vite-env';
import { fromFetch } from 'rxjs/fetch';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';


const CACHE_AGE = 2592000; // 1 month

const dataToObject = (data: Data): ItemObject[] => {
  return data.map(([hanzi, pinyin, def]) => ({
    hanzi,
    pinyin,
    def,
  }));
};

const url = import.meta.env.DEV
  ? new URL('../cedict.json', import.meta.url).href
  : new URL('./cedict.json', import.meta.url).href;

fromFetch(url, {
  cache: 'force-cache',
  headers: {
    'Cache-Control': `max-age=${CACHE_AGE}`,
  },
}).pipe(
  mergeMap((r) => r.json() as Promise<Data>),
  map(dataToObject),
  map((d) => new Fuse<ItemObject>(d, {
    keys: [
      { name: 'hanzi', weight: 3 },
      { name: 'pinyin', weight: 2 },
      { name: 'def', weight: 1 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    useExtendedSearch: true
  })),
  catchError((e) => {
    console.error(e);
    return of(e as Error);
  }),
).subscribe((fuse) => {
  if (fuse instanceof Error) {
    console.error(fuse);
    return;
  }

  self.addEventListener('message', (e) => {
    const input = e.data as string;
    if (!input) return;

    const results = fuse.search(input);

    self.postMessage(
      results.map((r) => r.item)
    );
  });
});


