---
title: Differences with symfony/ux#4072
description: How this bundle differs from the upstream pull request it backports.
sidebar:
    order: 3
---

The bundle backports [symfony/ux#4072](https://github.com/symfony/ux/pull/4072), which added JavaScript rendering to
`symfony/ux-icons` itself. As a separate bundle, it cannot change `symfony/ux-icons`, so:

| symfony/ux#4072                               | This bundle                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| The `ux_icons.javascript` option              | The `silarhi_ux_icons_js` configuration, enabled by registering the bundle                      |
| `ux:icons:dump`                               | `ux-icons-js:dump`                                                                              |
| `@symfony/ux-icons` (npm)                     | `@silarhi/ux-icons-js`                                                                          |
| The export name printed on each import line   | One `JavaScript: import { … }` line after `ux:icons:import` and `ux:icons:lock`                 |
| `IconRenderer::resolveIcon()`                 | `IconResolver`, a port of the attribute resolution, checked against `IconRenderer` by the tests |
| PHP 8.4, `symfony/ux-icons` 3.6               | PHP 8.2, Symfony 6.4, `symfony/ux-icons` 2.36.1 ([with limits](/reference/compatibility/))      |
| `@symfony/ux-icons` in the importmap via Flex | `importmap:require @silarhi/ux-icons-js` from npm                                               |

## Fixed

An attribute dumped as `false`, or given as `null`, and then set again moved to the end of the `<svg>` tag in
JavaScript, while PHP keeps its position: `renderIcon()` now renders byte for byte the HTML of `ux_icon()`.
