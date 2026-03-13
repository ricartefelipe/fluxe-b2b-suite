import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';

import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

const testBed = getTestBed();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(testBed as any).platform) {
  testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}
