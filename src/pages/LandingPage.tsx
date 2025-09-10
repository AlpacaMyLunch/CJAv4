import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      title: 'Nostradouglas',
      description: 'Predict the tracks for the upcoming season. Drag and drop to order your predictions.',
      href: '/nostradouglas',
      status: 'active'
    },
    {
      title: 'Fantasy SRA',
      description: 'Fantasy racing league with points and standings.',
      href: '/fantasy-sra',
      status: 'coming-soon'
    },
    {
      title: 'Pick Deez',
      description: 'Weekly picks and predictions for race outcomes.',
      href: '/pick-deez',
      status: 'coming-soon'
    },
    {
      title: 'Community Predictions',
      description: 'See what the community is predicting and join the discussion.',
      href: '/community',
      status: 'active'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Coach Jeffries Academy
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your hub for racing predictions, fantasy leagues, and community engagement. 
            Make your predictions and compete with the community.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link to="/nostradouglas">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  View Predictions
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for racing predictions and community engagement
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="relative group hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 cursor-pointer">
                {feature.status === 'coming-soon' && (
                  <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Coming Soon
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                  <CardDescription className="group-hover:text-foreground transition-colors duration-300">{feature.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {feature.status === 'active' ? (
                    <Link to={feature.href}>
                      <Button className="w-full">
                        Try It Now
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Make Your Predictions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {isAuthenticated 
              ? "Jump into Nostradouglas and start making your track predictions for the season."
              : "Sign in with Discord to save your predictions and compete with the community."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/nostradouglas">
                <Button size="lg" className="px-8 py-3">
                  Start Predicting
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="px-8 py-3">
                    Sign In
                  </Button>
                </Link>
                <Link to="/nostradouglas">
                  <Button variant="outline" size="lg" className="px-8 py-3">
                    Browse First
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}