// import assert from 'browser-assert';
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

function assert(
  value: unknown,
  message?: string | Error,
): asserts value;
function assert(
  value: unknown,
  message?: string | Error,
): asserts value is true {
  if (!value) {
    throw new Error(message?.toString() ?? 'Assertion failed');
  }
}

const target = document.getElementById('app');
assert(target, 'No element with id "app" found');

const app = mount(App, {
  target,
})

export default app;
