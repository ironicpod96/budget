"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CATEGORIES, getCategoryById, CategoryId } from "@/lib/constants"
import { formatRM } from "@/lib/utils"
import { scanBankStatement } from "@/lib/scanner"
import { ScanResult } from "@/types"
import { Upload, Loader2, Check, AlertCircle, ChevronDown } from "lucide-react"

interface ScanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (results: ScanResult[]) => void
}

type ScanState = "idle" | "scanning" | "review" | "error"

export function ScanModal({ open, onOpenChange, onConfirm }: ScanModalProps) {
  const [state, setState] = useState<ScanState>("idle")
  const [results, setResults] = useState<ScanResult[]>([])
  const [unknowns, setUnknowns] = useState<ScanResult[]>([])
  const [error, setError] = useState("")
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setState("scanning")
    setError("")
    try {
      const { results: r, unknowns: u } = await scanBankStatement(file)
      setResults(r)
      setUnknowns(u)
      setState("review")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed")
      setState("error")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirmUnknown = (idx: number, category: CategoryId) => {
    const item = unknowns[idx]
    setResults([...results, { ...item, category, confidence: "high" }])
    setUnknowns(unknowns.filter((_, i) => i !== idx))
    setEditingIdx(null)
  }

  const handleConfirmAll = () => {
    onConfirm([...results, ...unknowns])
    setState("idle")
    setResults([])
    setUnknowns([])
    onOpenChange(false)
  }

  const removeResult = (idx: number) => {
    setResults(results.filter((_, i) => i !== idx))
  }

  const totalAmount = [...results, ...unknowns].reduce((s, r) => s + r.amount, 0)

  const reset = () => {
    setState("idle")
    setResults([])
    setUnknowns([])
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Bank Statement</DialogTitle>
          <DialogDescription>Upload your Maybank or Wise PDF statement</DialogDescription>
        </DialogHeader>

        {state === "idle" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop PDF here or tap to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Supports Maybank & Wise statements</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>
        )}

        {state === "scanning" && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Scanning statement...</p>
            <p className="text-xs text-muted-foreground mt-1">AI is categorizing your transactions</p>
          </div>
        )}

        {state === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={reset}>Try again</Button>
          </div>
        )}

        {state === "review" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{results.length + unknowns.length} transactions found</p>
                <p className="text-xs text-muted-foreground">Total: <span className="font-mono">{formatRM(totalAmount)}</span></p>
              </div>
              <Button size="sm" onClick={reset} variant="ghost">Re-scan</Button>
            </div>

            {unknowns.length > 0 && (
              <Card className="border-warning/30 bg-warning/5 p-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  {unknowns.length} need your input
                </p>
                <div className="space-y-2">
                  {unknowns.map((u, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{u.desc}</p>
                        <p className="text-xs text-muted-foreground font-mono">{formatRM(u.amount)}</p>
                      </div>
                      {editingIdx === idx ? (
                        <div className="flex flex-wrap gap-1">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleConfirmUnknown(idx, c.id)}
                              className="text-xs px-2 py-1 rounded-md bg-secondary hover:bg-accent transition-colors"
                            >
                              {c.emoji} {c.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditingIdx(idx)}>
                          Categorize <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1">
              {results.map((r, idx) => {
                const cat = getCategoryById(r.category)
                return (
                  <div key={idx} className="flex items-center justify-between py-2 px-1 text-sm group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base">{cat.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate">{r.desc}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{formatRM(r.amount)}</span>
                      <button onClick={() => removeResult(idx)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-opacity">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button className="w-full" onClick={handleConfirmAll}>
              <Check className="w-4 h-4 mr-2" />
              Import {results.length + unknowns.length} transactions
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
