/**
 * Scroll `child` into view inside `container` only.
 *
 * `Element.scrollIntoView` walks every scrollable ancestor — including a
 * Dialog — so on mobile it jumps the modal and leaves a `position: fixed`
 * dropdown stuck at the top of the viewport.
 */
export function scrollChildIntoContainer(
  container: HTMLElement,
  child: HTMLElement,
): void {
  const c = container.getBoundingClientRect()
  const t = child.getBoundingClientRect()
  container.scrollTop += t.top - c.top - container.clientHeight / 2 + t.height / 2
}
