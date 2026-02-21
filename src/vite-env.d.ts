/// <reference types="svelte" />
/// <reference types="vite/client" />

declare global {
  declare module 'browser-assert' {
    export default function assert(
      condition: unknown,
      message?: string,
    ): asserts condition;
  }
}

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component<any>;
  export default component;
}

type Hanzi = `${string} ${string}`;

export type HanziData = [hanzi: Hanzi, pinyin: string, definition: string];

export type DictionaryResponse = HanziData[];

export type HanziDataObject = {
  hanzi: Hanzi;
  pinyin: string;
  def: string;
};
