"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-wl-dark-grey/50 last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-[13px] font-semibold text-wl-white outline-none transition-colors duration-500 ease-out motion-reduce:transition-none hover:bg-black/25 focus-visible:ring-2 focus-visible:ring-wl-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#313a34]",
          "[&[data-state=open]]:bg-black/30",
          "[&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className="size-4 shrink-0 text-wl-white/80 transition-transform duration-500 ease-out motion-reduce:transition-none"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, style, ...props }, forwardedRef) {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const [contentHeightPx, setContentHeightPx] = React.useState(0)
  const cleanupObserversRef = React.useRef<(() => void) | null>(null)
  const forwardedRefRef = React.useRef(forwardedRef)
  forwardedRefRef.current = forwardedRef

  const setRootRef = React.useCallback((node: HTMLDivElement | null) => {
    const fr = forwardedRefRef.current
    if (typeof fr === "function") fr(node)
    else if (fr)
      (fr as React.MutableRefObject<HTMLDivElement | null>).current = node

    cleanupObserversRef.current?.()
    cleanupObserversRef.current = null

    if (!node) return

    const attach = (inner: HTMLDivElement) => {
      const sync = () => {
        const open = node.getAttribute("data-state") === "open"
        if (!open) {
          setContentHeightPx(0)
          return
        }
        setContentHeightPx(inner.scrollHeight)
      }

      sync()
      const mo = new MutationObserver(sync)
      mo.observe(node, { attributes: true, attributeFilter: ["data-state"] })
      const ro = new ResizeObserver(() => {
        queueMicrotask(sync)
      })
      ro.observe(inner)
      cleanupObserversRef.current = () => {
        mo.disconnect()
        ro.disconnect()
      }
    }

    const inner = innerRef.current
    if (inner) {
      attach(inner)
      return
    }

    const raf = requestAnimationFrame(() => {
      const innerLater = innerRef.current
      if (innerLater) attach(innerLater)
    })
    cleanupObserversRef.current = () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <AccordionPrimitive.Content
      {...props}
      ref={setRootRef}
      data-slot="accordion-content"
      style={
        {
          ...style,
          "--accordion-content-h": `${contentHeightPx}px`,
        } as React.CSSProperties
      }
      className={cn(
        "overflow-hidden",
        /* One height source only: mixing closed:h-0 with open:var(...) skips close transition (different winning rules). 0px via --accordion-content-h when closed. */
        "h-[var(--accordion-content-h,0px)] transition-[height] duration-500 ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
        "data-[state=closed]:pointer-events-none",
        className,
      )}
    >
      <div ref={innerRef} className="min-h-0">
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
