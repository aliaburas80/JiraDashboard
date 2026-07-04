// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Configurable issue-type hierarchy — types/defaults, storage service, admin
// route, and the generalized (no-longer-hardcoded) hierarchy.service.ts logic
// that consumes it. See TODO-List.md Section 19a, "ISSUETYPE" item.

export {};

const mockSession = {
  isLoggedIn: true,
  role: 'admin' as string,
  email: 'admin@test.com',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

afterEach(() => {
  jest.resetModules();
  jest.dontMock('fs');
  mockSession.isLoggedIn = true;
  mockSession.role = 'admin';
});

// ── Defaults ──────────────────────────────────────────────────────────────────

describe('TC-IT-01 to TC-IT-03: defaults', () => {
  test('TC-IT-01: DEFAULT_ISSUE_TYPES includes Product as the topmost root level', async () => {
    const { DEFAULT_ISSUE_TYPES } = await import('../types/issueTypeHierarchy');
    const minLevel = Math.min(...DEFAULT_ISSUE_TYPES.map(t => t.level));
    const roots = DEFAULT_ISSUE_TYPES.filter(t => t.level === minLevel);
    expect(roots.map(t => t.label)).toEqual(['Product']);
  });

  test('TC-IT-02: DEFAULT_ISSUE_TYPES orders Product -> Project -> Epic -> Story -> Sub-task by level', async () => {
    const { DEFAULT_ISSUE_TYPES } = await import('../types/issueTypeHierarchy');
    const byId = (id: string) => DEFAULT_ISSUE_TYPES.find(t => t.id === id)!.level;
    expect(byId('product')).toBeLessThan(byId('project'));
    expect(byId('project')).toBeLessThan(byId('epic'));
    expect(byId('epic')).toBeLessThan(byId('story'));
    expect(byId('story')).toBeLessThan(byId('sub-task'));
  });

  test('TC-IT-03: buildIssueTypeId slugifies and de-duplicates against existing ids', async () => {
    const { buildIssueTypeId } = await import('../types/issueTypeHierarchy');
    expect(buildIssueTypeId('My Custom Type', [])).toBe('my-custom-type');
    expect(buildIssueTypeId('Epic', ['epic'])).toBe('epic-2');
  });
});

// ── Storage service ───────────────────────────────────────────────────────────

describe('TC-IT-04 to TC-IT-06: issueTypeHierarchy.service.ts', () => {
  test('TC-IT-04: readIssueTypeHierarchy falls back to defaults when no file exists', async () => {
    jest.doMock('fs', () => ({ existsSync: jest.fn(() => false) }));
    const { readIssueTypeHierarchy } = await import('../services/settings/issueTypeHierarchy.service');
    const { DEFAULT_ISSUE_TYPES } = await import('../types/issueTypeHierarchy');
    expect(readIssueTypeHierarchy().types).toEqual(DEFAULT_ISSUE_TYPES);
  });

  test('TC-IT-05: writeIssueTypeHierarchy persists and readIssueTypeHierarchy returns it back', async () => {
    const files: Record<string, string> = {};
    jest.doMock('fs', () => ({
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
      existsSync: jest.fn((path: string) => path in files),
      readFileSync: jest.fn((path: string) => files[path]),
    }));
    const { readIssueTypeHierarchy, writeIssueTypeHierarchy } = await import('../services/settings/issueTypeHierarchy.service');
    const customConfig = {
      types: [{ id: 'widget', label: 'Widget', matchNames: ['widget'], level: 0, icon: 'package', color: '#000', bg: '#fff', border: '#ccc', size: 'md' as const, builtIn: false }],
      updatedAt: '2026-06-22T00:00:00.000Z',
      updatedBy: 'admin@test.com',
    };
    writeIssueTypeHierarchy(customConfig);
    expect(readIssueTypeHierarchy()).toEqual(customConfig);
  });

  test('TC-IT-06: readIssueTypeHierarchy falls back to defaults on a corrupt/empty types array', async () => {
    jest.doMock('fs', () => ({
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify({ types: [] })),
    }));
    const { readIssueTypeHierarchy } = await import('../services/settings/issueTypeHierarchy.service');
    const { DEFAULT_ISSUE_TYPES } = await import('../types/issueTypeHierarchy');
    expect(readIssueTypeHierarchy().types).toEqual(DEFAULT_ISSUE_TYPES);
  });
});

// ── Admin API route ────────────────────────────────────────────────────────────

