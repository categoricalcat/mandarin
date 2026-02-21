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

export type HanziData = [
  simplified: string,
  traditional: string,
  pinyin: string,
  definition: string,
];

export type DictionaryResponse = HanziData[];

export type HanziDataObject = {
  simplified: string;
  traditional: string;
  pinyin: string;
  def: string;
};
