import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';
import { combineLatest, forkJoin, from, fromEvent, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, map, mergeMap } from 'rxjs/operators';
import type { HanziDataObject } from './vite-env';

const CACHE_AGE = 2592000; // 1 month

const url = import.meta.env.DEV
  ? new URL(/* @vite-ignore */ '../dict.sqlite', import.meta.url).href
  : new URL(/* @vite-ignore */ './dict.sqlite', import.meta.url).href;

const fetchDb$ = fromFetch(url, {
  cache: 'force-cache',
  headers: {
    'Cache-Control': `max-age=${CACHE_AGE}`,
  },
}).pipe(mergeMap((r) => r.arrayBuffer()));

const initSqlite$ = from(sqlite3InitModule());
const message$ = fromEvent<MessageEvent<string>>(self, 'message');

const db$ = forkJoin([initSqlite$, fetchDb$]).pipe(
  map(([sqlite3, arrayBuffer]) => {
    const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
    const db = new sqlite3.oo1.DB();
    const rc = sqlite3.capi.sqlite3_deserialize(
      db.pointer!,
      'main',
      p,
      arrayBuffer.byteLength,
      arrayBuffer.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE,
    );
    db.checkRc(rc);

    return db;
  }),
  catchError((e) => {
    return of(e as Error);
  }),
);

combineLatest([db$, message$]).subscribe(([db, message]) => {
  console.log({ db, message });
  if (db instanceof Error) {
    console.error(db);
    return;
  }

  const input = message.data as string;
  if (!input) return;

  const results = query(db, input);

  self.postMessage(results);
});

function query(db: Database, input: string) {
  const match = input
    .trim()
    .split(/\s+/)
    .map((x) => `"${x.replace(/"/g, '""')}*"`)
    .join(' AND ');

  try {
    const results = db.exec({
      sql: `
            SELECT simplified, traditional, pinyin, definition AS def
            FROM dictionary
            WHERE dictionary MATCH $match
            ORDER BY bm25(dictionary, 3.0, 3.0, 2.0, 1.0)
          `,
      bind: { $match: match },
      rowMode: 'object',
    }) as unknown as HanziDataObject[];

    return results;
  } catch (err) {
    console.error(err);
    return [];
  }
}
