import {
  buildOllamaHeaders,
  isLocalOrPrivateOllamaUrl,
  resolveOllamaRuntimeConfig,
} from '@/lib/intelligence/ollamaRuntime';

describe('Delivery Intelligence Ollama runtime policy', () => {
  it('allows localhost and RFC1918/private endpoints without a public gateway', () => {
    expect(isLocalOrPrivateOllamaUrl('http://127.0.0.1:11434')).toBe(true);
    expect(isLocalOrPrivateOllamaUrl('http://10.10.0.12:11434')).toBe(true);
    expect(isLocalOrPrivateOllamaUrl('http://172.20.1.5:11434')).toBe(true);
    expect(isLocalOrPrivateOllamaUrl('http://192.168.1.8:11434')).toBe(true);
    expect(isLocalOrPrivateOllamaUrl('https://ai.deliveryclarity.app')).toBe(false);
  });

  it('adds a bearer token only when configured', () => {
    expect(buildOllamaHeaders()).toEqual({ 'content-type': 'application/json' });
    expect(buildOllamaHeaders('  secret-token  ')).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer secret-token',
    });
  });

  it('allows the default localhost runtime in production', () => {
    expect(resolveOllamaRuntimeConfig({ NODE_ENV: 'production' })).toEqual({
      baseUrl: 'http://127.0.0.1:11434',
    });
  });

  it('allows private HTTP in production for a genuinely private inference network', () => {
    expect(resolveOllamaRuntimeConfig({
      NODE_ENV: 'production',
      OLLAMA_BASE_URL: 'http://10.0.0.20:11434',
    })).toEqual({ baseUrl: 'http://10.0.0.20:11434' });
  });

  it('rejects a public HTTP Ollama endpoint even when a token is present', () => {
    expect(resolveOllamaRuntimeConfig({
      NODE_ENV: 'production',
      OLLAMA_BASE_URL: 'http://ai.deliveryclarity.app',
      OLLAMA_AUTH_TOKEN: 'secret-token',
    })).toBeNull();
  });

  it('rejects a public HTTPS gateway without authentication', () => {
    expect(resolveOllamaRuntimeConfig({
      NODE_ENV: 'production',
      OLLAMA_BASE_URL: 'https://ai.deliveryclarity.app',
    })).toBeNull();
  });

  it('allows a public HTTPS gateway only with a server-side bearer token', () => {
    expect(resolveOllamaRuntimeConfig({
      NODE_ENV: 'production',
      OLLAMA_BASE_URL: 'https://ai.deliveryclarity.app/',
      OLLAMA_AUTH_TOKEN: '  secret-token  ',
    })).toEqual({
      baseUrl: 'https://ai.deliveryclarity.app',
      authToken: 'secret-token',
    });
  });

  it('keeps non-production development flexible for local proxy testing', () => {
    expect(resolveOllamaRuntimeConfig({
      NODE_ENV: 'development',
      OLLAMA_BASE_URL: 'http://dev-ollama.example.test:11434',
    })).toEqual({ baseUrl: 'http://dev-ollama.example.test:11434' });
  });
});
