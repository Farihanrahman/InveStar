import React from 'react';
import { ArrowRight, Globe, Shield, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium">
              <Globe className="w-4 h-4 mr-2" />
              Trusted by 10,000+ users worldwide
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Transform Global Finance with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Stellar Blockchain
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
              Send money worldwide in seconds with competitive rates. Built on Stellar blockchain for security, speed, and global reach.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-all duration-200 hover:bg-white/10">
                Watch Demo
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-300">Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-300">Instant Transfers</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main Card */}
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              {/* Wallet Balance */}
              <div className="text-center mb-6">
                <p className="text-gray-300 text-sm mb-2">Wallet Balance</p>
                <p className="text-3xl font-bold text-white">$2,450.75</p>
                <p className="text-blue-300 text-sm">≈ 12,253.75 XLM</p>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg p-4 text-center transition-all duration-200">
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm">Send</p>
                </button>
                <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg p-4 text-center transition-all duration-200">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white rotate-180" />
                  </div>
                  <p className="text-white font-medium text-sm">Receive</p>
                </button>
              </div>
              
              {/* Recent Activity */}
              <div className="space-y-3">
                <p className="text-gray-300 text-sm font-medium">Recent Activity</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Sent to John</span>
                    <span className="text-red-400">-$150.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Received from Sarah</span>
                    <span className="text-green-400">+$75.50</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Globe className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19.84,79.78-38.12,119.65-44.46C427.34,1.85,486.09,12.81,545.67,30.65,604.26,48.49,662.88,72.8,721.48,97.18,780.07,121.58,838.67,144.88,897.26,166.6,955.85,188.92,1014.44,206.8,1073,225.38,1131.59,244.12,1190.18,263.11,1200,272V0Z" opacity=".5" fill="currentColor"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,120.23-12.33,181.22-6.88,30.75,2.7,59.6,8.77,88.6,16.07,73.39,18.29,146.09,42.62,216.84,63.96,35.92,10.71,74.56,21.75,112.65,33.46C1073.9,113.58,1259.4,245,1372.15,246.47,1484.91,248.84,1597.6,240.2,1699.15,223.73c50.38-8.08,98.76-17.51,147.13-26.17,48.37-8.66,96.74-16.93,145.11-25.81,48.37-8.88,96.74-18.36,145.11-25.41,48.37-7.05,96.74-11.69,145.11-14.9,48.37-3.22,96.74-5.04,145.11-5.43V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </section>
  );
}