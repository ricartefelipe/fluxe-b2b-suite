import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RuntimeConfigService } from '../runtime-config.service';
import { DEFAULT_CONFIG, type AppConfig } from '../app-config.model';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let httpCtrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RuntimeConfigService);
    httpCtrl = TestBed.inject(HttpTestingController);
  });

  it('exposes DEFAULT_CONFIG before load()', () => {
    expect(service.get('coreApiBaseUrl')).toBe(DEFAULT_CONFIG.coreApiBaseUrl);
    expect(service.get('authMode')).toBe('dev');
    expect(service.get('logLevel')).toBe('debug');
    expect(service.get('version')).toBe('0.0.0');
  });

  it('load() merges fetched config with defaults', async () => {
    const partial: Partial<AppConfig> = {
      coreApiBaseUrl: 'https://api.prod.example.com',
      authMode: 'oidc',
      version: '1.2.3',
    };

    const loadPromise = service.load();
    const req = httpCtrl.expectOne('/assets/config.json');
    req.flush(partial);
    await loadPromise;

    expect(service.get('coreApiBaseUrl')).toBe('https://api.prod.example.com');
    expect(service.get('authMode')).toBe('oidc');
    expect(service.get('version')).toBe('1.2.3');
    expect(service.get('ordersApiBaseUrl')).toBe(DEFAULT_CONFIG.ordersApiBaseUrl);
    expect(service.get('paymentsApiBaseUrl')).toBe(DEFAULT_CONFIG.paymentsApiBaseUrl);
  });

  it('load() falls back to defaults when HTTP request fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const loadPromise = service.load();
    const req = httpCtrl.expectOne('/assets/config.json');
    req.error(new ProgressEvent('Network error'));
    await loadPromise;

    expect(service.get('coreApiBaseUrl')).toBe(DEFAULT_CONFIG.coreApiBaseUrl);
    expect(service.get('authMode')).toBe('dev');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not load config.json'),
    );
    warnSpy.mockRestore();
  });

  it('config signal is readonly', () => {
    const cfg = service.config;
    expect(cfg()).toEqual(DEFAULT_CONFIG);
  });

  it('get() returns typed values for all keys', () => {
    expect(typeof service.get('logLevel')).toBe('string');
    expect(typeof service.get('coreApiBaseUrl')).toBe('string');
  });
});

describe('DEFAULT_CONFIG', () => {
  it('uses dev authMode by default', () => {
    expect(DEFAULT_CONFIG.authMode).toBe('dev');
  });

  it('has local URLs for all backends', () => {
    expect(DEFAULT_CONFIG.coreApiBaseUrl).toContain('localhost');
    expect(DEFAULT_CONFIG.ordersApiBaseUrl).toContain('localhost');
    expect(DEFAULT_CONFIG.paymentsApiBaseUrl).toContain('localhost');
  });

  it('starts at version 0.0.0', () => {
    expect(DEFAULT_CONFIG.version).toBe('0.0.0');
  });
});
