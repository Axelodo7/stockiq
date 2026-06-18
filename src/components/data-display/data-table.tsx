"use client"

import * as React from "react"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: string
  header: string
  className?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  footer?: React.ReactNode
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  footer,
  className,
}: DataTableProps<T>) {
  return (
    <ScrollArea.Root className={cn("w-full overflow-hidden rounded-xl border border-border bg-panel", className)}>
      <ScrollArea.Viewport className="w-full">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-panel-elevated">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-panel-elevated/50",
                    i % 2 === 0 ? "bg-panel" : "bg-panel/50"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.render
                        ? col.render(row)
                        : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t border-border bg-panel-elevated">
                <td colSpan={columns.length}>{footer}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="horizontal" className="h-2">
        <ScrollArea.Thumb className="rounded-full bg-border" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
