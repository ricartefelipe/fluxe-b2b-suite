import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';

import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';

const testBed = getTestBed();
if (!(testBed as any).platform) {
  testBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
}
