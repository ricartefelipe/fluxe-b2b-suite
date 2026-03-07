# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-07

### Added
- Complete B2B Suite frontend with Angular (Nx monorepo)
- Functional login with authentication flow
- User profile page and user menu
- Shop application with dedicated Dockerfile
- Product catalog and checkout flow
- Full UI redesign with modern styling for production
- Infrastructure for Oracle Cloud Free Tier ARM deployment
- Step-by-step deployment guide for beginners
- Runtime environment injection via `config.template.json`
- Health check scripts for SSR applications
- i18n support and documentation

### Changed
- CI updated to use pnpm package manager
- `.nx/` cache removed from repository and added to `.gitignore`

### Fixed
- SSR `requestIdleCallback` protected with `isPlatformBrowser` guard
- Authentication route configuration corrected
- Docker builds now copy `config.template.json` for runtime env injection
- SSR browser API calls guarded against server-side execution
