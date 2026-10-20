---
title: Vanilla JavaScript
description: renderIcon(), createIconElement() and resolveIcon(), the framework-free API of @silarhi/ux-icons-js.
sidebar:
    order: 1
---

```js
import { createIconElement, renderIcon, resolveIcon } from '@silarhi/ux-icons-js'
import { LucideTrash2Icon } from '../var/icons/index.js'
```

All three functions take a dumped icon and optional attributes. Attributes accept the same values as `ux_icon()`:
see [attributes](/javascript/attributes/).

## `createIconElement()`

Creates the icon as an `SVGSVGElement`, with `document.createElementNS()`: no HTML is parsed, so no `innerHTML`
is needed, which suits a strict Content Security Policy or a Stimulus controller.

```js
button.append(createIconElement(LucideTrash2Icon, { width: '2em' }))
```

Namespaced attributes such as `xlink:href` are set with their namespace.

## `renderIcon()`

Returns the icon as an HTML string, byte for byte the one `ux_icon()` renders (with `symfony/ux-icons` 3):

```js
renderIcon(LucideTrash2Icon, { class: 'text-danger', 'aria-label': 'Delete' })
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" … class="text-danger" aria-label="Delete">…</svg>
```

Useful for a template literal or a server-side render; prefer `createIconElement()` to insert it into the DOM.

## `resolveIcon()`

Returns the final attributes of the root `<svg>` element, the dumped ones merged with the given ones, as strings. Use
it to render icons with another framework (Svelte, Lit, Preact…):

```js
resolveIcon(LucideTrash2Icon, { class: 'text-danger' })
// { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', …, class: 'text-danger', 'aria-hidden': 'true' }
```

The attributes keep their order: the dumped ones first, in their order, then the new ones.

## The icon data

Each export of `var/icons/index.js` is a plain object:

```ts
interface UXIconData<Name extends string = string> {
    readonly name: Name // 'lucide:trash-2'
    readonly attributes: Readonly<Record<string, string | boolean>> // configured attributes, already resolved
    readonly children: readonly UXIconNode[] // the SVG body
}

// a text, or an element as a [tag, attributes, children?] tuple
type UXIconNode =
    string | readonly [tag: string, attributes: Readonly<Record<string, string>>, children?: readonly UXIconNode[]]
```

The body of `<path d="M3 6h18"/>` is `[['path', { d: 'M3 6h18' }]]`. With TypeScript, the dumped `index.d.ts` types
each export with its literal name (`UXIconData<'lucide:trash-2'>`).
