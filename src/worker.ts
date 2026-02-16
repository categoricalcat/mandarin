import Fuse from 'fuse.js';
import type { Data, ItemObject } from './vite-env';
import { fromFetch } from 'rxjs/fetch';
import { mergeMap, mergeAll, map, toArray } from 'rxjs/operators';


const CACHE_AGE = 2592000; // 1 month

fromFetch('/cedict.json', {
  cache: 'force-cache',
  headers: {
    'Cache-Control': `max-age=${CACHE_AGE}`,
  },
}).pipe(
  mergeMap((r) => r.json() as Promise<Data>),
  mergeAll(),
  map(([hanzi, pinyin, def]) => ({
    hanzi,
    pinyin,
    def,
  })),
  toArray<ItemObject>(),
  map((d) => new Fuse<ItemObject>(d, {
    keys: ['hanzi', 'pinyin', 'def'],
    distance: 0,
    threshold: 0,
  })),
).subscribe((fuse) => {

  self.addEventListener('message', (e) => {
    const input = e.data as string;
    if (!input) return;

    const results = fuse.search(input);
    console.log(results);

    self.postMessage(
      results.map((r) => r.item),
    );
  });
});


