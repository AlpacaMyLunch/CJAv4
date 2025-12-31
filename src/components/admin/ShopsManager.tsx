import { useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import type { SetupShop, Game } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type ShopWithGames = SetupShop & {
  shop_games: { game_id: string }[]
}

interface ShopsManagerProps {
  shops: ShopWithGames[]
  games: Game[]
  onSave: (shop: Partial<ShopWithGames>, gameIds: string[], editingId?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ShopsManager({ shops, games, onSave, onDelete }: ShopsManagerProps) {
  const [editingShop, setEditingShop] = useState<ShopWithGames | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async (shop: Partial<ShopWithGames>, gameIds: string[]) => {
    await onSave(shop, gameIds, editingShop?.id)
    setShowForm(false)
    setEditingShop(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingShop(null)
  }

  const handleEdit = (shop: ShopWithGames) => {
    setEditingShop(shop)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingShop(null)
    setShowForm(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Setup Shops</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <ShopForm
            shop={editingShop}
            games={games}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <div className="space-y-2 mt-4">
          {shops.map(shop => (
            <div key={shop.id} className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium">{shop.name}</div>
                  <div className="text-sm text-muted-foreground">{shop.website_url}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {shop.has_app ? 'Has App' : 'No App'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(shop)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(shop.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Supported games: {shop.shop_games.map(sg =>
                  games.find(g => g.id === sg.game_id)?.name
                ).filter(Boolean).join(', ') || 'None'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ShopForm({ shop, games, onSave, onCancel }: {
  shop: ShopWithGames | null
  games: Game[]
  onSave: (shop: Partial<ShopWithGames>, gameIds: string[]) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(shop?.name || '')
  const [websiteUrl, setWebsiteUrl] = useState(shop?.website_url || '')
  const [hasApp, setHasApp] = useState(shop?.has_app || false)
  const [selectedGames, setSelectedGames] = useState<string[]>(
    shop?.shop_games.map(sg => sg.game_id) || []
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        website_url: websiteUrl,
        has_app: hasApp
      }, selectedGames)
    } finally {
      setSaving(false)
    }
  }

  const toggleGame = (gameId: string) => {
    setSelectedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="shop-name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="shop-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="shop-url" className="block text-sm font-medium mb-2">Website URL</label>
          <input
            id="shop-url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasApp}
            onChange={(e) => setHasApp(e.target.checked)}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Has App</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Supported Games</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {games.map(game => (
            <label key={game.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted">
              <input
                type="checkbox"
                checked={selectedGames.includes(game.id)}
                onChange={() => toggleGame(game.id)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">{game.name}</span>
            </label>
          ))}
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
