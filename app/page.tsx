import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BarChart2, Shield, Globe, Users, Clock, Zap, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-2/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute h-48 w-48 bg-primary/30 rounded-full blur-3xl top-1/2 -left-12 animate-pulse" />
        <div className="absolute h-48 w-48 bg-chart-1/30 rounded-full blur-3xl bottom-0 right-0 animate-pulse delay-700" />
        
        <div className="relative container mx-auto px-6 py-24 flex flex-col items-center text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm space-x-2 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-1 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-1"></span>
            </span>
            <span>Monitoring 10,000+ locations worldwide</span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Main Headline */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Monitor Food Safety{' '}
              <span className="bg-gradient-to-r from-chart-1 to-chart-2 text-transparent bg-clip-text">In Real-Time</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Protect your customers and brand with AI-powered outbreak detection. Get alerts before issues escalate.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/dashboard"
            >
            <Button size="lg" className="space-x-2 h-12 px-6">
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            </Link>
            <Button size="lg" variant="outline" className="space-x-2 h-12 px-6 backdrop-blur-sm bg-background/50">
              Watch Demo
              <Zap className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="w-full max-w-4xl mt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-background/50 backdrop-blur-sm border">
              {[
                { icon: Globe, text: "Expanding Coverage", stat: "13 states covered" },
                { icon: Shield, text: "FDA/HIPAA Compliant", stat: "100%" },
                { icon: Clock, text: "Timezone Monitoring", stat: "24/7" },
                { icon: AlertTriangle, text: "Continuous Monitoring", stat: "Every 10 seconds" }
              ].map(({ icon: Icon, text, stat }, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="font-semibold">{stat}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-4">
          <div className="text-primary font-medium text-xl">Features</div>
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to stay ahead</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools for food safety professionals, powered by advanced AI and real-time analytics
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: AlertTriangle,
              title: "Early Warning System",
              description: "Get instant alerts about potential outbreaks before they spread. Our AI analyzes patterns across multiple data sources."
            },
            {
              icon: BarChart2,
              title: "Real-time Analytics",
              description: "Interactive dashboards and reports help you understand trends and make data-driven decisions quickly."
            },
            {
              icon: Shield,
              title: "Risk Assessment",
              description: "Prioritize risks and allocate resources effectively with our ML-powered risk scoring system."
            }
          ].map(({ icon: Icon, title, description }, i) => (
            <div key={i} className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col space-y-4 p-8 bg-card rounded-3xl border hover:border-primary transition-colors h-full">
                <div className="p-3 w-fit rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="border-t bg-muted/50">
        <div className="container mx-auto px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-chart-1 p-12">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
            <div className="relative text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Ready to get started?</h2>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Join thousands of food safety professionals who trust our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="space-x-2 h-12 px-6">
                  Start Monitoring Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="space-x-2 h-12 px-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Schedule a Demo
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer Section (unfinished) 
      <div>
        <footer className="container mx-auto px-6 py-12 mt-8 text-center text-gray-200 bg-gradient-to-tl from-gray-700 to-gray-500 p-12">
          <p></p>
        </footer>
      </div>
      */}
    </div>
  );
}