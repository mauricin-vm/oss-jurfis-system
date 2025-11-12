import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    searchable?: boolean
  }
>(({ className, children, position = "popper", searchable = true, ...props }, ref) => {
  const [search, setSearch] = React.useState("")
  const [allowNavigationFocus, setAllowNavigationFocus] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Keep input focused when filtered list changes (useLayoutEffect runs synchronously)
  React.useLayoutEffect(() => {
    // Don't re-focus if user is navigating with arrows
    if (!allowNavigationFocus && searchInputRef.current && document.activeElement !== searchInputRef.current) {
      const activeElement = document.activeElement as HTMLElement
      // Don't re-focus if an option has focus
      if (!activeElement?.hasAttribute('data-radix-select-item')) {
        searchInputRef.current.focus()
      }
    }
  })

  // Filter children based on search
  const filteredChildren = React.useMemo(() => {
    if (!search || !searchable) return children

    const searchLower = search.toLowerCase()

    const filterNode = (node: React.ReactNode): React.ReactNode => {
      if (!React.isValidElement(node)) return node

      // Check if it's a SelectItem by checking for value prop
      const hasValueProp = 'value' in node.props

      // If it's a SelectItem, check if it matches the search
      if (hasValueProp) {
        const itemText = String(node.props.children || "").toLowerCase()
        const itemValue = String(node.props.value || "").toLowerCase()
        if (!itemText.includes(searchLower) && !itemValue.includes(searchLower)) {
          return null
        }
        return node
      }

      // If it has children, recursively filter them
      if (node.props?.children) {
        const filteredNodeChildren = React.Children.map(node.props.children, filterNode)
        if (!filteredNodeChildren || filteredNodeChildren.every(child => child === null)) {
          return null
        }
        return React.cloneElement(node, {}, filteredNodeChildren)
      }

      return node
    }

    return React.Children.map(children, filterNode)
  }, [children, search, searchable])

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
        onCloseAutoFocus={(e) => {
          setSearch("")
          setAllowNavigationFocus(false)
          props.onCloseAutoFocus?.(e)
        }}
        onPointerDownOutside={(e) => {
          // Don't close if clicking on the search input
          const target = e.target as HTMLElement
          if (searchInputRef.current?.contains(target)) {
            e.preventDefault()
          }
          props.onPointerDownOutside?.(e)
        }}
      >
        {searchable && (
          <div className="flex items-center border-b px-3 pb-2 pt-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar..."
              className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                // Allow navigation keys to pass through to the Select
                const navigationKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Home', 'End', 'PageUp', 'PageDown']

                if (navigationKeys.includes(e.key)) {
                  // Mark that we're allowing navigation focus
                  setAllowNavigationFocus(true)
                  return
                }

                // For typing keys, ensure navigation mode is off
                setAllowNavigationFocus(false)

                // Block all other keys from the Select
                e.stopPropagation()
              }}
              onBlur={(e) => {
                // Re-focus immediately unless navigating or clicking on an option
                const relatedTarget = e.relatedTarget as HTMLElement
                if (!relatedTarget?.hasAttribute('data-radix-select-item') && !allowNavigationFocus) {
                  e.currentTarget.focus()
                }
              }}
              onFocus={() => {
                // When input gets focus back, disable navigation mode
                setAllowNavigationFocus(false)
              }}
              autoFocus
              autoComplete="off"
            />
          </div>
        )}
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {filteredChildren}
          {searchable && search && (!filteredChildren || React.Children.count(filteredChildren) === 0) && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          )}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
