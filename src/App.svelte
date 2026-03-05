<script lang="ts">
  import { numberToMark } from 'pinyin-utils';
  import { BehaviorSubject, fromEventPattern } from 'rxjs';
  import { debounceTime, map } from 'rxjs/operators';
  import { onMount } from 'svelte';
  import Hanzi from './lib/Hanzi.svelte';
  import { appState } from './lib/store.svelte';
  import type { HanziDataObject } from './vite-env';
  import DictWorker from './worker?worker';

  const PAGE_SIZE = 5;

  const worker = new DictWorker({
    name: 'dict-worker',
  });

  let page = $state(1);
  let simplified = $state(true);
  let items = $state<HanziDataObject[]>([]);
  const input = new BehaviorSubject('');
  const input$ = input.pipe(debounceTime(100));

  let pagedItems = $derived(
    items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  );

  const handleSimplified = (item: HanziDataObject, simp: boolean) =>
    simp ? item.simplified : item.traditional;

  let selectedWord = $derived(
    appState.selected ? handleSimplified(appState.selected, simplified) : '',
  );

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      if (page * PAGE_SIZE < items.length) {
        page++;
      }
      return;
    }

    if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      if (page > 1) {
        page--;
      }
      return;
    }

    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    )
      return;
  };

  const data = fromEventPattern<MessageEvent<HanziDataObject[]>>(
    (handler) => worker.addEventListener('message', handler),
    (handler) => worker.removeEventListener('message', handler),
  ).pipe(map((e) => e.data));

  onMount(() => {
    const subInput = input$.subscribe(worker.postMessage.bind(worker));

    const subData = data.subscribe((val) => {
      items = val || [];
      page = 1;
    });

    return () => {
      subInput.unsubscribe();
      subData.unsubscribe();
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="mx-auto flex max-w-[320px] flex-col gap-10 p-4 pt-6 text-slate-50">
  <h1 class="sr-only">Mandarin Dictionary</h1>
  {#if appState.selected}
    <section
      class="mx-auto mb-10 flex flex-col gap-y-8 rounded border border-neutral-700 p-6 text-center"
    >
      <div>
        <Hanzi chars={selectedWord} />
        汉字
        <span class="absolute ml-3 font-thin text-neutral-600">Hàn Zi</span>
      </div>

      <div>
        <span class="mb-4 text-xl">
          {numberToMark(appState.selected.pinyin)}
        </span>
        <br />
        拼音
        <span class="absolute ml-3 font-thin text-neutral-600">Pīn Yin</span>
      </div>

      <div>
        <span class="mb-4 text-xl">
          {appState.selected.def.replaceAll('/', ' — ')}
        </span>
        <br />
        定义
        <span class="absolute ml-3 font-thin text-neutral-600">Definition</span>
      </div>
    </section>
  {/if}

  <label for="combobox" class="mb-2 block text-center text-2xl font-bold">
    Type your 拼音
    <span class="absolute ml-3 font-thin text-neutral-600">Pīn Yin</span>
  </label>
  <fieldset class="relative mt-1">
    <!-- svelte-ignore a11y_autofocus -->
    <input
      oninput={(e) => input.next(e.currentTarget.value)}
      value={input.value}
      id="combobox"
      type="text"
      class="w-full rounded-md border border-gray-300 bg-neutral-900 py-2 pr-12 pl-3 shadow-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none sm:text-sm"
      role="combobox"
      aria-controls="options"
      aria-expanded={!!items.length}
      aria-autocomplete="list"
      autofocus
    />

    <div class="absolute">
      <input
        bind:checked={simplified}
        type="checkbox"
        name="simplified"
        id="simplified"
        class="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <label
        for="simplified"
        class="absolute mt-1 ml-2 text-sm font-thin text-neutral-600"
        >Simplified?</label
      >
    </div>
  </fieldset>

  {#if items.length}
    <div class="-mb-6">
      <!-- current page / out of -->
      <div class="text-center text-neutral-600">
        {page} / {Math.ceil(items.length / PAGE_SIZE)}
      </div>

      <div class="flex justify-center gap-2 text-white">
        <button
          onclick={() => page--}
          disabled={page === 1}
          aria-label="Previous page"
          class="cursor-pointer px-4 text-2xl font-bold text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          -
        </button>
        <button
          onclick={() => page++}
          disabled={page * PAGE_SIZE >= items.length}
          aria-label="Next page"
          class="cursor-pointer px-4 text-2xl font-bold text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  {/if}

  <ul class="flex flex-col gap-2" id="options" role="listbox">
    {#each pagedItems as item (item.simplified + item.pinyin + item.def)}
      <li
        role="option"
        aria-selected={appState.selected === item ? 'true' : 'false'}
      >
        <button
          type="button"
          onclick={() => {
            appState.selected = item;
            navigator.clipboard.writeText(handleSimplified(item, simplified));
          }}
          class="w-full cursor-pointer rounded-md p-2 select-text hover:bg-neutral-900 hover:text-indigo-600"
        >
          {#if selectedWord}
            {#each handleSimplified(item, simplified).split(selectedWord) as part, i (i)}
              {#if i > 0}
                <span class="text-indigo-600">{selectedWord}</span>
              {/if}
              {part}
            {/each}
          {:else}
            {handleSimplified(item, simplified)}
          {/if}

          <span class="ml-1 font-extralight text-neutral-400">
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
    <h2 class="text-lg leading-8 tracking-wide">Instructions</h2>

    <p class="text-sm">
      In the input box, you can type Pīn Yin, Hàn Zi, or English. It will give
      you a list of options that matches best your input. When using Pīn Yin,
      you can use the tone marks (ā, á, ǎ, à, a) or the numbers (1, 2, 3, 4, 5).
      E.g. "zhong3" or "zhǒng". Once selected, a list of related words will
      appear below the input box.
    </p>
  </section>
</main>
