import { unlinkSync } from 'fs';
import { map, mergeMap, toArray, tap, from } from 'rxjs';
import type { HanziData } from './src/vite-env';
// build.ts
import { Database } from 'bun:sqlite';

try {
  unlinkSync('cedict.txt');
  unlinkSync('public/dict.sqlite');
  unlinkSync('public/cedict.json');
} catch (e) {
  console.error(e);
  process.exit(1);
}

const regex = /(.*)\s\[(.*)\]\s\/(.*)\//giu;

const db = new Database('public/dict.sqlite', { create: true });

console.log(
  'Creating tables',
  db.run(`
  CREATE TABLE IF NOT EXISTS entries (
    rowid INTEGER PRIMARY KEY,
    simplified TEXT,
    traditional TEXT,
    pinyin TEXT,
    definition TEXT
  );
`),
  db.run(`
  CREATE VIRTUAL TABLE IF NOT EXISTS dictionary 
  USING fts5(
    simplified, traditional, pinyin, definition,
    content='entries',
    content_rowid='rowid',
    detail=column
  );
`),
);

const insert = db.prepare<unknown, DictionaryEntry>(`
  INSERT INTO entries (simplified, traditional, pinyin, definition) 
  VALUES ($simplified, $traditional, $pinyin, $definition)
`);

const insertData = db.transaction((entries: HanziData[]) => {
  for (const [$simplified, $traditional, $pinyin, $definition] of entries) {
    insert.run({
      $simplified,
      $traditional,
      $pinyin,
      $definition,
    });
  }
});

console.log('Fetching cedict.txt.gz');

const cedictFile = Bun.file('./cedict.txt');

const cedictSource = cedictFile
  .text()
  .catch(() =>
    fetch(
      'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
    ).then(decompressResponseToString),
  );

from(cedictSource)
  .pipe(
    tap((text) =>
      cedictFile.exists().then((exists) => {
        console.log('cedict.txt exists', exists);
        if (!exists) Bun.write('./cedict.txt', text);
      }),
    ),
    mergeMap((text) => text.split(/\r\n/g)),
    mergeMap((line) => Array.from(line.matchAll(regex))),
    map(([, word, pinyin, definition]): HanziData => {
      const [simplified, traditional] = word.split(' ');

      return [simplified, traditional, pinyin, definition];
    }),
    toArray(),
    tap((result) => insertData(result)),
    mergeMap((result) =>
      Bun.write('./public/cedict.json', JSON.stringify(result)),
    ),
  )
  .subscribe({
    complete: () => {
      console.log('Successfully generated cedict.json');
      console.log('Rebuilding FTS index...');
      db.run("INSERT INTO dictionary(dictionary) VALUES('rebuild')");
      console.log('Vacuuming database...');
      db.run('VACUUM');
      db.close();
      process.exit(0);
    },
    error: (err) => {
      console.error('Error processing: \n', err);
      db.close();
      process.exit(1);
    },
  });

function decompressResponseToString(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error('Failed to fetch cedict.txt.gz');
  }

  const decompressed = response.body.pipeThrough(
    new DecompressionStream('gzip'),
  );
  return new Response(decompressed).text();
}

type DictionaryEntry = {
  $simplified: string;
  $traditional: string;
  $pinyin: string;
  $definition: string;
};
