import { carData, type CarConfig } from '@/data/accCarData'

// Raw ACC setup JSON structure
export interface AccSetupFile {
  carName: string
  basicSetup: {
    tyres: {
      tyrePressure: number[]
      tyreCompound: number
    }
    alignment: {
      camber: number[]
      toe: number[]
      casterLF: number
      casterRF: number
      steerRatio: number
    }
    electronics: {
      tC1: number
      tC2: number
      abs: number
      eCUMap: number
    }
    strategy: {
      fuel: number
    }
  }
  advancedSetup: {
    mechanicalBalance: {
      aRBFront: number
      aRBRear: number
      brakeTorque: number
      brakeBias: number
      wheelRate: number[]
      bumpStopRateUp: number[]
      bumpStopWindow: number[]
    }
    dampers: {
      bumpSlow: number[]
      bumpFast: number[]
      reboundSlow: number[]
      reboundFast: number[]
    }
    aeroBalance: {
      rideHeight: number[]
      splitter: number
      rearWing: number
      brakeDuct: number[]
    }
    drivetrain: {
      preload: number
    }
  }
}

export interface ParsedValue {
  raw: number
  display: string
  numeric: number
}

export interface SetupParameter {
  label: string
  unit: string
  baseline: ParsedValue | null
  compare: ParsedValue | null
  diff: 'higher' | 'lower' | 'equal' | 'na'
}

export interface SetupCategory {
  name: string
  icon: string
  parameters: SetupParameter[]
}

function pv(numeric: number | undefined | null, decimals = 1, suffix = ''): ParsedValue {
  const val = numeric ?? 0
  return {
    raw: val,
    display: `${Number(val.toFixed(decimals))}${suffix}`,
    numeric: Number(val.toFixed(decimals + 2))
  }
}

// ACC arrays are either 4-element [FL, FR, RL, RR] or 2-element [Front, Rear].
// This safely gets the "front" (index 0) and "rear" (index 2 or 1) values.
function getFront(arr: number[]): number { return arr[0] ?? 0 }
function getRear(arr: number[]): number { return arr.length > 2 ? (arr[2] ?? 0) : (arr[1] ?? 0) }
function getFrontAvg(arr: number[]): number {
  if (arr.length >= 4) return (arr[0] + arr[1]) / 2
  return arr[0] ?? 0
}
function getRearAvg(arr: number[]): number {
  if (arr.length >= 4) return (arr[2] + arr[3]) / 2
  return arr.length > 1 ? (arr[arr.length - 1] ?? 0) : (arr[0] ?? 0)
}

function extractTyres(setup: AccSetupFile, car: CarConfig): SetupParameter[] {
  const tp = setup.basicSetup.tyres.tyrePressure
  const toe = setup.basicSetup.alignment.toe
  const toeFront = pv(getFront(toe) / 100 + car.toeMins[0], 2)
  const toeRear = pv(getRear(toe) / 100 + car.toeMins[1], 2)

  const camber = setup.basicSetup.alignment.camber
  const camberFront = pv(car.camberFrontRange[0] + getFront(camber) * 0.1, 1)
  const camberRear = pv(car.camberRearRange[0] + getRear(camber) * 0.1, 1)

  const casterLF = pv(car.casterFunc(setup.basicSetup.alignment.casterLF), 1)
  const casterRF = pv(car.casterFunc(setup.basicSetup.alignment.casterRF), 1)

  return [
    { label: 'Tyre Pressure', unit: 'psi', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: 'psi', baseline: pv(car.tirePressureMin + getFrontAvg(tp) / 10, 1), compare: null, diff: 'na' },
    { label: '  Rear', unit: 'psi', baseline: pv(car.tirePressureMin + getRearAvg(tp) / 10, 1), compare: null, diff: 'na' },
    { label: 'Toe', unit: '°', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '°', baseline: toeFront, compare: null, diff: 'na' },
    { label: '  Rear', unit: '°', baseline: toeRear, compare: null, diff: 'na' },
    { label: 'Camber', unit: '°', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '°', baseline: camberFront, compare: null, diff: 'na' },
    { label: '  Rear', unit: '°', baseline: camberRear, compare: null, diff: 'na' },
    { label: 'Caster', unit: '°', baseline: null, compare: null, diff: 'na' },
    { label: '  Left', unit: '°', baseline: casterLF, compare: null, diff: 'na' },
    { label: '  Right', unit: '°', baseline: casterRF, compare: null, diff: 'na' },
  ]
}

function extractElectronics(setup: AccSetupFile): SetupParameter[] {
  const e = setup.basicSetup.electronics
  return [
    { label: 'TC1', unit: '', baseline: pv(e.tC1, 0), compare: null, diff: 'na' },
    { label: 'TC2', unit: '', baseline: pv(e.tC2, 0), compare: null, diff: 'na' },
    { label: 'ABS', unit: '', baseline: pv(e.abs, 0), compare: null, diff: 'na' },
    { label: 'ECU Map', unit: '', baseline: pv(e.eCUMap + 1, 0), compare: null, diff: 'na' },
  ]
}

