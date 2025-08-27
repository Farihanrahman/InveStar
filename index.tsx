import React from 'react';
import SEO from './components/SEO';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <SEO />
      <div className="min-h-screen">
        <Navigation />
        <main>
          <HeroSection />
          <FeaturesSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
