"use client"

import * as React from "react"
import { cn } from "cn"
import { Select as SelectPrimitive } from "radix-ui"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon, SearchIcon, XIcon } from "lucide-react"

function getNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join(" ")
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    return props.children ? getNodeText(props.children) : ""
  }
  return ""
}

function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

interface SelectSearchContextValue {
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchable: boolean
  registerItem: (value: string, isMatch: boolean) => () => void
}

const SelectSearchContext = React.createContext<SelectSearchContextValue | null>(null)

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

interface SelectContentProps extends React.ComponentProps<typeof SelectPrimitive.Content> {
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  searchable = true,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  ...props
}: SelectContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [matches, setMatches] = React.useState<Record<string, boolean>>({})
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (searchable && searchInputRef.current) {
      const isTouch = typeof window !== "undefined" && (
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768
      )
      if (!isTouch) {
        searchInputRef.current.focus()
      }
    }
  }, [searchable])

  const registerItem = React.useCallback((value: string, isMatch: boolean) => {
    setMatches((prev) => {
      if (prev[value] === isMatch) return prev
      return { ...prev, [value]: isMatch }
    })
    return () => {
      setMatches((prev) => {
        if (!(value in prev)) return prev
        const copy = { ...prev }
        delete copy[value]
        return copy
      })
    }
  }, [])

  const contextValue = React.useMemo<SelectSearchContextValue>(() => ({
    searchQuery,
    setSearchQuery,
    searchable,
    registerItem,
  }), [searchQuery, searchable, registerItem])

  const totalVisible = Object.values(matches).filter(Boolean).length
  const totalRegistered = Object.keys(matches).length
  const showEmptyMessage = searchable && searchQuery.trim() !== "" && totalVisible === 0 && totalRegistered > 0

  return (
    <SelectSearchContext.Provider value={contextValue}>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          data-slot="select-content"
          data-align-trigger={position === "item-aligned"}
          className={cn(
            "relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          position={position}
          align={align}
          {...props}
        >
          {searchable && (
            <div className="sticky top-0 z-20 bg-popover/95 backdrop-blur-xs p-1.5 border-b border-border/50">
              <div className="relative flex items-center">
                <SearchIcon className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      if (searchQuery) {
                        setSearchQuery("")
                        e.stopPropagation()
                      }
                      return
                    }
                    e.stopPropagation()
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-7.5 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background rounded-md border border-input/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSearchQuery("")
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    title="Limpar busca"
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            data-position={position}
            className={cn(
              "p-1 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
              position === "popper" && ""
            )}
          >
            {children}
            {showEmptyMessage && (
              <div className="py-4 px-2 text-center text-xs text-muted-foreground select-none">
                {emptyMessage}
              </div>
            )}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectSearchContext.Provider>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

interface SelectItemProps extends React.ComponentProps<typeof SelectPrimitive.Item> {
  keywords?: string[]
}

function SelectItem({
  className,
  children,
  keywords,
  value,
  ...props
}: SelectItemProps) {
  const searchCtx = React.useContext(SelectSearchContext)

  const isMatch = React.useMemo(() => {
    if (!searchCtx || !searchCtx.searchable || !searchCtx.searchQuery.trim()) {
      return true
    }
    const labelText = getNodeText(children)
    const kwText = keywords ? keywords.join(" ") : ""
    const haystack = normalizeSearchText(`${labelText} ${value || ""} ${kwText}`)
    const needle = normalizeSearchText(searchCtx.searchQuery)
    return haystack.includes(needle)
  }, [searchCtx?.searchQuery, searchCtx?.searchable, children, value, keywords])

  React.useEffect(() => {
    if (searchCtx?.searchable && value) {
      return searchCtx.registerItem(value, isMatch)
    }
  }, [searchCtx, value, isMatch])

  if (!isMatch) {
    return null
  }

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      value={value}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )
}

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  keywords?: string[]
  disabled?: boolean
}

export interface SearchableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  id?: string
  name?: string
  required?: boolean
  searchable?: boolean
  size?: "sm" | "default"
  allowClear?: boolean
  clearLabel?: string
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  id,
  name,
  required,
  searchable = true,
  size = "default",
  allowClear = false,
  clearLabel = "(Limpar seleção)",
}: SearchableSelectProps) {
  const handleValueChange = (val: string) => {
    if (val === "__CLEAR__") {
      onValueChange?.("")
    } else {
      onValueChange?.(val)
    }
  }

  const hasEmptyOption = options.some((o) => o.value === "")
  const internalValue = value === "" && hasEmptyOption ? "__EMPTY__" : value

  return (
    <Select
      value={internalValue}
      onValueChange={(v) => {
        if (v === "__EMPTY__") handleValueChange("")
        else handleValueChange(v)
      }}
      disabled={disabled}
      name={name}
      required={required}
    >
      <SelectTrigger id={id} className={cn("w-full", triggerClassName, className)} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        className={contentClassName}
      >
        {allowClear && (
          <SelectItem value="__CLEAR__" className="text-muted-foreground italic text-xs">
            {clearLabel}
          </SelectItem>
        )}
        {options.map((opt) => {
          const itemVal = opt.value === "" ? "__EMPTY__" : opt.value
          return (
            <SelectItem
              key={itemVal}
              value={itemVal}
              disabled={opt.disabled}
              keywords={opt.keywords}
            >
              <div className="flex flex-col text-left py-0.5">
                <span className="font-medium text-xs leading-snug">{opt.label}</span>
                {opt.description && (
                  <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                    {opt.description}
                  </span>
                )}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SearchableSelect,
}
