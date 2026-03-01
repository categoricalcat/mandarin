import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { HanziDataObject } from './vite-env';
import { fromFetch } from 'rxjs/fetch';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { of, from, forkJoin } from 'rxjs';

const CACHE_AGE = 2592000; // 1 month

const url = import.meta.env.DEV
  ? new URL('../dict.sqlite', import.meta.url).href
  : new URL('./dict.sqlite', import.meta.url).href;

const fetchDb$ = fromFetch(url, {
  cache: 'force-cache',
  headers: {
    'Cache-Control': `max-age=${CACHE_AGE}`,
  },
}).pipe(mergeMap((r) => r.arrayBuffer()));

const initSqlite$ = from(sqlite3InitModule());

forkJoin([initSqlite$, fetchDb$])
  .pipe(
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
      console.error(e);
      return of(e as Error);
    }),
  )
  .subscribe((db) => {
    if (db instanceof Error) {
      console.error(db);
      return;
    }

    self.addEventListener('message', (e) => {
      const input = e.data as string;
      if (!input) return;

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
            LIMIT 50
          `,
          bind: { $match: match },
          rowMode: 'object',
        }) as unknown as HanziDataObject[];

        self.postMessage(results);
      } catch (err) {
        console.error(err);
        self.postMessage([]);
      }
    });
  });
