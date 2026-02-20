import { createWriteStream, unlinkSync } from 'fs';
import { filter, map, mergeMap, tap, toArray } from 'rxjs';
import gz from 'node-gzip';
import { fromFetch } from 'rxjs/fetch';

const regex = /(.*)\s\[(.*)\]\s\/(.*)\//giu;

try {
    unlinkSync('./public/cedict.json');
    unlinkSync('./cedict.txt');
} catch (e) {
    console.log(`Ignoring ${e}`);
}

const cedictText = createWriteStream('./cedict.txt');
const json = createWriteStream('./public/cedict.json');

fromFetch(
    'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
)
    .pipe(
        mergeMap((r) => r.arrayBuffer()),
        mergeMap((r) => gz.ungzip(r)),
        map((r) => r.toString()),
        tap((s) => cedictText.write(s)),
        tap(() => cedictText.close()),
        mergeMap((chunk) => chunk.split(/\r\n/g)),
        mergeMap((s) => s.matchAll(regex)),
        map(([, word, pinyin, definition]) => [word, pinyin, definition]),
        filter((a) => a.length > 0),
        toArray(),
        tap((xs) => json.write(JSON.stringify(xs))),
    )
    .subscribe({
        complete() {
            console.log('Process was processed');
            json.close();
        },
    });
