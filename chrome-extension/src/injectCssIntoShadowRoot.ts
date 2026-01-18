// Utility to inject CSS into a ShadowRoot
export function injectCssIntoShadowRoot(shadowRoot: ShadowRoot, css: string) {
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  // Remove any previous injected style tags with a special marker to avoid duplicates
  styleTag.setAttribute('data-injected-theme', 'targetiq');
  const prev = shadowRoot.querySelector('style[data-injected-theme="targetiq"]');
  if (prev) prev.remove();
  shadowRoot.appendChild(styleTag);
}
