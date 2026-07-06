// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// In-app landing page — premium SaaS product showcase (9.38).
// Dark full-bleed hero, then light/white sections below, per the approved
// mockup direction. The shared AppShell navigation is reused exactly as-is —
// this page only supplies its own content below it.
//
// Section order mirrors /promo's proven narrative arc (hook → concept → steps
// → depth → value → proof → trust visual → ask), rather than the previous
// order which buried stats/proof in the middle: Hero → ProductFlow (big
// picture) → HowItWorks (concrete steps) → FeatureUniverse (full depth) →
// BusinessValue (why it matters) → MetricsStrip (scale/proof) →
// DashboardPreview (visual proof, right before the ask) → FinalCTA.
'use client';

import AppShell from '@/components/layout/AppShell';
import LandingHero from './components/LandingHero';
import ProductFlowSection from './components/ProductFlowSection';
import HowItWorksSection from './components/HowItWorksSection';
import FeatureUniverse from './components/FeatureUniverse';
import BusinessValueSection from './components/BusinessValueSection';
import MetricsStrip from './components/MetricsStrip';
import DashboardPreview from './components/DashboardPreview';
import FinalCTA from './components/FinalCTA';

export default function LandingPage() {
  return (
    <AppShell showNav>
      <LandingHero />
      <ProductFlowSection />
      <HowItWorksSection />
      <FeatureUniverse />
      <BusinessValueSection />
      <MetricsStrip />
      <DashboardPreview />
      <FinalCTA />
    </AppShell>
  );
}
