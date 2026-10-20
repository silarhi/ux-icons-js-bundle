---
title: Installation
description: Install the Symfony bundle and the @silarhi/ux-icons-js npm package, and register the bundle.
sidebar:
    order: 1
---

The repository ships two packages, released from the same git tag.

| Package                      | Registry                                                               | What it does                                                                         |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `silarhi/ux-icons-js-bundle` | [Packagist](https://packagist.org/packages/silarhi/ux-icons-js-bundle) | Dumps your local icons, with their configured attributes, as a JavaScript module.    |
| `@silarhi/ux-icons-js`       | [npm](https://www.npmjs.com/package/@silarhi/ux-icons-js)              | Renders the dumped icons in vanilla JavaScript, React or Vue, like `ux_icon()` does. |

## Requirements

| Dependency                                                                    | Version         |
| ----------------------------------------------------------------------------- | --------------- |
| PHP                                                                           | 8.2+            |
| Symfony                                                                       | 6.4 / 7.x / 8.x |
| [`symfony/ux-icons`](https://symfony.com/bundles/ux-icons/current/index.html) | 2.36.1+ / 3.5+  |
| React (optional peer dependency, for `@silarhi/ux-icons-js/react`)            | 18 / 19         |
| Vue (optional peer dependency, for `@silarhi/ux-icons-js/vue`)                | 3               |

`symfony/ux-icons` 3 needs PHP 8.4. On `symfony/ux-icons` 2.x, `ux:icons:lock` does not find the icons imported in
JavaScript, and boolean attributes follow the 3.x rules: see [compatibility](/reference/compatibility/).

## PHP

```bash
composer require silarhi/ux-icons-js-bundle
```

Register the bundle after `UXIconsBundle`, whose configuration it reuses:

```php
// config/bundles.php
return [
    // ...
    Symfony\UX\Icons\UXIconsBundle::class => ['all' => true],
    Silarhi\UxIconsJsBundle\SilarhiUxIconsJsBundle::class => ['all' => true],
];
```

No configuration is needed: the icons are dumped into `var/icons/` on the next cache warmup. See the
[configuration reference](/reference/configuration/) to change it.

## JavaScript

```bash
pnpm add @silarhi/ux-icons-js
```

With [AssetMapper](https://symfony.com/doc/current/frontend/asset_mapper.html), add it to the import map instead (with
the React or Vue entry point if you use it):

```bash
php bin/console importmap:require @silarhi/ux-icons-js @silarhi/ux-icons-js/react
```

The package is an ES module with its TypeScript declarations. Continue with the [quick start](/getting-started/quick-start/).
