# Changelog

All notable changes to `silarhi/ux-icons-js-bundle` (Composer) and `@silarhi/ux-icons-js` (npm) are documented in this
file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Both packages are released from the
same git tag; the npm package version follows that tag.

## [Unreleased]

## [0.1.2] - 2026-10-20

### Changed

- The test suite covers every line of the bundle. The code reached only on PHP < 8.4 or without `symfony/asset-mapper`
  is written as single expressions; no behavior change.

## [0.1.1] - 2026-10-20

### Changed

- Development dependency and CI updates only; no runtime changes.

## [0.1.0] - 2026-10-20

### Added

- Backport of [symfony/ux#4072](https://github.com/symfony/ux/pull/4072) on top of an unmodified `symfony/ux-icons`
  2.36.1+ or 3.5+, from PHP 8.2 and Symfony 6.4: dump local icons as a JavaScript module on cache warmup or with
  `ux-icons-js:dump`, with the same attributes and configuration as `ux_icon()`.
- `@silarhi/ux-icons-js`: `renderIcon()`, `createIconElement()` and `resolveIcon()`, plus React and Vue `UXIcon`
  components, without `innerHTML`.
- `ux:icons:lock` finds the icons imported in JavaScript files (`symfony/ux-icons` 3.x); `ux:icons:lock` and
  `ux:icons:import` dump the icons again and print the export name of each new icon.
- Documentation site: [ux-icons-js-bundle.silarhi.dev](https://ux-icons-js-bundle.silarhi.dev).

### Fixed

- Compared with symfony/ux#4072, `resolveIcon()` keeps the position of an attribute dumped as `false` or given as
  `null` when it is set again, so `renderIcon()` output is byte for byte identical to `ux_icon()`.

[Unreleased]: https://github.com/silarhi/ux-icons-js-bundle/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/silarhi/ux-icons-js-bundle/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/silarhi/ux-icons-js-bundle/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/silarhi/ux-icons-js-bundle/releases/tag/v0.1.0
