<script lang="ts">
  import { numberToMark } from 'pinyin-utils';
  import { appState } from './store.svelte';

  let { items = [], simplified = true } = $props();

  let marks = $derived(
    items.slice(0, 100).map(({ hanzi, pinyin, def }) => [hanzi, pinyin, def]),
  );
</script>

{#if marks.length}
  <ul
    class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
    id="options"
    role="listbox"
  >
    {#each marks as [hanzi, pinyin, def] (hanzi)}
      <li
        class="relative py-2 pl-3 pr-9 text-gray-900 hover:bg-slate-200 cursor-pointer"
        id="option-0"
        role="option"
        aria-selected="false"
        tabindex="-1"
        onclick={() => {
          appState.selected = { hanzi, pinyin, def };
          marks = [];
        }}
        onkeypress={(e) => {
          if (e.key === 'Enter') appState.selected = { hanzi, pinyin, def };
        }}
      >
        <span class="block truncate"
          >{hanzi.split(' ')[simplified ? 1 : 0]} - {numberToMark(pinyin)} - {def}</span
        >
      </li>
    {/each}
  </ul>
{/if}
