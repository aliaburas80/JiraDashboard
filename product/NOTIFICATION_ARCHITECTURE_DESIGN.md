# Advanced Notification Architecture — Plan Only

**Status:** Plan only (`ARCH-04`) — P4 implementation not approved. Nothing in this document
authorizes any code change.

---

## 1. What already exists today

- `Notification` (`prisma/schema.prisma`) — one in-app model: `recipientUserId`, `type`, `title`,
  `message`, optional `relatedEntityType`/`relatedEntityId`, `readAt`, `createdAt`. Single delivery
  channel: in-app only, rendered by `NotificationBell.tsx`.
- `src/lib/system-error-logger.ts` writes rows via `prisma.notification.createMany()` — today's only
  producer is system-error alerting to admins.
- `src/lib/email.ts` already sends transactional email (verification, password reset) over SMTP —
  a real, working delivery channel, just not wired to the `Notification` model at all.
- The Backend Integration Gateway (`GW-01`–`25`) already has typed provider slots for `slack`,
  `teams`, and `push_notification` (`GatewayProviderType`) — none registered/live yet
  (`providerRegistry.ts`'s own header comment: zero providers configured by default).

**The gap this plan addresses:** there is no unified concept of a notification that can fan out to
more than one channel, no per-user channel preference, and no digest/batching — every future
notification producer would otherwise have to reinvent delivery logic per channel, the same
duplicated-business-logic problem CLAUDE.md §5 warns against.

## 2. Proposed architecture

### 2.1 `NotificationEvent` — one logical notification, one call site

A single new domain function, `emitNotification()`, replaces direct `prisma.notification.create()`
calls. It takes a typed event (`type`, `recipientUserId`, `title`, `message`, related-entity refs)
and is the *only* place that decides which channels actually fire, based on:

1. The event `type`'s configured default channels (a typed map, e.g. `system_error → [in_app,
   email]`, `feedback_status_change → [in_app]`) — mirrors `src/lib/analytics/eventTaxonomy.ts`'s
   existing pattern of a typed catalog with per-event metadata, already established in this
   codebase for a similar fan-out problem (P0B-05).
2. The recipient's per-channel opt-in/opt-out (new `NotificationPreference` — see below).
3. A digest window, if the event type is digestible (see 2.3).

The in-app `Notification` row is always written unconditionally (it's the fallback of last resort
and the existing UI depends on it) — only the *additional* channels are conditional.

### 2.2 `NotificationPreference` — per-user, per-type, per-channel

```prisma
model NotificationPreference {
  id             String   @id @default(cuid())
  userId         String
  notificationType String
  channel        String   // "in_app" | "email" | "slack" | "push"
  enabled        Boolean  @default(true)
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, notificationType, channel])
}
```

Absence of a row means "use the type's default channel list" (matches the existing fail-open
default already established for `Consent`/analytics — `getConsentStatus()`'s legacy-field fallback
is the same "no explicit preference recorded yet, use the sane default" pattern). A Settings →
Notifications tab (new, sibling to the existing `PrivacyTab.tsx`/`StorageTab.tsx` pattern) lets a
user toggle channels per type.

### 2.3 Digest/batching for high-frequency event types

Some notification types (e.g. a future "your team's flow health changed") could fire often enough
to be noisy per-event. Digestible types accumulate in the existing `Notification` table (already
happens — in-app is never batched, it's a feed) but *additional* channels (email especially) queue
into a new `NotificationDigestQueue` table instead of firing immediately, flushed by a scheduled
job (same GitHub Actions cron pattern already used for `db-backup.yml`/`data-retention.yml`) at a
per-user-configurable interval (immediate/hourly/daily), collapsing multiple events of the same type
into one email. Non-digestible types (e.g. account security alerts) always fire immediately,
regardless of preference — a type-level flag, not a user-overridable one.

### 2.4 Delivery channel implementations

| Channel | Mechanism | New work required |
|---|---|---|
| `in_app` | `Notification` row (existing) | None — already works |
| `email` | `src/lib/email.ts` (existing SMTP sender) | A notification-specific email template; wiring `emitNotification()` to call it |
| `slack` | Gateway `slack` provider (typed, unregistered) | Register a real Slack app/webhook, wire `callExternal({ provider: 'slack', ... })` |
| `push` | Gateway `push_notification` provider (typed, unregistered) | A real push provider (e.g. Web Push/FCM) behind that gateway slot, plus browser permission UX |

Slack/push are listed for completeness but are not proposed for near-term implementation — email
and in-app cover the near-term need (system alerts to admins, account-lifecycle notices to users)
without a new external dependency.

### 2.5 Explicitly out of scope

- Teams channel — no concrete use case yet, same reasoning as `slack`/`push`; the gateway slot
  exists for when one appears (CLAUDE.md §5.5 — no speculative build-out).
- Any change to how `system-error-logger.ts` decides *what* triggers a notification — this plan is
  about delivery fan-out only, not alerting rules.
- Real-time (WebSocket/SSE) push of new `Notification` rows to `NotificationBell.tsx` — it currently
  polls/refetches on its own existing cadence; that's a separate, unrelated performance ticket.

## 3. Migration path if approved

Purely additive: `NotificationPreference` and `NotificationDigestQueue` are new tables, no changes
to the existing `Notification` model's shape. `emitNotification()` is a new function that
`system-error-logger.ts`'s single existing call site would switch to; nothing else in the codebase
currently creates notifications, so the blast radius of adopting it is exactly one file.

## 4. Recommendation

Do not implement until a second real notification producer exists beyond system-error alerts —
today's single call site doesn't yet justify the preference/digest machinery above; it would be
speculative architecture for one caller (CLAUDE.md §5.5). Revisit when `P0B-08` (Structured error
monitoring) or any user-facing lifecycle notification (e.g. entitlement-expiry warning) is actually
being built — at that point `NotificationPreference` becomes worth the schema addition because two
independent producers with different default-channel needs will exist.
