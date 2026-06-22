const ERROR_FIELD_SELECTOR = '[data-field-error="true"]';

type FocusableErrorField =
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

function isHTMLElement(element: Element): element is HTMLElement {
  return element instanceof HTMLElement;
}

function isFocusableErrorField(
  element: Element,
): element is FocusableErrorField {
  if (
    !(
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    )
  ) {
    return false;
  }

  return !element.disabled && element.offsetParent !== null;
}

function getScrollTarget(field: FocusableErrorField) {
  const container = field.closest("[data-field-container]");

  return container && isHTMLElement(container) ? container : field;
}

export function focusFirstFieldError(root: ParentNode = document) {
  const firstField = Array.from(
    root.querySelectorAll(ERROR_FIELD_SELECTOR),
  ).find(isFocusableErrorField);

  if (!firstField) return false;

  getScrollTarget(firstField).scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  firstField.focus({ preventScroll: true });

  if (firstField.dataset.fieldRole === "select") {
    firstField.dispatchEvent(
      new CustomEvent("open-select-listbox", { bubbles: true }),
    );
  }

  return true;
}

export function scheduleFocusFirstFieldError(root?: ParentNode | null) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      focusFirstFieldError(root ?? document);
    });
  });
}
