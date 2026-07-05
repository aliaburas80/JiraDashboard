// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// In-app landing page — premium SaaS product showcase (9.38).
// Dark full-bleed hero, then light/white sections below, per the approved
// mockup direction. The shared AppShell navigation is reused exactly as-is —
// this page only supplies its own content below it.
'use client';

import AppShell from '@/components/layout/AppShell';
import LandingHero from './components/LandingHero';
import ProductFlowSection from './components/ProductFlowSection';
import HowItWorksSection from './components/HowItWorksSection';
import MetricsStrip from './components/MetricsStrip';
import FeatureUniverse from './components/FeatureUniverse';
import DashboardPreview from './components/DashboardPreview';
import BusinessValueSection from './components/BusinessValueSection';
import FinalCTA from './components/FinalCTA';
import ScrollProgressRail from './components/ScrollProgressRail';

export default function LandingPage() {
  return (
    <AppShell showNav>
      <ScrollProgressRail />
      <LandingHero />
      <ProductFlowSection />
      <HowItWorksSection />
      <MetricsStrip />
      <FeatureUniverse />
      <DashboardPreview />
      <BusinessValueSection />
      <FinalCTA />
    </AppShell>
  );
}
