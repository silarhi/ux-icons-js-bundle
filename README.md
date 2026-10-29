<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/packagist/v/silarhi/ux-icons-js-bundle?style=for-the-badge&label=stable&color=0d6efd&labelColor=1a1a2e">
        <img src="https://img.shields.io/packagist/v/silarhi/ux-icons-js-bundle?style=for-the-badge&label=stable&color=0d6efd"
            alt="Latest Stable Version">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/packagist/dt/silarhi/ux-icons-js-bundle?style=for-the-badge&color=198754&labelColor=1a1a2e">
        <img src="https://img.shields.io/packagist/dt/silarhi/ux-icons-js-bundle?style=for-the-badge&color=198754" alt="Total Downloads">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/packagist/l/silarhi/ux-icons-js-bundle?style=for-the-badge&color=6f42c1&labelColor=1a1a2e">
        <img src="https://img.shields.io/packagist/l/silarhi/ux-icons-js-bundle?style=for-the-badge&color=6f42c1" alt="License">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/packagist/php-v/silarhi/ux-icons-js-bundle?style=for-the-badge&color=777bb4&labelColor=1a1a2e">
        <img src="https://img.shields.io/packagist/php-v/silarhi/ux-icons-js-bundle?style=for-the-badge&color=777bb4" alt="PHP Version">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/silarhi/ux-icons-js-bundle/continuous-integration.yml?style=for-the-badge&label=CI&color=20c997&labelColor=1a1a2e">
        <img src="https://img.shields.io/github/actions/workflow/status/silarhi/ux-icons-js-bundle/continuous-integration.yml?style=for-the-badge&label=CI&color=20c997"
            alt="CI Status">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsilarhi%2Fux-icons-js-bundle%2Fbadges%2Fcoverage.json&style=for-the-badge&labelColor=1a1a2e">
        <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsilarhi%2Fux-icons-js-bundle%2Fbadges%2Fcoverage.json&style=for-the-badge" alt="Coverage">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsilarhi%2Fux-icons-js-bundle%2Fbadges%2Fcoverage-js.json&style=for-the-badge&labelColor=1a1a2e">
        <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsilarhi%2Fux-icons-js-bundle%2Fbadges%2Fcoverage-js.json&style=for-the-badge" alt="JavaScript coverage">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/v/@silarhi/ux-icons-js?style=for-the-badge&label=npm&color=cb3837&labelColor=1a1a2e">
        <img src="https://img.shields.io/npm/v/@silarhi/ux-icons-js?style=for-the-badge&label=npm&color=cb3837" alt="npm Version">
    </picture>
</p>

<h1 align="center">UX Icons JS Bundle</h1>

<p align="center">
    <strong>Render <a href="https://symfony.com/bundles/ux-icons/current/index.html">Symfony UX Icons</a> in JavaScript, React, Preact and Vue.</strong><br>
    Same attributes, same configuration, same HTML as <code>ux_icon()</code>, without <code>innerHTML</code>.
</p>

<p align="center">
    📖 <a href="https://ux-icons-js-bundle.silarhi.dev"><strong>Documentation</strong></a>
</p>

---

A backport of [symfony/ux#4072](https://github.com/symfony/ux/pull/4072) on top of an unmodified `symfony/ux-icons`,
in two packages released from the same git tag:

- **`silarhi/ux-icons-js-bundle`** (PHP): dumps your local icons, with the attributes `ux_icon()` gives them, as a
  JavaScript module with one named export per icon.
- **[`@silarhi/ux-icons-js`](https://www.npmjs.com/package/@silarhi/ux-icons-js)** (JS/TS): renders them in vanilla
  JavaScript, React, Preact or Vue.

## Features

- **Same output as `ux_icon()`**: `default_icon_attributes`, icon set `icon_attributes`, `suffixes` and `aliases` come
  from your `ux_icons` configuration, and the attributes you give follow the `ux_icon()` rules.
- **Tree-shaken**: `lucide:trash-2` is exported as `LucideTrash2Icon`, your bundler drops the icons you never import.
- **Dynamic names**: an icon name from an API response loads that icon alone, `await loadIcon(loaders, data.icon)`.
- **No `innerHTML`**: `createIconElement()` builds SVG elements, the React, Preact and Vue components render elements.
- **Works with `ux:icons:lock`**: write the import first, run `ux:icons:lock`, the icon is downloaded and dumped.

## Requirements

PHP 8.2+, Symfony 6.4 / 7.x / 8.x, `symfony/ux-icons` 2.36.1+ or 3.5+ (3.x needs PHP 8.4; see the
[compatibility notes](https://ux-icons-js-bundle.silarhi.dev/reference/compatibility/) for 2.x). React 18/19,
Preact 10/11 and Vue 3 are optional peer dependencies.

## Installation

```bash
composer require silarhi/ux-icons-js-bundle
pnpm add @silarhi/ux-icons-js
```

```php
// config/bundles.php — after UXIconsBundle, whose configuration it reuses
Silarhi\UxIconsJsBundle\SilarhiUxIconsJsBundle::class => ['all' => true],
```

## Quick start

The icons are dumped into `var/icons/` on cache warmup, or with `php bin/console ux-icons-js:dump`:

```js
import { createIconElement } from '@silarhi/ux-icons-js'
import { UXIcon } from '@silarhi/ux-icons-js/react' // or '@silarhi/ux-icons-js/preact', '@silarhi/ux-icons-js/vue'
import { LucideTrash2Icon } from '../var/icons/index.js'

button.append(createIconElement(LucideTrash2Icon, { class: 'text-danger', 'aria-label': 'Delete' }))

const icon = <UXIcon icon={LucideTrash2Icon} className="text-danger" aria-label="Delete" />
```

## Documentation

Everything else is on **[ux-icons-js-bundle.silarhi.dev](https://ux-icons-js-bundle.silarhi.dev)**:

- [Installation](https://ux-icons-js-bundle.silarhi.dev/getting-started/installation/), [quick start](https://ux-icons-js-bundle.silarhi.dev/getting-started/quick-start/) and [live examples](https://ux-icons-js-bundle.silarhi.dev/getting-started/live-examples/)
- JavaScript: [vanilla](https://ux-icons-js-bundle.silarhi.dev/javascript/vanilla/), [dynamic names](https://ux-icons-js-bundle.silarhi.dev/javascript/dynamic-names/), [attributes](https://ux-icons-js-bundle.silarhi.dev/javascript/attributes/), [React](https://ux-icons-js-bundle.silarhi.dev/javascript/react/), [Preact](https://ux-icons-js-bundle.silarhi.dev/javascript/preact/), [Vue](https://ux-icons-js-bundle.silarhi.dev/javascript/vue/)
- PHP: [dumping icons](https://ux-icons-js-bundle.silarhi.dev/php/dumping/), [remote icons](https://ux-icons-js-bundle.silarhi.dev/php/remote-icons/), [Webpack Encore and AssetMapper](https://ux-icons-js-bundle.silarhi.dev/php/asset-mapper/)
- Reference: [configuration](https://ux-icons-js-bundle.silarhi.dev/reference/configuration/), [compatibility](https://ux-icons-js-bundle.silarhi.dev/reference/compatibility/), [differences with symfony/ux#4072](https://ux-icons-js-bundle.silarhi.dev/reference/differences/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Release notes are in [CHANGELOG.md](CHANGELOG.md).

## License

Released under the [MIT License](LICENSE).
