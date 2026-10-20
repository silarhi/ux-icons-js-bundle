---
title: Attributes
description: How the attributes given in JavaScript are merged with the dumped ones, following the ux_icon() rules.
sidebar:
    order: 2
---

The attributes given to `renderIcon()`, `createIconElement()`, `resolveIcon()` or a `UXIcon` component follow the
rules of the `ux_icon()` Twig function, which renders its attributes like the
[`html_attr()`](https://twig.symfony.com/doc/3.x/functions/html_attr.html) function of `twig/html-extra`.

## Precedence

From lowest to highest:

1. The attributes of the SVG file
2. `default_icon_attributes`, then the icon set `icon_attributes`, then the matching `suffixes` (resolved at dump time)
3. The attributes given in JavaScript

Overriding an attribute keeps its position in the `<svg>` tag, like in PHP.

## Values

| Value                                      | Result                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `'text'`, `24`                             | `attr="text"`, `attr="24"`                                                         |
| `undefined`                                | Not given: the dumped value is kept (JavaScript only, e.g. an optional React prop) |
| `null`                                     | Omitted, even if it has a dumped value                                             |
| `false`                                    | Omitted, except `aria-*` which becomes `"false"`                                   |
| `true`                                     | `attr=""`, except `aria-*` and `data-*` which become `"true"`                      |
| `['btn', isActive && 'active']`            | A token list: falsy entries are dropped, `class="btn active"`                      |
| `{ color: 'red', margin: null }` (`style`) | An inline style: `style="color: red;"`                                             |
| `{ id: 1 }`, `[1, 2]` (`data-*`)           | JSON encoded like PHP `json_encode()`: `data-config="{&quot;id&quot;:1}"`          |

## `aria-hidden`

`aria-hidden="true"` is added unless `aria-hidden`, `aria-label`, `aria-labelledby` or `title` is given: an icon is
decorative unless it carries a text alternative.

```js
renderIcon(LucideTrash2Icon) // … aria-hidden="true">
renderIcon(LucideTrash2Icon, { 'aria-label': 'Delete' }) // … aria-label="Delete">
renderIcon(LucideTrash2Icon, { 'aria-hidden': false }) // … aria-hidden="false">
```

:::note
With `symfony/ux-icons` 2.x, `ux_icon()` does not apply the `html_attr()` rules: booleans render differently there
(`data-x` instead of `data-x="true"`), and arrays and `null` are rejected. The JavaScript side always follows the 3.x
rules. See [compatibility](/reference/compatibility/).
:::
