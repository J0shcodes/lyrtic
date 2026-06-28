"use client"

import Link from "next/link";
import {ArrowRight, BarChart3, Zap, Brain, Shield, Users, TrendingUp} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Lyrtic</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm hover:text-primary transition">Features</Link>
            <Link href="#pricing" className="text-sm hover:text-primary transition">Pricing</Link>
            <Link href="#faq" className="text-sm hover:text-primary transition">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition">Sign In</Link>
            <Link href="/sign-up" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-sm font-medium text-primary">AI-Powered Customer Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Know Your Customers
              <br className="hidden md:inline" />
              {' '}
              <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Before They Leave
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Lyrtic uses AI to analyze customer behavior, predict churn, and deliver actionable insights. Built for SMBs who want to grow smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#features" className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition">
                Learn More
              </Link>
            </div>
            <p className="text-sm text-muted-foreground pt-4">No credit card required. 14-day free trial.</p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative mt-16 rounded-xl overflow-hidden border border-border bg-muted p-8">
            <div className="aspect-video bg-linear-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="w-16 h-16 mx-auto text-primary/40" />
                <p className="text-muted-foreground">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Everything you need to win</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help small businesses understand and retain their customers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Claude generates insights from your customer data automatically. Understand behavior patterns without manual analysis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Churn Prediction</h3>
              <p className="text-muted-foreground">
                Predict which customers are at risk of leaving. Act before they go with AI-suggested retention strategies.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Segmentation</h3>
              <p className="text-muted-foreground">
                Automatically segment customers by behavior, value, and risk. Target campaigns with precision.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">CSV Import</h3>
              <p className="text-muted-foreground">
                Upload customer data in seconds. Automatic validation and mapping saves hours of manual work.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and backed by AWS Aurora. Built with security and compliance in mind.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Analytics</h3>
              <p className="text-muted-foreground">
                Get live dashboards with key metrics. Watch health scores and churn predictions update in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 border-t border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Get started in minutes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to understand your customers better.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload Data', desc: 'Import your customer data from CSV' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI analyzes patterns and risks' },
              { step: '3', title: 'Take Action', desc: 'Get insights and improve retention' }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {item.step !== '3' && (
                  <div className="hidden md:block absolute top-8 -right-8 text-2xl text-muted-foreground">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="border border-border rounded-xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect to get started</p>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 1,000 customers', 'Basic insights', 'CSV import', 'Email support'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full py-2 px-4 border border-border rounded-lg font-semibold hover:bg-muted transition text-center">
                Start Free
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="border-2 border-primary rounded-xl p-8 flex flex-col relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background px-3 py-1 border border-primary rounded-full text-sm font-semibold text-primary">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-muted-foreground mb-6">For growing businesses</p>
              <div className="text-4xl font-bold mb-6">$99<span className="text-lg text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 10,000 customers', 'Advanced AI insights', 'Churn prediction', 'Smart segments', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition text-center">
                Start Trial
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="border border-border rounded-xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <p className="text-muted-foreground mb-6">For enterprises</p>
              <div className="text-4xl font-bold mb-6">$499<span className="text-lg text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited customers', 'Custom AI models', 'API access', 'Team collaboration', 'SLA support'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full py-2 px-4 border border-border rounded-lg font-semibold hover:bg-muted transition text-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 border-t border-border bg-linear-to-br from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to know your customers better?</h2>
          <p className="text-xl text-muted-foreground">
            Join the SMBs who are using Lyrtic to predict churn and grow smarter.
          </p>
          <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Lyrtic</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition">Terms</Link>
              <Link href="#" className="hover:text-foreground transition">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Lyrtic. All rights reserved. Built with AI for SMBs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
