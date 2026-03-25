import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';

import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

const testBed = getTestBed();
type TestBedWithOptionalPlatform = ReturnType<typeof getTestBed> & { platform?: unknown };
if (!(testBed as TestBedWithOptionalPlatform).platform) {
  testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}
