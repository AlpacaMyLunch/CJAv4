import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, GripVertical, Download, ChevronRight, ChevronLeft, Check, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// --- Types ---

type ACCDriver = {
  firstName: string
  lastName: string
  playerId: string
  shortName: string
}

type ACCCar = {
  carId: number
  carModel: number
  carGroup: string
  carGuid: number
  teamGuid: number
  cupCategory: number
  drivers: ACCDriver[]
  nationality: number
  raceNumber: number
  teamName: string
}

type ACCTiming = {
  bestLap: number
  bestSplits: number[]
  lapCount: number
  lastLap: number
  lastSplitId: number
  lastSplits: number[]
  totalTime: number
}

type ACCLeaderBoardLine = {
  car: ACCCar
  currentDriver: ACCDriver
  currentDriverIndex: number
  driverTotalTimes: number[]
  missingMandatoryPitstop: number
  timing: ACCTiming
}

type ACCResultData = {
  laps: unknown[]
  penalties: unknown[]
  post_race_penalties: unknown | null
  sessionIndex: number
  raceWeekendIndex: number
  sessionResult: {
    bestSplits: number[]
    bestlap: number
    isWetSession: number
    type: number
    leaderBoardLines: ACCLeaderBoardLine[]
  }
  sessionType: string
  trackName: string
  serverName: string
  metaData: string
  Date: string
  SessionFile: string
  [key: string]: unknown
}

type DriverEntry = {
  id: string
  car: ACCCar
  currentDriver: ACCDriver
  originalLine: ACCLeaderBoardLine
  lapCount: number
  totalTime: number
  s1: number
  s2: number
  s3: number
  excluded: boolean
}

// --- Helpers ---

