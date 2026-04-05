import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ArrowRight, ChevronDown, ChevronRight, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type AccSetupFile,
  type SetupCategory,
  compareSetups,
  parseSetup,
  loadSetupFile,
} from '@/utils/accSetupParser'
import { carData } from '@/data/accCarData'
import { getTipForParameter } from '@/data/accSetupTips'

type LoadedSetup = {
  file: AccSetupFile
  fileName: string
  carName: string
}

function FileDropZone({
  label,
  sublabel,
  setup,
  onLoad,
  onClear,
}: {
  label: string
  sublabel: string
  setup: LoadedSetup | null
  onLoad: (setup: LoadedSetup) => void
  onClear: () => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (!file.name.endsWith('.json')) {
      setError('Please select a .json setup file')
      return
    }
    try {
      const data = await loadSetupFile(file)
      if (!data.carName || !data.basicSetup || !data.advancedSetup) {
        setError('This doesn\'t look like an ACC setup file')
        return
      }
      const car = carData[data.carName]
      if (!car) {
        setError(`Unsupported car: ${data.carName}`)
        return
      }
      onLoad({ file: data, fileName: file.name, carName: car.name })
    } catch {
      setError('Could not parse this file')
    }
  }, [onLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (setup) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-xl border-2 border-primary/30 bg-primary/5 p-5"
      >
        <button
          onClick={onClear}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">{label}</div>
        <div className="text-lg font-bold text-foreground">{setup.carName}</div>
        <div className="text-sm text-muted-foreground truncate mt-0.5">{setup.fileName}</div>
      </motion.div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200',
          isDragOver
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <Upload className={cn('w-8 h-8 mx-auto mb-3 transition-colors', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
        <div className="text-xs text-muted-foreground mt-2">Drop a .json file or click to browse</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-sm text-destructive"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  )
}

function DiffBadge({ diff }: { diff: 'higher' | 'lower' | 'equal' | 'na' }) {
  if (diff === 'na' || diff === 'equal') return null
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
      diff === 'higher' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
    )}>
      {diff === 'higher' ? '+ Higher' : '- Lower'}
    </span>
  )
}

function ValueCell({ value, diff, side }: { value: string | null; diff: 'higher' | 'lower' | 'equal' | 'na'; side: 'baseline' | 'compare' }) {
  if (!value) return <span className="text-muted-foreground/40">--</span>
  const highlight = side === 'compare' && diff !== 'equal' && diff !== 'na'
  return (
    <span className={cn(
      'font-mono text-sm tabular-nums',
      highlight && diff === 'higher' && 'text-emerald-400',
      highlight && diff === 'lower' && 'text-red-400',
      !highlight && 'text-foreground',
    )}>
      {value}
    </span>
  )
}

