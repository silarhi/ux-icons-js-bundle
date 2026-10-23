---
title: Preact
description: The UXIcon Preact component of @silarhi/ux-icons-js/preact.
sidebar:
    order: 4
---

```jsx
import { UXIcon } from '@silarhi/ux-icons-js/preact'
import { LucideTrash2Icon } from '../var/icons/index.js'

const icon = <UXIcon icon={LucideTrash2Icon} class="text-danger" aria-label="Delete" />
```

`UXIcon` takes the icon in its `icon` prop and any SVG prop, except `children` and `dangerouslySetInnerHTML`. It is
built on Preact itself, without `preact/compat`, and works with Preact 10 and 11, on the client and on the server
(`preact-render-to-string`), where it renders the same HTML as `ux_icon()`.

## Props

- **Primitive props** (strings, numbers, booleans, `null`, `undefined`) follow the
  [`ux_icon()` rules](/javascript/attributes/), `aria-hidden` included.
- **Other props** (event handlers, `style` objects, refs, signals) are passed to Preact as-is:

    ```jsx
    <UXIcon icon={LucideTrash2Icon} onClick={remove} style={{ color: 'red' }} />
    ```

Unlike React, Preact sets attributes by their HTML names: the dumped attributes (`class`, `stroke-width`) are rendered
as they are, and you override them with the same names (`class="text-danger"`, `stroke-width={2}`). `className` is
taken as `class`. A camelCase name (`strokeWidth`) is not converted, as everywhere in Preact without `preact/compat`.

In the browser, Preact renders a dumped `xlink:href` as `href`, which every current browser supports.

## By name

With an icon name known only at runtime, use `UXLazyIcon` with the `name` and the dumped `loaders`; `fallback` renders
while the icon loads, or for an unknown name (default: nothing). Its other props are the ones of `UXIcon`:

```jsx
import { UXLazyIcon } from '@silarhi/ux-icons-js/preact'
import { loaders } from '../var/icons/loaders.js'

const icon = <UXLazyIcon name={data.icon} loaders={loaders} fallback={null} />
```

See [dynamic icon names](/javascript/dynamic-names/).

## With `preact/compat`

The React entry point (`@silarhi/ux-icons-js/react`) also works with `preact/compat`, but it converts the attributes to
React names that `preact/compat` converts back. Use `@silarhi/ux-icons-js/preact`, even in an app aliasing `react` to
`preact/compat`: the attributes are the same, only `class` is rendered last, as `preact/compat` moves it.
