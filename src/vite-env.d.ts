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

export type DataItem = [
  hanzi: string,
  pinyin: string,
  definition: string,
];

export type Data = Array<DataItem>;

export type ItemObject = {
  hanzi: string;
  pinyin: string;
  def: string;
};
