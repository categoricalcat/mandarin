import Fuse from 'fuse.js';
import type { Data, ItemObject } from './vite-env';
import { from } from 'rxjs';
import { mergeMap, mergeAll, map, toArray } from 'rxjs/operators';

const fuse = new Fuse<ItemObject>([], {
  keys: ['hanzi', 'pinyin', 'def'],
});

const data = from(fetch('/cedict.json')).pipe(
  mergeMap((r) => r.json() as Promise<Data>),
  mergeAll(),
  map(([hanzi, pinyin, def]) => ({
    hanzi,
    pinyin,
    def,
  })),
  toArray<ItemObject>(),
);

data.subscribe((d) => fuse.setCollection(d));

self.addEventListener('message', (e) => {
  self.postMessage(
    e.data ? fuse.search(e.data).map((r) => r.item) : [],
  );
});
