// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Role-Based Coaching orchestrator (RBC-15/16) — maps an AppRole to its
// visible coaching categories and generates the full insight bundle.
//
// Role -> category mapping (user-approved — see TODO-List.md Section 16 /
// product/ALGORITHM_SPEC.md "Role-Based Coaching"):
//   scrum_master  -> [scrum_master]
//   product_owner -> [product_owner]
//   manager       -> [engineering_manager, delivery_manager, team_lead] (EM first)
//   c_level       -> [c_level]
//   admin         -> all 7 categories
//   user / other  -> [team_lead] (generic contributor default)

import type { DashboardMetrics } from '@/types/metrics';
import type { CoachingCategory, CoachingInsightsBundle, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import type { AdminCoachingSignals } from './adminSignals.service';
import { buildCeremonyAdvice } from './ceremonyAdvice.service';
import { generateScrumMasterInsight } from './generators/scrumMaster.generator';
import { generateProductOwnerInsight } from './generators/productOwner.generator';
import { generateEngineeringManagerInsight } from './generators/engineeringManager.generator';
import { generateDeliveryManagerInsight } from './generators/deliveryManager.generator';
import { generateTeamLeadInsight } from './generators/teamLead.generator';
import { generateCLevelInsight } from './generators/cLevel.generator';
import { generateAdminInsight } from './generators/admin.generator';

export function visibleCategoriesForRole(role: string | null | undefined): CoachingCategory[] {
  switch (role) {
    case 'scrum_master':  return ['scrum_master'];
    case 'product_owner': return ['product_owner'];
    case 'manager':        return ['engineering_manager', 'delivery_manager', 'team_lead'];
    case 'c_level':        return ['c_level'];
    case 'admin':
      return [
        'scrum_master', 'product_owner', 'engineering_manager',
        'delivery_manager', 'team_lead', 'c_level', 'admin',
      ];
    case 'user':
    default:
      return ['team_lead'];
  }
}

export function generateAllCoachingInsights(
  metrics: DashboardMetrics,
  role: string | null | undefined,
  adminSignals?: AdminCoachingSignals,
): CoachingInsightsBundle {
  const ceremonyAdvice = buildCeremonyAdvice(metrics);
  const categories = visibleCategoriesForRole(role);

  const generatorMap: Record<CoachingCategory, () => RoleBasedCoachingInsight> = {
    scrum_master: () => generateScrumMasterInsight(metrics, ceremonyAdvice),
    product_owner: () => generateProductOwnerInsight(metrics, ceremonyAdvice),
    engineering_manager: () => generateEngineeringManagerInsight(metrics, ceremonyAdvice),
    delivery_manager: () => generateDeliveryManagerInsight(metrics, ceremonyAdvice),
    team_lead: () => generateTeamLeadInsight(metrics, ceremonyAdvice),
    c_level: () => generateCLevelInsight(metrics, ceremonyAdvice),
    admin: () => generateAdminInsight(metrics, ceremonyAdvice, adminSignals),
  };

  return {
    generatedAt: new Date().toISOString(),
    categories: categories.map((category) => generatorMap[category]()),
  };
}
