---
title: Dumping icons
description: When and how the local icons are dumped as a JavaScript module, and how they are named.
sidebar:
    order: 1
---

The bundle dumps every **local** icon into `var/icons/index.js`:

- the SVG files of the `ux_icons.icon_dir` directory (`assets/icons/` by default),
- the SVG files of the icon sets that have a `path`,
- the `ux_icons.aliases` whose target is one of these icons.

Remote icons are not dumped: [import or lock them](/php/remote-icons/) first.

## When

- **On cache warmup**: `cache:clear`, `cache:warmup`, and in `dev` every time the container is rebuilt. The cache
  warmer is not optional: the dump directory exists as soon as the container is built, as AssetMapper requires.
- **With the command**, e.g. after adding an SVG file by hand:

    ```console
    $ php bin/console ux-icons-js:dump
     [OK] Dumped 42 icon(s).
    ```

    Add `-v` to list them.

- **After `ux:icons:import` and `ux:icons:lock`**, automatically.

Dumping only reads local files: it never downloads an icon, even with `ux_icons.iconify.on_demand`.

## Configured attributes

Each icon is dumped with its attributes already resolved, exactly as `ux_icon()` resolves them:
`default_icon_attributes`, then the icon set `icon_attributes`, then the matching `suffixes` (for the alias target if
the name is an alias). The JavaScript side only merges the attributes you give, and adds `aria-hidden`.

The bundle reads these values from the `ux_icons` configuration: there is nothing to repeat.

## Export names

Each icon is a named export, its name in PascalCase followed by `Icon`, so your bundler tree-shakes the icons you never
import:

| Icon name              | Export name             |
| ---------------------- | ----------------------- |
| `user`                 | `UserIcon`              |
| `lucide:trash-2`       | `LucideTrash2Icon`      |
| `fa7-brands:x-twitter` | `Fa7BrandsXTwitterIcon` |
| `500`                  | `_500Icon`              |

Two icons can map to the same export name (`sub:check` and the alias `sub-check` both give `SubCheckIcon`). The dump
then fails and names both: rename one of them.

## Files

| File                   | Content                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `var/icons/index.js`   | The icons, `export const LucideTrash2Icon = { name, attributes, children }`              |
| `var/icons/index.d.ts` | Their TypeScript types, unless [`dump_typescript`](/reference/configuration/) is `false` |

Both are generated: do not edit or commit them. The directory is configurable with
[`dump_directory`](/reference/configuration/).
