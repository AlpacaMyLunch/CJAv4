export interface TrackInfo {
  id: string
  name: string
  country: string
  flag: string
  length: string
  turns: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  category: 'Street' | 'Road' | 'Oval' | 'Mixed'
}

export const AVAILABLE_TRACKS: TrackInfo[] = [
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    flag: '🇬🇧',
    length: '5.891 km',
    turns: 18,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    country: 'Italy', 
    flag: '🇮🇹',
    length: '5.793 km',
    turns: 11,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    flag: '🇧🇪',
    length: '7.004 km',
    turns: 19,
    difficulty: 'Hard',
    category: 'Road'
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    flag: '🇲🇨',
    length: '3.337 km',
    turns: 19,
    difficulty: 'Expert',
    category: 'Street'
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    flag: '🇯🇵',
    length: '5.807 km',
    turns: 18,
    difficulty: 'Hard',
    category: 'Road'
  },
  {
    id: 'interlagos',
    name: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    flag: '🇧🇷',
    length: '4.309 km',
    turns: 15,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'nurburgring',
    name: 'Nürburgring GP-Strecke',
    country: 'Germany',
    flag: '🇩🇪',
    length: '5.148 km',
    turns: 15,
    difficulty: 'Hard',
    category: 'Road'
  },
  {
    id: 'austin',
    name: 'Circuit of The Americas',
    country: 'United States',
    flag: '🇺🇸',
    length: '5.513 km',
    turns: 20,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'imola',
    name: 'Autodromo Enzo e Dino Ferrari',
    country: 'Italy',
    flag: '🇮🇹',
    length: '4.909 km',
    turns: 19,
    difficulty: 'Hard',
    category: 'Road'
  },
  {
    id: 'barcelona',
    name: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    flag: '🇪🇸',
    length: '4.675 km',
    turns: 16,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'hungaroring',
    name: 'Hungaroring',
    country: 'Hungary',
    flag: '🇭🇺',
    length: '4.381 km',
    turns: 14,
    difficulty: 'Medium',
    category: 'Road'
  },
  {
    id: 'zandvoort',
    name: 'Circuit Zandvoort',
    country: 'Netherlands',
    flag: '🇳🇱',
    length: '4.259 km',
    turns: 14,
    difficulty: 'Medium',
    category: 'Road'
  }
]

export function getDifficultyColor(difficulty: TrackInfo['difficulty']): string {
  switch (difficulty) {
    case 'Easy': return 'text-green-400'
    case 'Medium': return 'text-yellow-400'
    case 'Hard': return 'text-orange-400'
    case 'Expert': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export function getCategoryColor(category: TrackInfo['category']): string {
  switch (category) {
    case 'Street': return 'text-purple-400'
    case 'Road': return 'text-blue-400'
    case 'Oval': return 'text-green-400'
    case 'Mixed': return 'text-orange-400'
    default: return 'text-gray-400'
  }
}