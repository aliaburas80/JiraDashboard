import { redirect } from 'next/navigation';

// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// /readiness was a confirmed content-level duplicate of /release-readiness —
// both called calculateReleaseReadiness() against the same ReleaseReadinessSummary
// type, and every element this page rendered (summary chips, per-release verdict
// list) was reproduced inside /release-readiness, which additionally computes 7
// global quality-gate checks this page never had. Retired 2026-07-13 per the
// product audit's Keep/Merge/Remove analysis (docs/product-audit/
// 04-remove-merge-keep.md R-01) rather than deleted outright, since it had a
// live public incoming link (the landing page's FeatureUniverse, now repointed).
export default function ReadinessRedirect() {
  redirect('/release-readiness');
}
