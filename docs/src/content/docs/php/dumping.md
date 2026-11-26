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
- **In `dev`, when an SVG file changes**: the icon directory and the icon set paths are tracked like the translation
  directories, so adding, changing or removing an SVG file rebuilds the container on the next request, which dumps the
  icons again. Only the changed files are rewritten, so your bundler rebuilds that icon alone.
- **With the command**, e.g. from a script or when no request is made:

    ```console
    $ php bin/console ux-icons-js:dump
     [OK] Dumped 42 icon(s).
    ```

    Add `-v` to list them.

- **After `ux:icons:import` and `ux:icons:lock`**, automatically.

Dumping only reads local files: it never downloads an icon, even with `ux_icons.iconify.on_demand`.

## Filtering the icons

When an icon set `path` holds a whole icon set, dumping thousands of icons makes `loaders.js` large, and fills the
dump directory with their modules. The `icons` option keeps only the matching names, like the `keys_patterns` of
`symfony/ux-translator`:

```yaml
# config/packages/silarhi_ux_icons_js.yaml
silarhi_ux_icons_js:
    icons:
        - 'lucide:*' # "*" matches any characters
        - 'app:*'
        - '!lucide:*-off' # "!" excludes
```

An icon is dumped if it matches one of the included patterns (any icon when there are none) and none of the excluded
ones. Aliases are matched by their own name. An icon left out cannot be imported nor loaded by its name.

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

| File                     | Content                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `var/icons/index.js`     | The icons, `export const LucideTrash2Icon = { name, attributes, children }`              |
| `var/icons/index.d.ts`   | Their TypeScript types, unless [`dump_typescript`](/reference/configuration/) is `false` |
| `var/icons/loaders.js`   | Icon name => module of that icon, to [load an icon by name](/javascript/dynamic-names/)  |
| `var/icons/loaders.d.ts` | Its types, with the `IconName` union of the dumped names                                 |
| `var/icons/icons/*.js`   | One module per icon (`lucide--trash-2.js`), loaded by `loaders.js`                       |

Both are generated: do not edit or commit them. The directory is configurable with
[`dump_directory`](/reference/configuration/).
