import { unlink } from 'fs';
import { from, map, mergeMap, toArray, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

const regex = /(.*)\s\[(.*)\]\s\/(.*)\//giu;

try {
  unlink('./public/cedict.json', () => { });
  unlink('./cedict.txt', () => { });
} catch (error) {
  console.error(error);
}

console.log('Fetching cedict.txt.gz');

fromFetch('https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz')
  .pipe(
    mergeMap(decompressResponseToString),
    tap((text) => Bun.write('./cedict.txt', text)),
    mergeMap((text) => text.split(/\r\n/g)),
    mergeMap((line) => Array.from(line.matchAll(regex))),
    map(([, word, pinyin, definition]) => [word, pinyin, definition]),
    toArray(),
    mergeMap((result) => Bun.write('./public/cedict.json', JSON.stringify(result)))
  )
  .subscribe({
    next: () => console.log('Successfully generated cedict.json'),
    error: (err) => console.error('Error processing:', err),
  });

function decompressResponseToString(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error('Failed to fetch cedict.txt.gz');
  }

  const decompressed = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(decompressed).text()
}