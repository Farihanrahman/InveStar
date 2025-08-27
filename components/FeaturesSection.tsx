import React from 'react';
import { Globe, Shield, Zap, DollarSign, Lock, Users, TrendingUp, Smartphone } from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Send money to 200+ countries with 350,000+ MoneyGram locations worldwide.',
    stats: '200+ Countries',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Built on Stellar blockchain with OAuth 2.0 authentication and AES-256 encryption.',
    stats: '99.9% Uptime',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'Instant Transfers',
    description: 'Complete transactions in seconds with real-time settlement on the Stellar network.',
    stats: '< 5 Seconds',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: DollarSign,
    title: 'Competitive Rates',
    description: 'Up to 90% lower fees than traditional banks with transparent pricing.',
    stats: '90% Savings',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Lock,
    title: 'Multi-Currency',
    description: 'Support for 100+ currencies with live exchange rates and real-time quotes.',
    stats: '100+ Currencies',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Users,
    title: 'Trusted Network',
    description: 'Partnerships with MoneyGram, Stellar Foundation, and leading financial institutions.',
    stats: '10K+ Users',
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: TrendingUp,
    title: 'Real-Time FX',
    description: 'Live exchange rates updated every second for accurate pricing and quotes.',
    stats: 'Live Rates',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Progressive Web App with offline support and native mobile experience.',
    stats: 'PWA Ready',
    color: 'from-cyan-500 to-blue-500'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why Choose{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              InveStar
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of global finance with cutting-edge blockchain technology, 
            competitive rates, and unparalleled security.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Stats */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                {feature.stats}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-left">
              <p className="text-sm text-gray-600">Ready to get started?</p>
              <p className="text-lg font-semibold text-gray-900">Create your free wallet in minutes</p>
            </div>
            <button className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}