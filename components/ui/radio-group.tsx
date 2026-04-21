"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onValueChange?: (value: string) => void
    defaultValue?: string
    value?: string
  }
>(({ className, onValueChange, defaultValue, value, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const activeValue = value !== undefined ? value : internalValue

  const handleValueChange = (val: string) => {
    if (value === undefined) {
      setInternalValue(val)
    }
    onValueChange?.(val)
  }

  return (
    <RadioGroupContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div
        ref={ref}
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const { value: activeValue, onValueChange } = React.useContext(RadioGroupContext)
  const checked = activeValue === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all",
        checked ? "bg-primary border-primary" : "bg-transparent border-input",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {checked && (
        <div className="h-1.5 w-1.5 rounded-full bg-background" />
      )}
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
