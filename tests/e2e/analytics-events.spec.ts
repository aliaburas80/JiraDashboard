// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-07: real Postgres-backed persistence + idempotency regression coverage.
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('P0B-07: duplicate analytics retries are acknowledged but stored once', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'Desktop Chrome', 'Database persistence coverage only needs one browser project.');

  const eventId = `e2e-analytics-${randomUUID()}`;
  const event = {
    event_id: eventId,
    schema_version: 1,
    event_name: 'page_viewed',
    occurred_at: new Date().toISOString(),
    user_id: null,
    anonymous_id: `anon-${randomUUID()}`,
    session_id: `session-${randomUUID()}`,
    page: '/dashboard',
    section: 'summary',
    component: null,
    app_version: 'e2e',
    role: null,
    browser_family: 'Playwright',
    browser_major: '1',
    os_family: 'Linux',
    device_category: 'desktop',
    result_status: 'success',
    duration_ms: 12,
    properties: { source: 'p0b-07-e2e', retry: false },
  };

  try {
    const first = await request.post('/api/events', { data: { events: [event] } });
    expect(first.status()).toBe(200);
    expect(await first.json()).toMatchObject({ accepted: [eventId], rejected: [] });

    const retry = await request.post('/api/events', {
      data: { events: [{ ...event, properties: { ...event.properties, retry: true } }] },
    });
    expect(retry.status()).toBe(200);
    expect(await retry.json()).toMatchObject({ accepted: [eventId], rejected: [] });

    const rows = await prisma.productAnalyticsEvent.findMany({
      where: { eventId },
      select: { eventId: true, eventName: true, page: true, propertiesJson: true },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      eventId,
      eventName: 'page_viewed',
      page: '/dashboard',
      propertiesJson: JSON.stringify({ source: 'p0b-07-e2e', retry: false }),
    });
  } finally {
    await prisma.productAnalyticsEvent.deleteMany({ where: { eventId } });
  }
});
