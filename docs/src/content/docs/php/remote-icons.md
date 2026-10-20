---
title: Remote icons
description: Use Iconify icons from JavaScript with ux:icons:import and ux:icons:lock.
sidebar:
    order: 2
---

Only local icons are dumped. To use an [Iconify](https://icon-sets.iconify.design/) icon from JavaScript, download it
into your icon directory with one of the `symfony/ux-icons` commands. After both, the bundle dumps the icons again and
prints the export name of each new one.

## `ux:icons:import`

```console
$ php bin/console ux:icons:import fa7-brands:x-twitter
 ✓ Imported fa7-brands:x-twitter
 JavaScript: import { Fa7BrandsXTwitterIcon }
 // Dumped 43 icon(s) for JavaScript.
```

The dump also runs when one of the icons is not found: the other ones are imported anyway.

## `ux:icons:lock`

`ux:icons:lock` downloads the remote icons your application uses. With the bundle, it also looks for them in your
JavaScript, so you can write the import first:

```js
// assets/controllers/delete_controller.js
import { LucideTrash2Icon } from '../../var/icons/index.js'
```

```console
$ php bin/console ux:icons:lock
 ✓ Imported lucide:trash-2 (License: ISC). Render with: {{ ux_icon('lucide:trash-2') }}
 JavaScript: import { LucideTrash2Icon }
 // Dumped 44 icon(s) for JavaScript.
```

The bundle scans the `.js`, `.mjs`, `.jsx`, `.ts`, `.mts`, `.tsx`, `.vue` and `.svelte` files of
[`scan_directories`](/reference/configuration/) (`assets/` by default, `node_modules/` and `vendor/` excluded) for
named imports from a module whose path contains `icons`. Aliased imports (`LucideXIcon as Close`) are found too, type
imports are not.

An export name can come from several icon names (`LucideTrash2Icon` is `lucide:trash-2` or `lucide:trash2`): every
candidate is given to `ux:icons:lock`, which skips the ones Iconify does not know.

:::caution
`symfony/ux-icons` 2.x has no extension point for `ux:icons:lock`: there, it only finds the icons of your Twig
templates. Import the others with `ux:icons:import`. See [compatibility](/reference/compatibility/).
:::
