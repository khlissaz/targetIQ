// Utility to inject inline CSS into a shadow root
export function injectInlineCssToShadowRoot(shadowRoot: ShadowRoot, cssText: string) {
  const style = document.createElement('style');
  style.textContent = cssText;
  shadowRoot.appendChild(style);
}
