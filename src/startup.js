import './startup.css';

// A module-load or renderer failure must leave a usable page, including when
// WebGL is disabled by the browser or unavailable on the current device.
import('./main.js').catch(error => {
  console.error('SourceWorld could not start', error);
  const panel = document.createElement('main');
  panel.className = 'startup-error';
  const heading = document.createElement('h1');
  heading.textContent = 'SourceWorld could not start';
  const message = document.createElement('p');
  message.textContent = /webgl|graphics|context/i.test(String(error?.message))
    ? 'This browser could not start the 3D renderer. Check that WebGL and hardware acceleration are available, then try again.'
    : 'The world could not finish loading. Check your connection and try again.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', () => window.location.reload());
  const back = document.createElement('a');
  back.href = 'https://rootandrenderstudio.ca/work/sourceworld/';
  back.target = '_top';
  back.textContent = 'About SourceWorld';
  panel.append(heading, message, retry, back);
  document.querySelector('#app').replaceChildren(panel);
  heading.tabIndex = -1;
  heading.focus();
  if (window.parent !== window && new URLSearchParams(location.search).get('embed') === 'studio') {
    window.parent.postMessage({ type: 'rootrender:world-error', version: 1 }, 'https://rootandrenderstudio.ca');
  }
});
