const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const getFocusableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' &&
      (element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element === document.activeElement)
  );

export const keepFocusInside = (
  root: HTMLElement,
  event: KeyboardEvent
): void => {
  const focusable = getFocusableElements(root);

  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (!root.contains(active)) {
    event.preventDefault();
    first.focus();
    return;
  }

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

export const setElementInert = (
  element: HTMLElement | null,
  inert: boolean
): void => {
  if (!element) {
    return;
  }

  const target = element as HTMLElement & { inert?: boolean };
  target.inert = inert;

  if (inert) {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('aria-hidden');
  }
};
