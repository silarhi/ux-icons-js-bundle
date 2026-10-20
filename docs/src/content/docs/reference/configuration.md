---
title: Configuration
description: The silarhi_ux_icons_js configuration, and the ux_icons options it reuses.
sidebar:
    order: 1
---

The defaults fit most applications: the bundle works without configuration.

```yaml
# config/packages/silarhi_ux_icons_js.yaml
silarhi_ux_icons_js:
    # The directory where the JavaScript module is dumped
    dump_directory: '%kernel.project_dir%/var/icons'

    # Whether TypeScript types are dumped alongside the icons
    dump_typescript: true

    # The directories scanned for icons imported in JavaScript files (see "ux:icons:lock")
    scan_directories: ['%kernel.project_dir%/assets']

when@prod:
    silarhi_ux_icons_js:
        # useless in production with AssetMapper
        dump_typescript: false
```

| Option             | Default                           | Description                                                                                                 |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `dump_directory`   | `%kernel.project_dir%/var/icons`  | Where `index.js` and `index.d.ts` are dumped. Mapped as `var/icons` with [AssetMapper](/php/asset-mapper/). |
| `dump_typescript`  | `true`                            | Dumps `index.d.ts`. When `false`, a previously dumped `index.d.ts` is removed.                              |
| `scan_directories` | `['%kernel.project_dir%/assets']` | Scanned by [`ux:icons:lock`](/php/remote-icons/#uxiconslock) for the icons imported in JavaScript.          |

## Reused `ux_icons` options

The icons are dumped with these [UX Icons options](https://symfony.com/bundles/ux-icons/current/index.html#configuration),
read from the `ux_icons` configuration:

| Option                        | Used for                                     |
| ----------------------------- | -------------------------------------------- |
| `icon_dir`                    | The local icons                              |
| `icon_sets.*.path`            | The local icon sets                          |
| `aliases`                     | Extra exports, pointing to their target icon |
| `default_icon_attributes`     | The dumped attributes                        |
| `icon_sets.*.icon_attributes` | The dumped attributes of the icon set        |
| `icon_sets.*.suffixes`        | The dumped attributes of the matching suffix |

## Commands

| Command            | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `ux-icons-js:dump` | Dumps the local icons. `-v` lists them.                                |
| `ux:icons:import`  | (`symfony/ux-icons`) Dumps the icons again, prints the new exports.    |
| `ux:icons:lock`    | (`symfony/ux-icons`) Same, and finds the icons imported in JavaScript. |
