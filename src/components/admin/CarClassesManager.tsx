import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import type { Game, CarClass } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface CarClassesManagerProps {
  carClasses: CarClass[]
  games: Game[]
  onSave: (carClass: Partial<CarClass>, editingId?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CarClassesManager({ carClasses, games, onSave, onDelete }: CarClassesManagerProps) {
  const [editingCarClass, setEditingCarClass] = useState<CarClass | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (carClass: Partial<CarClass>) => {
    await onSave(carClass, editingCarClass?.id)
    setShowForm(false)
    setEditingCarClass(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCarClass(null)
  }

  const handleEdit = (carClass: CarClass) => {
    setEditingCarClass(carClass)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingCarClass(null)
    setShowForm(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Car Classes</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Car Class
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <CarClassForm
            carClass={editingCarClass}
            games={games}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <div className="space-y-6 mt-4">
          {games.map(game => {
            const gameClasses = carClasses.filter(cc => cc.game_id === game.id)
            if (gameClasses.length === 0) return null

            return (
              <div key={game.id}>
                <h3 className="font-semibold mb-2">{game.name}</h3>
                <div className="space-y-2">
                  {gameClasses.map(carClass => (
                    <div key={carClass.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">{carClass.name}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(carClass)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(carClass.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function CarClassForm({ carClass, games, onSave, onCancel }: {
  carClass: CarClass | null
  games: Game[]
  onSave: (carClass: Partial<CarClass>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(carClass?.name || '')
  const [gameId, setGameId] = useState(carClass?.game_id || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, game_id: gameId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="class-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="class-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Game</label>
          <Select value={gameId} onValueChange={setGameId}>
            <SelectTrigger>
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {games.map(game => (
                <SelectItem key={game.id} value={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !gameId}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
