import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, Users, Target } from 'lucide-react'

export function LandingPage() {
  const { isAuthenticated, isAdmin, signInWithDiscord } = useAuth()

  const features = [
    {
      title: 'Nostradouglas',
      description: 'Think you can predict the CJA season schedule? Put your crystal ball to the test and see if you can outsmart the Admins.',
      href: '/nostradouglas',
      status: 'active',
      icon: Target,
      highlight: 'Live Now',
      showAlways: true
    },
    {
      title: 'Community Hub',
      description: 'Join the chaos! See what fellow racing addicts are predicting, argue about track selections, and collectively pretend we know what we\'re doing.',
      href: '/community',
      status: 'admin-only',
      icon: Users,
      highlight: 'Admin Only',
      showAlways: false,
      adminOnly: true
    },
    {
      title: 'More Features Coming',
      description: 'We\'re cooking up some exciting new tools for the community.',
      href: '#',
      status: 'coming-soon',
      icon: Trophy,
      highlight: 'Stay Tuned',
      showAlways: true
    }
  ].filter(feature => feature.showAlways || (feature.adminOnly && isAdmin))

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            Coach Jeffries
            <span className="block text-primary">Academy</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            Your hub for setup reviews and racing insights.
          </p>
          <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
            Discover the best setup shops, read community reviews, and get personalized recommendations for your sim racing needs.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 py-4 text-lg"
                onClick={() => signInWithDiscord()}
              >
                🚀 Jump In
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-secondary/10 to-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              🎯 What's Inside
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Your CJA Arsenal
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful tools to feed your obsession. Each one designed to either make you look brilliant or provide entertainment for others.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon
              return (
                <Card key={feature.title} className="relative group hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 ease-out hover:scale-[1.02] cursor-pointer bg-card/50 backdrop-blur-sm">
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      feature.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : feature.status === 'admin-only'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {feature.highlight}
                    </span>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {(feature.status === 'active' || feature.status === 'admin-only') && feature.href !== '#' ? (
                      <Link to={feature.href}>
                        <Button className="w-full text-base py-3 group-hover:bg-primary/90 transition-all duration-300">
                          {feature.title === 'Nostradouglas' ? '🔮 Make Predictions' : feature.title === 'Community Hub' ? '💬 Join the Discussion' : 'Explore Now'}
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full text-base py-3 opacity-60">
                        {feature.title === 'More Features Coming' ? '🔥 Coming Soon' : '🚧 Building Something Epic...'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"></div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              🏆 The Moment of Truth
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {isAuthenticated
                ? "Welcome to the Academy"
                : "Ready to Join the Community?"
              }
            </h2>
            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
              {isAuthenticated
                ? "Explore powerful tools and connect with fellow racing enthusiasts. The CJA community is here to help you get the most out of your sim racing experience."
                : "Join our community of racing enthusiasts. Share knowledge, discover new tools, and connect with others who share your passion."
              }
            </p>
            <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
              {isAuthenticated
                ? "Check out our setup shop reviews and recommendations to find the perfect setup for your racing needs."
                : "Sign in with Discord to unlock all features and join the conversation."
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/setup-reviews">
                  <Button size="lg" className="px-10 py-4 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300">
                    🔧 Browse Setup Reviews
                  </Button>
                </Link>
                <Link to="/setup-recommendations">
                  <Button variant="outline" size="lg" className="px-10 py-4 text-lg border-2 hover:bg-secondary/50 transition-all duration-300">
                    🎯 Get Recommendations
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="px-10 py-4 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => signInWithDiscord()}
                >
                  🚀 Join the Academy
                </Button>
              </>
            )}
          </div>
          
          {/* <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground/70 italic">
              "The right setup can make all the difference on track." - Coach Jeffries
            </p>
          </div> */}
        </div>
      </section>
    </div>
  )
}