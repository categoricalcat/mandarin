// alert acknowledgement
if (
  typeof window !== 'undefined' &&
  localStorage.getItem('acknowledged') !== 'true'
) {
  const acknowledgement = confirm(
    'do you consent downloading the 9MB dictionary database?',
  );
  if (acknowledgement) {
    localStorage.setItem('acknowledged', 'true');
  } else {
    throw new Error('cannot download dictionary for dictionary application');
  }
}

// import assert from 'browser-assert';
import '@fontsource-variable/noto-sans-mono';
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

function assert(value: unknown, message?: string | Error): asserts value;
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
});

export default app;
