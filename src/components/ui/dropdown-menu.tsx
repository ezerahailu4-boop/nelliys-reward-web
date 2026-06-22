import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextType {
  open: boolean
  setOpen: (v: boolean) => void
}
const DropdownMenuContext = React.createContext<DropdownMenuContextType>({ open: false, setOpen: () => {} })

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({ children, asChild, className, ...props }: { children: React.ReactNode; asChild?: boolean; className?: string; [k: string]: any }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(!open) })
  }
  return (
    <button type="button" className={cn("inline-flex items-center justify-center", className)} onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ children, className, align = "start", ...props }: { children: React.ReactNode; className?: string; align?: string; sideOffset?: number; [k: string]: any }) {
  const { open } = React.useContext(DropdownMenuContext)
  if (!open) return null
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-white shadow-xl p-1",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [k: string]: any }) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn("relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)}
      onClick={() => { onClick?.(); setOpen(false) }}
      onKeyDown={(e) => { if (e.key === 'Enter') { onClick?.(); setOpen(false) } }}
      {...props}
    >
      {children}
    </div>
  )
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