function ComparisonCategory({
  category,
  expanded,
  onToggle,
}: {
  category: SetupCategory
  expanded: boolean
  onToggle: () => void
}) {
  // Build a list of rows, tracking parent context for tip lookups
  const rows: Array<{
    param: (typeof category.parameters)[number]
    parentLabel: string
    isHeader: boolean
  }> = []

  let currentParent = ''
  for (const param of category.parameters) {
    const isHeader = param.baseline === null
    if (isHeader) {
      currentParent = param.label
      rows.push({ param, parentLabel: '', isHeader: true })
    } else {
      const isChild = param.label.startsWith('  ')
      rows.push({ param, parentLabel: isChild ? currentParent : '', isHeader: false })
      if (!isChild) currentParent = ''
    }
  }

  const hasDiffs = rows.some(r => !r.isHeader && r.param.diff !== 'equal' && r.param.diff !== 'na')
  const diffCount = rows.filter(r => !r.isHeader && r.param.diff !== 'equal' && r.param.diff !== 'na').length

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
          <span className="text-lg font-semibold text-foreground">{category.name}</span>
          {hasDiffs && (
            <span className="text-xs font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {diffCount} {diffCount === 1 ? 'difference' : 'differences'}
            </span>
          )}
          {!hasDiffs && (
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Identical
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_100px_100px_auto_1fr] gap-x-4 items-center px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                <div>Parameter</div>
                <div className="text-center">Baseline</div>
                <div className="text-center">Compare</div>
                <div></div>
                <div>What This Means</div>
              </div>

              {rows.map(({ param, parentLabel, isHeader }, idx) => {
                if (isHeader) {
                  return (
                    <div
                      key={`${category.name}-${idx}`}
                      className="grid grid-cols-[1fr_100px_100px_auto_1fr] gap-x-4 items-center px-3 py-2 mt-2"
                    >
                      <div className="text-sm font-semibold text-foreground">{param.label}</div>
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                  )
                }

                const tip = param.diff !== 'equal' && param.diff !== 'na'
                  ? getTipForParameter(
                    category.name,
                    parentLabel,
                    param.label,
                    param.diff,
                    param.baseline?.numeric,
                    param.compare?.numeric,
                  )
                  : ''

                const isDiff = param.diff !== 'equal' && param.diff !== 'na'

                return (
                  <div
                    key={`${category.name}-${idx}`}
                    className={cn(
                      'grid grid-cols-[1fr_100px_100px_auto_1fr] gap-x-4 items-start px-3 py-2 rounded-lg transition-colors',
                      isDiff ? 'bg-muted/30' : ''
                    )}
                  >
                    <div className="text-sm text-muted-foreground">
                      {param.label}
                      {param.unit && <span className="text-muted-foreground/50 ml-1">{param.unit}</span>}
                    </div>
                    <div className="text-center">
                      <ValueCell value={param.baseline?.display ?? null} diff={param.diff} side="baseline" />
                    </div>
                    <div className="text-center">
                      <ValueCell value={param.compare?.display ?? null} diff={param.diff} side="compare" />
                    </div>
                    <div className="flex items-start pt-0.5">
                      <DiffBadge diff={param.diff} />
                    </div>
                    <div>
                      {tip && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-start gap-2"
                        >
                          <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground leading-relaxed">{tip}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function SummaryPanel({ categories }: { categories: SetupCategory[] }) {
  const allDiffs: Array<{ category: string; label: string; tip: string; diff: 'higher' | 'lower' }> = []

  for (const cat of categories) {
    let currentParent = ''
    for (const param of cat.parameters) {
      if (param.baseline === null) {
        currentParent = param.label
        continue
      }
      const isChild = param.label.startsWith('  ')
      if (!isChild) currentParent = ''
      if (param.diff === 'higher' || param.diff === 'lower') {
        const parentForLookup = isChild ? currentParent : ''
        const tip = getTipForParameter(
          cat.name, parentForLookup, param.label, param.diff,
          param.baseline?.numeric, param.compare?.numeric,
        )
        if (tip) {
          const displayLabel = parentForLookup
            ? `${parentForLookup} ${param.label.trim()}`
            : param.label.trim()
          allDiffs.push({ category: cat.name, label: displayLabel, tip, diff: param.diff })
        }
      }
    }
  }

  if (allDiffs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-lg font-semibold text-foreground mb-1">These setups are identical</div>
          <div className="text-sm text-muted-foreground">No differences found between the two setup files.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Behavioral Summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          How the <span className="text-primary font-medium">Compare</span> setup will feel different from the <span className="font-medium text-foreground">Baseline</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allDiffs.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
            >
              <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-primary" />
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-0.5">
                  {d.category} &middot; {d.label}
                </div>
                <div className="text-sm text-foreground leading-relaxed">{d.tip}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SetupCompare() {
  const [baseline, setBaseline] = useState<LoadedSetup | null>(null)
  const [compare, setCompare] = useState<LoadedSetup | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const categories = baseline && compare ? compareSetups(baseline.file, compare.file) : null
  const baselineOnly = baseline && !compare ? parseSetup(baseline.file) : null

  const carMismatch = baseline && compare && baseline.file.carName !== compare.file.carName

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const expandAll = () => {
    if (categories) {
      setExpandedCategories(new Set(categories.map(c => c.name)))
    }
  }

  const collapseAll = () => setExpandedCategories(new Set())

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Setup Compare</h1>
          <p className="text-muted-foreground mt-1">
            Upload two ACC setup files to see exactly how the car will behave differently.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <FileDropZone
              label="Baseline Setup"
              sublabel="The setup you're starting from"
              setup={baseline}
              onLoad={setBaseline}
              onClear={() => setBaseline(null)}
            />
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>
            <FileDropZone
              label="Compare Setup"
              sublabel="The setup you want to compare against"
              setup={compare}
              onLoad={setCompare}
              onClear={() => setCompare(null)}
            />
          </div>
        </motion.div>

        {/* Car mismatch warning */}
        {carMismatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              <span className="font-semibold">Different cars detected.</span> The Baseline is a{' '}
              <span className="font-medium">{baseline?.carName}</span> and the Compare is a{' '}
              <span className="font-medium">{compare?.carName}</span>.
              Value conversions use each car's specific data, but behavioral tips assume the same car.
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {categories && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <SummaryPanel categories={categories} />

              {/* Expand/Collapse controls */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Detailed Breakdown</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                  <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
                </div>
              </div>

              {/* Category cards */}
              {categories.map((cat) => (
                <ComparisonCategory
                  key={cat.name}
                  category={cat}
                  expanded={expandedCategories.has(cat.name)}
                  onToggle={() => toggleCategory(cat.name)}
                />
              ))}
            </motion.div>
          )}

          {/* Show single setup view when only baseline loaded */}
          {baselineOnly && !compare && (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {baseline!.carName} &mdash; Setup Values
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload a second setup file to see the comparison and behavioral analysis.
                  </p>
                </CardHeader>
                <CardContent>
                  {baselineOnly.categories.map((cat) => (
                    <div key={cat.name} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-semibold text-foreground mb-2">{cat.name}</h3>
                      <div className="space-y-1">
                        {cat.parameters.map((param, idx) => {
                          if (param.baseline === null) {
                            return (
                              <div key={idx} className="text-sm font-medium text-foreground pt-2">
                                {param.label}
                              </div>
                            )
                          }
                          return (
                            <div key={idx} className="flex items-center justify-between px-2 py-1">
                              <span className="text-sm text-muted-foreground">
                                {param.label}
                                {param.unit && <span className="text-muted-foreground/50 ml-1">{param.unit}</span>}
                              </span>
                              <span className="font-mono text-sm text-foreground">{param.baseline.display}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty state */}
          {!baseline && !compare && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-2">Upload two ACC setup files to get started</p>
                <p className="text-sm">
                  Setup files are .json files found in your ACC setups folder, typically at<br />
                  <code className="text-xs bg-muted px-2 py-1 rounded">Documents/Assetto Corsa Competizione/Setups/</code>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