describe('TC-IT-07 to TC-IT-13: GET/POST /api/admin/issue-type-hierarchy', () => {
  test('TC-IT-07: GET requires authentication', async () => {
    mockSession.isLoggedIn = false;
    const { GET } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test('TC-IT-08: GET returns the config for any logged-in user (not admin-only)', async () => {
    mockSession.role = 'user';
    const { GET } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.config.types.length).toBeGreaterThan(0);
  });

  test('TC-IT-09: POST requires admin role', async () => {
    mockSession.role = 'user';
    const { POST } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const req = { json: async () => ({ types: [] }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  test('TC-IT-10: POST rejects an empty types array', async () => {
    const { POST } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const req = { json: async () => ({ types: [] }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('TC-IT-11: POST rejects two types mapped to the same raw issue type name', async () => {
    const { POST } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const req = { json: async () => ({ types: [
      { id: 'a', label: 'A', matchNames: ['dup'], level: 0 },
      { id: 'b', label: 'B', matchNames: ['dup'], level: 1 },
    ] }) } as any;
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('dup');
  });

  test('TC-IT-12: POST rejects deleting a built-in type', async () => {
    jest.doMock('fs', () => ({
      existsSync: jest.fn(() => false),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
    }));
    const { POST } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const req = { json: async () => ({ types: [
      { id: 'custom-only', label: 'Custom', matchNames: ['custom'], level: 0 },
    ] }) } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('TC-IT-13: POST accepts a valid custom type and persists it', async () => {
    const files: Record<string, string> = {};
    jest.doMock('fs', () => ({
      existsSync: jest.fn((path: string) => path in files),
      readFileSync: jest.fn((path: string) => files[path]),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
    }));
    const { DEFAULT_ISSUE_TYPES } = await import('../types/issueTypeHierarchy');
    const { POST } = await import('../../app/api/admin/issue-type-hierarchy/route');
    const types = [
      ...DEFAULT_ISSUE_TYPES,
      { id: 'theme-custom', label: 'Strategic Theme', matchNames: ['strategic theme'], level: 0, icon: 'flag', color: '#000', bg: '#fff', border: '#ccc', size: 'lg', builtIn: false },
    ];
    const req = { json: async () => ({ types }) } as any;
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.config.types.some((t: any) => t.id === 'theme-custom')).toBe(true);
  });
});

// ── Generalized hierarchy.service.ts logic ─────────────────────────────────────

describe('TC-IT-14 to TC-IT-17: hierarchy.service.ts with custom multi-level config', () => {
  function flowItem(key: string, type: string, extra: Record<string, unknown> = {}) {
    return { key, type, summary: `Summary ${key}`, status: 'Backlog', assignee: 'Unassigned', health: 'good', storyPoints: 0, parent: '', epic: '', isOrphan: false, ...extra };
  }

  const customTypes = [
    { id: 'widget', label: 'Widget', matchNames: ['widget'], level: 0, icon: 'package', color: '#000', bg: '#fff', border: '#ccc', size: 'lg' as const, builtIn: false },
    { id: 'gadget', label: 'Gadget', matchNames: ['gadget'], level: 1, icon: 'flag', color: '#000', bg: '#fff', border: '#ccc', size: 'md' as const, builtIn: false },
  ];

  test('TC-IT-14: a custom 2-level hierarchy infers the parent link via prefix matching', async () => {
    const { reconstructHierarchy } = await import('../services/relations/hierarchy.service');
    const widget = flowItem('CUST-1', 'Widget');
    const gadget = flowItem('CUST-2', 'Gadget'); // no explicit parent/epic
    const map = reconstructHierarchy([widget, gadget], customTypes);
    expect(map.epic.get('CUST-2')).toBe('CUST-1');
  });

  test('TC-IT-15: the topmost custom root level is never flagged as an orphan', async () => {
    const { reconstructHierarchy } = await import('../services/relations/hierarchy.service');
    const widget = flowItem('CUST-1', 'Widget'); // no parent — it's the root
    const map = reconstructHierarchy([widget], customTypes);
    expect(map.orphanKeys.has('CUST-1')).toBe(false);
  });

  test('TC-IT-16: an unrecognized type (not in the configured types) is never inferred a parent', async () => {
    const { reconstructHierarchy } = await import('../services/relations/hierarchy.service');
    const mystery = flowItem('CUST-9', 'Mystery'); // not in customTypes at all
    const widget  = flowItem('CUST-1', 'Widget');
    const map = reconstructHierarchy([widget, mystery], customTypes);
    expect(map.epic.has('CUST-9')).toBe(false);
    expect(map.parent.has('CUST-9')).toBe(false);
  });

  test('TC-IT-17: relationExplorer.service.ts resolves a custom type label via the configured types, not the old hardcoded TYPE_MAP', async () => {
    const { buildRelationGraph } = await import('../services/relations/relationExplorer.service');
    const widget = flowItem('CUST-1', 'Widget');
    const graph = buildRelationGraph('CUST-1', [widget], customTypes);
    expect(graph?.focusType).toBe('Widget');
  });
});
