import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import type { Game } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GamesManagerProps {
  games: Game[]
  onSave: (game: Partial<Game>, editingId?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function GamesManager({ games, onSave, onDelete }: GamesManagerProps) {
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (game: Partial<Game>) => {
    await onSave(game, editingGame?.id)
    setShowForm(false)
    setEditingGame(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGame(null)
  }

  const handleEdit = (game: Game) => {
    setEditingGame(game)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingGame(null)
    setShowForm(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Games</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <GameForm
            game={editingGame}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <div className="space-y-2 mt-4">
          {games.map(game => (
            <div key={game.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="font-medium">{game.name}</div>
                <div className="text-sm text-muted-foreground">Short name: {game.short_name}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(game)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(game.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GameForm({ game, onSave, onCancel }: {
  game: Game | null
  onSave: (game: Partial<Game>) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(game?.name || '')
  const [shortName, setShortName] = useState(game?.short_name || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, short_name: shortName })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="game-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="game-short" className="block text-sm font-medium mb-2">Short Name</label>
          <input
            id="game-short"
            type="text"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
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