function msToDisplay(ms: number): string {
  if (!ms || ms <= 0) return '-'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = ms % 1000
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

function transformSessionFile(original: string): string {
  const parts = original.split('_')
  if (parts.length >= 3) {
    const timeStr = parts[1]
    const hour = parseInt(timeStr.substring(0, 2), 10)
    const newHour = ((hour + 1) % 24).toString().padStart(2, '0')
    parts[1] = newHour + timeStr.substring(2)
    parts[2] = 'R'
  }
  return parts.join('_')
}

function addOneHour(isoDate: string): string {
  const d = new Date(isoDate)
  d.setUTCHours(d.getUTCHours() + 1)
  return d.toISOString()
}

// --- Sortable Row ---

function SortableDriverRow({
  entry,
  index,
  onUpdate,
}: {
  entry: DriverEntry
  index: number
  onUpdate: (id: string, field: keyof DriverEntry, value: number | boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  }

  const bestLap = entry.s1 + entry.s2 + entry.s3

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 mb-2 transition-colors ${
        entry.excluded
          ? 'bg-muted/50 border-border opacity-60'
          : isDragging
            ? 'bg-primary/10 border-primary shadow-lg'
            : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Position */}
        <div className="flex items-center justify-center w-8 h-8 mt-1 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
          {index + 1}
        </div>

        {/* Driver info + fields */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground">
              {entry.currentDriver.firstName} {entry.currentDriver.lastName}
            </span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              #{entry.car.raceNumber}
            </span>
            <span className="text-xs text-muted-foreground">
              [{entry.currentDriver.shortName}]
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <NumberField
              label="Laps"
              value={entry.lapCount}
              onChange={(v) => onUpdate(entry.id, 'lapCount', v)}
            />
            <NumberField
              label="Total Time (ms)"
              value={entry.totalTime}
              onChange={(v) => onUpdate(entry.id, 'totalTime', v)}
              hint={msToDisplay(entry.totalTime)}
            />
            <NumberField
              label="S1 (ms)"
              value={entry.s1}
              onChange={(v) => onUpdate(entry.id, 's1', v)}
            />
            <NumberField
              label="S2 (ms)"
              value={entry.s2}
              onChange={(v) => onUpdate(entry.id, 's2', v)}
            />
            <NumberField
              label="S3 (ms)"
              value={entry.s3}
              onChange={(v) => onUpdate(entry.id, 's3', v)}
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Best Lap</span>
              <span className="text-sm font-mono mt-1 text-foreground">
                {bestLap > 0 ? msToDisplay(bestLap) : '-'}
              </span>
              {bestLap > 0 && (
                <span className="text-xs text-muted-foreground font-mono">{bestLap}ms</span>
              )}
            </div>
          </div>
        </div>

        {/* Exclude toggle */}
        <button
          onClick={() => onUpdate(entry.id, 'excluded', !entry.excluded)}
          className={`mt-1 p-1.5 rounded-md transition-colors shrink-0 ${
            entry.excluded
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={entry.excluded ? 'Include driver' : 'Exclude driver (DNF)'}
        >
          {entry.excluded ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-muted-foreground mb-1">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="w-full px-2 py-1 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {hint && <span className="text-xs text-muted-foreground mt-0.5 font-mono">{hint}</span>}
    </div>
  )
}

// --- Step Indicators ---

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Upload Qualifying', 'Configure Grid', 'Generate']
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-8 h-px ${isCompleted || isActive ? 'bg-primary' : 'bg-border'}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main Page ---

export function RaceResultsGenerator() {
  const [step, setStep] = useState(1)
  const [qualData, setQualData] = useState<ACCResultData | null>(null)
  const [drivers, setDrivers] = useState<DriverEntry[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Step 1: File upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ACCResultData
        if (
          !data.sessionResult?.leaderBoardLines ||
          !Array.isArray(data.sessionResult.leaderBoardLines) ||
          data.sessionResult.leaderBoardLines.length === 0
        ) {
          setUploadError('Invalid file: no leaderBoardLines found in sessionResult.')
          return
        }

        setQualData(data)
        const entries: DriverEntry[] = data.sessionResult.leaderBoardLines.map((line) => ({
          id: line.car.drivers[0]?.playerId || `car-${line.car.carId}`,
          car: line.car,
          currentDriver: line.currentDriver,
          originalLine: line,
          lapCount: 30,
          totalTime: 0,
          s1: 0,
          s2: 0,
          s3: 0,
          excluded: false,
        }))
        setDrivers(entries)
        setStep(2)
      } catch {
        setUploadError('Failed to parse JSON file. Please upload a valid ACC results file.')
      }
    }
    reader.readAsText(file)
  }, [])

  // Step 2: Update driver fields
  const updateDriver = useCallback(
    (id: string, field: keyof DriverEntry, value: number | boolean) => {
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      )
    },
    []
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setDrivers((prev) => {
        const oldIndex = prev.findIndex((d) => d.id === active.id)
        const newIndex = prev.findIndex((d) => d.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  // Session-level best stats (auto-calculated)
  const sessionBests = useMemo(() => {
    const included = drivers.filter((d) => !d.excluded)
    const bestLaps = included.map((d) => d.s1 + d.s2 + d.s3).filter((v) => v > 0)
    const s1s = included.map((d) => d.s1).filter((v) => v > 0)
    const s2s = included.map((d) => d.s2).filter((v) => v > 0)
    const s3s = included.map((d) => d.s3).filter((v) => v > 0)
    return {
      bestLap: bestLaps.length > 0 ? Math.min(...bestLaps) : 0,
      bestS1: s1s.length > 0 ? Math.min(...s1s) : 0,
      bestS2: s2s.length > 0 ? Math.min(...s2s) : 0,
      bestS3: s3s.length > 0 ? Math.min(...s3s) : 0,
    }
  }, [drivers])

  // Step 3: Generate result
  const generateResult = useCallback(() => {
    if (!qualData) return

    const result: ACCResultData = JSON.parse(JSON.stringify(qualData))

    result.sessionIndex = 2
    result.sessionType = 'R'
    result.sessionResult.type = 1
    result.penalties = []
    result.post_race_penalties = null
    // isWetSession carried from qual (already in deep copy)

    result.SessionFile = transformSessionFile(qualData.SessionFile)
    result.Date = addOneHour(qualData.Date)

    const included = drivers.filter((d) => !d.excluded)

    result.sessionResult.bestlap = sessionBests.bestLap
    result.sessionResult.bestSplits = [sessionBests.bestS1, sessionBests.bestS2, sessionBests.bestS3]

    result.sessionResult.leaderBoardLines = included.map((entry) => {
      const lapTime = entry.s1 + entry.s2 + entry.s3
      return {
        car: entry.car,
        currentDriver: entry.currentDriver,
        currentDriverIndex: 0,
        driverTotalTimes: [entry.totalTime],
        missingMandatoryPitstop: 0,
        timing: {
          bestLap: lapTime,
          bestSplits: [entry.s1, entry.s2, entry.s3],
          lapCount: entry.lapCount,
          lastLap: lapTime,
          lastSplitId: 0,
          lastSplits: [entry.s1, entry.s2, entry.s3],
          totalTime: entry.totalTime,
        },
      }
    })

    // Build laps array: interleaved by lap number
    const maxLaps = Math.max(...included.map((d) => d.lapCount), 0)
    const laps: unknown[] = []
    for (let lap = 0; lap < maxLaps; lap++) {
      for (const entry of included) {
        if (lap < entry.lapCount) {
          laps.push({
            carId: entry.car.carId,
            driverIndex: 0,
            isValidForBest: true,
            laptime: entry.s1 + entry.s2 + entry.s3,
            splits: [entry.s1, entry.s2, entry.s3],
          })
        }
      }
    }
    result.laps = laps

    // Download
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated_results.json'
    a.click()
    URL.revokeObjectURL(url)

    setStep(3)
  }, [qualData, drivers, sessionBests])

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">ACC Race Results Generator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reconstruct corrupted ACC race result files. Upload qualifying JSON, reorder drivers to match finishing positions, edit timing, and download a valid race result.
          </p>
        </motion.div>

        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle>Upload Qualifying JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <span className="text-sm text-muted-foreground mb-1">
                      Click to select an ACC results JSON file
                    </span>
                    <span className="text-xs text-muted-foreground">.json files only</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadError && (
                    <p className="mt-3 text-sm text-destructive">{uploadError}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Configure Grid */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Session info bar */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Source: <span className="text-foreground font-medium">{fileName}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Track: <span className="text-foreground font-medium">{qualData?.trackName}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Server: <span className="text-foreground font-medium">{qualData?.serverName}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Drivers: <span className="text-foreground font-medium">{drivers.length}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Session bests */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <span className="text-muted-foreground font-medium">Session Bests (auto):</span>
                    <span className="text-muted-foreground">
                      Best Lap:{' '}
                      <span className="text-foreground font-mono">
                        {sessionBests.bestLap > 0 ? `${msToDisplay(sessionBests.bestLap)} (${sessionBests.bestLap}ms)` : '-'}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      S1:{' '}
                      <span className="text-foreground font-mono">
                        {sessionBests.bestS1 > 0 ? `${sessionBests.bestS1}ms` : '-'}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      S2:{' '}
                      <span className="text-foreground font-mono">
                        {sessionBests.bestS2 > 0 ? `${sessionBests.bestS2}ms` : '-'}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      S3:{' '}
                      <span className="text-foreground font-mono">
                        {sessionBests.bestS3 > 0 ? `${sessionBests.bestS3}ms` : '-'}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Driver list */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Drag drivers to set finishing order (P1 at top). Fill in timing data and exclude DNFs.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={drivers.map((d) => d.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {drivers.map((entry, index) => (
                      <SortableDriverRow
                        key={entry.id}
                        entry={entry}
                        index={index}
                        onUpdate={updateDriver}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1)
                    setQualData(null)
                    setDrivers([])
                    setFileName('')
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Start Over
                </Button>
                <Button onClick={generateResult}>
                  Generate Race Result
                  <Download className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="max-w-xl mx-auto">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Race Result Generated!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your file <span className="font-mono text-foreground">generated_results.json</span> has been downloaded.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back to Grid
                    </Button>
                    <Button
                      onClick={() => {
                        setStep(1)
                        setQualData(null)
                        setDrivers([])
                        setFileName('')
                      }}
                    >
                      Generate Another
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