function extractMechanical(setup: AccSetupFile, car: CarConfig): SetupParameter[] {
  const m = setup.advancedSetup.mechanicalBalance
  const d = setup.advancedSetup.drivetrain

  const wrFrontIdx = getFront(m.wheelRate)
  const wrRearIdx = getRear(m.wheelRate)
  const wrFrontTable = car.wheelRates[0]
  const wrRearTable = car.wheelRates[1]
  const wrFront = pv((wrFrontTable[wrFrontIdx] ?? wrFrontIdx) * 1000, 0)
  const wrRear = pv((wrRearTable[wrRearIdx] ?? wrRearIdx) * 1000, 0)

  const bsRateFront = pv(getFront(m.bumpStopRateUp) * 100 + 200, 0)
  const bsRateRear = pv(getRear(m.bumpStopRateUp) * 100 + 200, 0)
  const bsRangeFront = pv(getFront(m.bumpStopWindow), 0)
  const bsRangeRear = pv(getRear(m.bumpStopWindow), 0)

  const preloadMin = car.minPreload ?? 20
  const preloadVal = d.preload * 10 + preloadMin

  return [
    { label: 'Anti-Roll Bar', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(m.aRBFront, 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(m.aRBRear, 0), compare: null, diff: 'na' },
    { label: 'Diff Preload', unit: 'Nm', baseline: pv(preloadVal, 0), compare: null, diff: 'na' },
    { label: 'Brake Power', unit: '%', baseline: pv(m.brakeTorque + 80, 0), compare: null, diff: 'na' },
    { label: 'Brake Bias', unit: '%', baseline: pv(m.brakeBias / 5 + car.brakeBiasMin, 1), compare: null, diff: 'na' },
    { label: 'Steering Ratio', unit: '', baseline: pv(setup.basicSetup.alignment.steerRatio + car.steeringRatioMin, 0), compare: null, diff: 'na' },
    { label: 'Wheel Rate', unit: 'N/m', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: 'N/m', baseline: wrFront, compare: null, diff: 'na' },
    { label: '  Rear', unit: 'N/m', baseline: wrRear, compare: null, diff: 'na' },
    { label: 'Bumpstop Rate', unit: 'N', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: 'N', baseline: bsRateFront, compare: null, diff: 'na' },
    { label: '  Rear', unit: 'N', baseline: bsRateRear, compare: null, diff: 'na' },
    { label: 'Bumpstop Range', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: bsRangeFront, compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: bsRangeRear, compare: null, diff: 'na' },
  ]
}

function extractDampers(setup: AccSetupFile): SetupParameter[] {
  const d = setup.advancedSetup.dampers
  return [
    { label: 'Bump', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(getFront(d.bumpSlow), 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(getRear(d.bumpSlow), 0), compare: null, diff: 'na' },
    { label: 'Fast Bump', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(getFront(d.bumpFast), 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(getRear(d.bumpFast), 0), compare: null, diff: 'na' },
    { label: 'Rebound', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(getFront(d.reboundSlow), 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(getRear(d.reboundSlow), 0), compare: null, diff: 'na' },
    { label: 'Fast Rebound', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(getFront(d.reboundFast), 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(getRear(d.reboundFast), 0), compare: null, diff: 'na' },
  ]
}

function extractAero(setup: AccSetupFile, car: CarConfig): SetupParameter[] {
  const a = setup.advancedSetup.aeroBalance
  const frontHeight = a.rideHeight[0] + car.rideHeightMinFront
  const rearHeight = a.rideHeight[2] + car.rideHeightMinRear
  const rake = rearHeight - frontHeight

  const wingMin = car.minWing ?? 0

  return [
    { label: 'Ride Height', unit: 'mm', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: 'mm', baseline: pv(frontHeight, 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: 'mm', baseline: pv(rearHeight, 0), compare: null, diff: 'na' },
    { label: 'Rake', unit: 'mm', baseline: pv(rake, 0), compare: null, diff: 'na' },
    { label: 'Brake Ducts', unit: '', baseline: null, compare: null, diff: 'na' },
    { label: '  Front', unit: '', baseline: pv(a.brakeDuct[0], 0), compare: null, diff: 'na' },
    { label: '  Rear', unit: '', baseline: pv(a.brakeDuct[a.brakeDuct.length > 2 ? 2 : 1], 0), compare: null, diff: 'na' },
    { label: 'Splitter', unit: '', baseline: pv(a.splitter + 1, 0), compare: null, diff: 'na' },
    { label: 'Rear Wing', unit: '', baseline: pv(a.rearWing + wingMin, 0), compare: null, diff: 'na' },
  ]
}

export function parseSetup(setup: AccSetupFile): { car: CarConfig; categories: SetupCategory[] } | null {
  const car = carData[setup.carName]
  if (!car) return null

  return {
    car,
    categories: [
      { name: 'Tyres & Alignment', icon: 'circle', parameters: extractTyres(setup, car) },
      { name: 'Electronics', icon: 'zap', parameters: extractElectronics(setup) },
      { name: 'Mechanical Grip', icon: 'settings', parameters: extractMechanical(setup, car) },
      { name: 'Dampers', icon: 'activity', parameters: extractDampers(setup) },
      { name: 'Aero & Ride Height', icon: 'wind', parameters: extractAero(setup, car) },
    ]
  }
}

function getDiff(a: number, b: number): 'higher' | 'lower' | 'equal' {
  const diff = b - a
  if (Math.abs(diff) < 0.001) return 'equal'
  return diff > 0 ? 'higher' : 'lower'
}

export function compareSetups(
  baseline: AccSetupFile,
  compare: AccSetupFile
): SetupCategory[] | null {
  const baseResult = parseSetup(baseline)
  const compResult = parseSetup(compare)
  if (!baseResult || !compResult) return null

  return baseResult.categories.map((baseCat, catIdx) => {
    const compCat = compResult.categories[catIdx]
    return {
      ...baseCat,
      parameters: baseCat.parameters.map((baseParam, paramIdx) => {
        const compParam = compCat.parameters[paramIdx]
        const isHeader = baseParam.baseline === null
        return {
          ...baseParam,
          compare: compParam.baseline,
          diff: isHeader ? 'na' as const : getDiff(
            baseParam.baseline!.numeric,
            compParam.baseline!.numeric
          ),
        }
      })
    }
  })
}

export function loadSetupFile(file: File): Promise<AccSetupFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target!.result as string))
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
