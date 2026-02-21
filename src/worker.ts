import Fuse from 'fuse.js';
import type { DictionaryResponse, HanziDataObject } from './vite-env';
import { fromFetch } from 'rxjs/fetch';
import { mergeMap, mergeAll, map, toArray, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const CACHE_AGE = 2592000; // 1 month

const url = import.meta.env.DEV
  ? new URL('../cedict.json', import.meta.url).href
  : new URL('./cedict.json', import.meta.url).href;

fromFetch(url, {
  cache: 'force-cache',
  headers: {
    'Cache-Control': `max-age=${CACHE_AGE}`,
  },
})
  .pipe(
    mergeMap((r) => r.json() as Promise<DictionaryResponse>),
    mergeAll(),
    map(([simplified, traditional, pinyin, def]) => ({
      simplified,
      traditional,
      pinyin,
      def,
    })),
    toArray<HanziDataObject>(),
    map(
      (d) =>
        new Fuse<HanziDataObject>(d, {
          keys: ['simplified', 'traditional', 'pinyin', 'def'],
          distance: 0,
          threshold: 0,
        }),
    ),
    catchError((e) => {
      console.error(e);
      return of(new Fuse<HanziDataObject>([], {}));
    }),
  )
  .subscribe((fuse) => {
    self.addEventListener('message', (e) => {
      const input = e.data as string;
      if (!input) return;

      const results = fuse.search(input);
      console.log(results);

      self.postMessage(results.map((r) => r.item));
    });
  });
