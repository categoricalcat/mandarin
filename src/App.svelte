<script lang="ts">
  import { BehaviorSubject, fromEventPattern } from 'rxjs';
  import { debounceTime, map } from 'rxjs/operators';
  import type { HanziDataObject, Hanzi as HanziType } from './vite-env';
  import { numberToMark } from 'pinyin-utils';

  import { appState } from './lib/store.svelte';
  import Hanzi from './lib/Hanzi.svelte';

  import DictWorker from './worker?worker';
  import { onMount } from 'svelte';

  const getHanziVersion = (hz: HanziType, simp: boolean) =>
    hz.split(' ')[simp ? 1 : 0];

  const worker = new DictWorker();
  const input = new BehaviorSubject('fire');
  let simplified = $state(true);
  let items = $state<HanziDataObject[]>([]);

  const PAGE_SIZE = 5;
  let page = $state(1);

  const data = fromEventPattern<MessageEvent<HanziDataObject[]>>(
    (handler) => worker.addEventListener('message', handler),
    (handler) => worker.removeEventListener('message', handler),
  ).pipe(map((e) => e.data));

  let pagedItems = $derived(
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );

  onMount(() => {
    input.pipe(debounceTime(250)).subscribe((value) => {
      items = [];
      worker.postMessage(value);
    });

    const sub = data.subscribe((val) => {
      items = val || [];
      page = 1;
    });
    return () => sub.unsubscribe();
  });

  let selectedWord = $derived(
    appState.selected
      ? getHanziVersion(appState.selected.hanzi, simplified)
      : '',
  );

  function handleKeydown(e: KeyboardEvent) {
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    )
      return;

    if (e.key === '+' || e.key === '=') {
      if (page * PAGE_SIZE < items.length) {
        page++;
      }
    } else if (e.key === '-' || e.key === '_') {
      if (page > 1) {
        page--;
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="mx-auto max-w-[320px] p-4 pt-6 text-slate-50 flex flex-col gap-10">
  {#if appState.selected}
    <section
      class="mx-auto p-6 rounded flex flex-col gap-y-8 text-center mb-10 border border-neutral-700"
    >
      <div>
        <Hanzi chars={selectedWord} />
        汉字
        <span class="text-neutral-600 absolute ml-3 font-thin">Hàn Zi</span>
      </div>

      <div>
        <span class="text-xl mb-4">
          {numberToMark(appState.selected.pinyin)}
        </span>
        <br />
        拼音
        <span class="text-neutral-600 absolute ml-3 font-thin">Pīn Yin</span>
      </div>

      <div>
        <span class="text-xl mb-4">
          {appState.selected.def.replaceAll('/', ' — ')}
        </span>
        <br />
        定义
        <span class="text-neutral-600 absolute ml-3 font-thin">Definition</span>
      </div>
    </section>
  {/if}

  <label for="combobox" class="block text-2xl font-bold text-center mb-2">
    Type your 拼音
    <span class="text-neutral-600 absolute ml-3 font-thin">Pīn Yin</span>
  </label>
  <div class="relative mt-1">
    <input
      oninput={(e) => input.next(e.currentTarget.value)}
      value={input.value}
      id="combobox"
      type="text"
      class="w-full rounded-md border border-gray-300 bg-neutral-900 py-2 pl-3 pr-12 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
      role="combobox"
      aria-controls="options"
      aria-expanded={!!items.length}
    />

    <fieldset class="absolute">
      <input
        bind:checked={simplified}
        type="checkbox"
        name="simplified"
        id="simplified"
        class="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <label
        for="simplified"
        class="mt-1 text-neutral-600 text-sm absolute ml-2 font-thin"
        >Simplified?</label
      >
    </fieldset>
  </div>

  {#if items.length}
    <div>
      <div class="flex justify-around text-white">
        <button
          onclick={() => page--}
          disabled={page === 1}
          class="px-4 py-2 rounded-md bg-neutral-900 text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold"
        >
          -
        </button>
        <button
          onclick={() => page++}
          disabled={page * PAGE_SIZE >= items.length}
          class="px-4 py-2 rounded-md bg-neutral-900 text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-bold"
        >
          +
        </button>
      </div>

      <!-- current page / out of -->
      <div class="text-center text-neutral-600">
        {page} / {Math.ceil(items.length / PAGE_SIZE)}
      </div>
    </div>
  {/if}

  <ul class="flex flex-col gap-2">
    {#each pagedItems as item (item.hanzi + item.pinyin + item.def)}
      <li>
        <button
          type="button"
          onclick={() => {
            appState.selected = item;
            navigator.clipboard.writeText(
              getHanziVersion(item.hanzi, simplified),
            );
          }}
          class="select-text w-full hover:text-indigo-600 cursor-pointer hover:bg-neutral-900 p-2 rounded-md"
        >
          {@html getHanziVersion(item.hanzi, simplified).replaceAll(
            selectedWord,
            `<span class="text-indigo-600">${selectedWord}</span>`,
          )}

          <span class="text-neutral-400 ml-1 font-extralight">
            {numberToMark(item.pinyin)}
          </span>
          <p class="font-light">
            {item.def}
          </p>
        </button>
      </li>
    {/each}
  </ul>

  <section class="font-thin text-neutral-600 hover:text-neutral-400">
    <h3 class="tracking-wide leading-8">Instructions</h3>

    <p class="text-sm">
      In the input box, you can type Pīn Yin, Hàn Zi, or English. It will give
      you a list of options that matches best your input. When using Pīn Yin,
      you can use the tone marks (ā, á, ǎ, à, a) or the numbers (1, 2, 3, 4, 5).
      E.g. "zhong3" or "zhǒng". Once selected, a list of related words will
      appear below the input box.
    </p>
  </section>
</main>
