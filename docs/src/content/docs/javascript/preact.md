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

`UXIcon` takes the icon in its `icon` prop and any SVG prop (`JSX.SVGAttributes<SVGSVGElement>`), except `children`
and `dangerouslySetInnerHTML`. It works with Preact 10, without `preact/compat`, on the client and on the server
(`preact-render-to-string`). With `preact/compat` aliased as `react`, the [React component](/javascript/react/) works
too, but this one skips the compat layer.

## Props

- **Primitive props** (strings, numbers, booleans, `null`, `undefined`) follow the [`ux_icon()` rules](/javascript/attributes/),
  `aria-hidden` included.
- **Other props** (event handlers, `style` objects, refs, signals) are passed to Preact as-is:

    ```jsx
    <UXIcon icon={LucideTrash2Icon} onClick={remove} style={{ color: 'red' }} />
    ```

Preact takes HTML attribute names, so the dumped attributes (`class`, `stroke-width`, `xlink:href`) are given as they
are, and so are yours: write `stroke-width="2"`, not `strokeWidth`. `className` replaces the dumped class like `class`
does; when both are given, `class` wins.

## By name

With an icon name known only at runtime, use `UXLazyIcon` with the `name` and the dumped `loaders`; `fallback` renders
while the icon loads, or for an unknown name (default: nothing). Its other props are the ones of `UXIcon`:

```jsx
import { UXLazyIcon } from '@silarhi/ux-icons-js/preact'
import { loaders } from '../var/icons/loaders.js'

const icon = <UXLazyIcon name={data.icon} loaders={loaders} fallback={null} />
```

See [dynamic icon names](/javascript/dynamic-names/).

## Without `dangerouslySetInnerHTML`

The SVG body is rendered with `h()` from the dumped tree: nothing is parsed as HTML at runtime.
