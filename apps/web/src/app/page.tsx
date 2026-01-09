"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Settings,
  ArrowRight,
  BarChart3,
  Layers,
  CheckCircle2,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10">
              <Image
                src="/branding/logo.png"
                alt="AxonVantage Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AxonVantage
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-white transition-colors">Solutions</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm border-white/5 hover:bg-white/5 text-gray-300">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 font-semibold">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-pulse">
              <Zap className="h-4 w-4" />
              <span>Next-Gen Industrial Intelligence</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Operational <span className="text-blue-500">Excellence</span> <br />
              Without Compromise
            </h1>
            <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
              AxonVantage Systems provides the industrial-grade framework your facility needs to minimize downtime, maximize efficiency, and ensure total compliance.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 rounded-xl text-lg font-bold">
                  Start FREE Trial
                </Button>
              </Link>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0a0a0b] bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                    USER
                  </div>
                ))}
                <div className="pl-4 flex flex-col justify-center">
                  <div className="text-sm font-bold text-white">5,000+ Teams</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scaling with AxonVantage</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10"
          >
            <Image
              src="/branding/hero.png"
              alt="Industrial Dashboard Preview"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-60" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { value: "99.9%", label: "Asset Uptime" },
            { value: "40%", label: "Lower Costs" },
            { value: "12min", label: "Initial Setup" },
            { value: "ISO", label: "Compliance Direct" },
          ].map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-4xl font-bold text-white mb-1 group-hover:text-blue-500 transition-colors">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">Precision Tools for Industrial Leaders</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              We've re-engineered the CMMS from the ground up to handle the world's most demanding facilities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: "Asset Hierarchy", desc: "Map complex multi-site operations with infinite nesting and location-based filtering.", color: "blue" },
              { icon: Shield, title: "Security First", desc: "Enterprise-grade SOC2 compliance with multi-tenant isolation and strict audit logging.", color: "green" },
              { icon: BarChart3, title: "RIME Scoring", desc: "Prioritize maintenance based on true Ranking Index for Maintenance Expenditures.", color: "orange" },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className={`h-12 w-12 rounded-xl bg-${f.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 text-${f.color}-500`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">Built for Every Tier</h2>
            <p className="text-gray-400 text-lg">Scalable pricing for startups to global conglomerates.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "$0", features: ["Up to 5 Admins", "100 Active Assets", "Basic Reports", "Mobile App"], cta: "Start Free", popular: false },
              { name: "Pro", price: "$299", features: ["Up to 25 Admins", "1,000 Active Assets", "Advanced failure diagnostics", "Full Audit Logs"], cta: "Go Professional", popular: true },
              { name: "Enterprise", price: "Custom", features: ["Unlimited Everything", "SSO & SAML Auth", "White-Label Options", "24/7 Priority Support"], cta: "Contact Sales", popular: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-10 rounded-3xl border ${plan.popular ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/5'} flex flex-col`}
              >
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black italic">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-gray-500 font-medium">/mo</span>}
                  </div>
                </div>
                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/register" className="w-full">
                  <Button
                    className={`w-full h-12 rounded-xl text-sm font-bold transition-all ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="relative h-6 w-6">
                <Image src="/branding/logo.png" alt="AxonVantage Logo" fill className="object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight">AxonVantage</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Next-generation industrial operational intelligence and work order management.
            </p>
          </div>

          <div className="flex gap-12 text-sm font-medium text-gray-400">
            <div className="space-y-4">
              <div className="text-white text-xs uppercase tracking-widest font-bold">Product</div>
              <div className="flex flex-col gap-2">
                <a href="#" className="hover:text-white">Features</a>
                <a href="#" className="hover:text-white">Security</a>
                <a href="#" className="hover:text-white">API</a>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-white text-xs uppercase tracking-widest font-bold">Company</div>
              <div className="flex flex-col gap-2">
                <a href="#" className="hover:text-white">About</a>
                <a href="#" className="hover:text-white">Contact</a>
                <a href="#" className="hover:text-white">Privacy</a>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
          &copy; 2026 AxonVantage Systems. Built for Industrial Excellence.
        </div>
      </footer>
    </div>
  );
}
