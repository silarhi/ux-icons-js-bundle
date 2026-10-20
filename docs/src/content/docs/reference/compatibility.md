---
title: Compatibility
description: Supported PHP, Symfony and symfony/ux-icons versions, and what differs on symfony/ux-icons 2.x.
sidebar:
    order: 2
---

| PHP     | Symfony         | `symfony/ux-icons` |
| ------- | --------------- | ------------------ |
| 8.2–8.3 | 6.4 / 7.x / 8.x | 2.36.1+            |
| 8.4+    | 6.4 / 7.x / 8.x | 2.36.1+ / 3.5+     |

`symfony/ux-icons` 3 requires PHP 8.4. 2.36.1 and 3.5 are the first versions with every extension point the bundle
needs (icon set paths, suffixes, the icon factory). Every combination is tested by the CI.

## On `symfony/ux-icons` 2.x

Dumping, the JavaScript, React and Vue rendering, and the dump after `ux:icons:import` and `ux:icons:lock` work the
same. Two things differ:

### `ux:icons:lock` does not scan JavaScript

`ux:icons:lock` 2.x only scans the Twig templates, with a finder that cannot be extended. Import the icons used only
in JavaScript with `ux:icons:import`.

### Booleans, arrays and `null`

`ux_icon()` 3.x renders its attributes with the `html_attr()` rules; 2.x passes them as they are. The JavaScript side
always follows the 3.x rules, so for the same attributes:

| Attributes                                | `ux_icon()` 2.x       | JavaScript and `ux_icon()` 3.x |
| ----------------------------------------- | --------------------- | ------------------------------ |
| `{ 'data-x': true }`                      | `data-x`              | `data-x="true"`                |
| `{ 'aria-hidden': false }`                | `aria-hidden` omitted | `aria-hidden="false"`          |
| `{ class: ['a', 'b'] }`, `{ fill: null }` | an exception          | `class="a b"`, `fill` omitted  |

Strings and numbers render the same everywhere.

## Internal services

The bundle reads the `ux_icons` configuration from two internal services of `symfony/ux-icons`,
`.ux_icons.icon_renderer` and `.ux_icons.local_svg_icon_registry`. If a future version renames them, the container
compilation fails with an explicit message, instead of dumping icons with the wrong attributes.
