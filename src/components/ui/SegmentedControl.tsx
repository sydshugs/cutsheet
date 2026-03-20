"use client"
import * as React from "react"

interface SegmentedControlProps {
  options: string[]
  selected?: string
  onChange?: (value: string) => void
  className?: string
}

export function SegmentedControl({
  options,
  selected,
  onChange,
  className,
}: SegmentedControlProps) {
  const [active, setActive] = React.useState<string>(selected ?? options[0])

  React.useEffect(() => {
    if (selected !== undefined && options.includes(selected)) {
      setActive(selected)
    }
  }, [selected, options])

  const handleClick = (value: string) => {
    setActive(value)
    onChange?.(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = options.indexOf(active)
    let next = idx
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      next = (idx + 1) % options.length
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      next = (idx - 1 + options.length) % options.length
    } else { return }
    handleClick(options[next])
  }

  return (
    <div
      className={className}
      role="radiogroup"
      onKeyDown={handleKeyDown}
      style={{
        display: "inline-flex",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 4,
        gap: 2,
      }}
    >
      {options.map((option) => {
        const isActive = option === active
        return (
          <button
            key={option}
            onClick={() => handleClick(option)}
            tabIndex={isActive ? 0 : -1}
            style={{
              padding: "7px 16px",
              borderRadius: 7,
              border: isActive
                ? "1px solid var(--border-hover)"
                : "1px solid transparent",
              background: isActive ? "var(--surface-el)" : "transparent",
              color: isActive ? "var(--ink)" : "var(--ink-muted)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              fontFamily: "var(--sans)",
              cursor: "pointer",
              transition: "all 0.15s var(--ease-out)",
              whiteSpace: "nowrap",
              outline: "none",
              boxShadow: isActive
                ? "inset 0 -1.5px 0 var(--accent)"
                : "none",
            }}
            role="radio"
            aria-checked={isActive}
          >
            {isActive ? (
              <span
                style={{
                  background: "var(--grad)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {option}
              </span>
            ) : (
              option
            )}
          </button>
        )
      })}
    </div>
  )
}
