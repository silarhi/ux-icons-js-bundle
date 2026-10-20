---
title: React
description: The UXIcon React component of @silarhi/ux-icons-js/react.
sidebar:
    order: 3
---

```jsx
import { UXIcon } from '@silarhi/ux-icons-js/react'
import { LucideTrash2Icon } from '../var/icons/index.js'

const icon = <UXIcon icon={LucideTrash2Icon} className="text-danger" aria-label="Delete" />
```

`UXIcon` takes the icon in its `icon` prop and any SVG prop (`SVGProps<SVGSVGElement>`), except `children` and
`dangerouslySetInnerHTML`. It works with React 18 and 19, on the client and on the server (`renderToString()`).

## Props

- **Primitive props** (strings, numbers, booleans, `null`, `undefined`) follow the [`ux_icon()` rules](/javascript/attributes/),
  `aria-hidden` included.
- **Other props** (event handlers, `style` objects, refs) are passed to React as-is:

    ```jsx
    <UXIcon icon={LucideTrash2Icon} onClick={remove} style={{ color: 'red' }} />
    ```

The dumped attributes use HTML names (`class`, `stroke-width`, `xlink:href`); they are converted to React props
(`className`, `strokeWidth`, `xlinkHref`), and a dumped `style` string to a style object. A React-named prop you give
(`strokeWidth={2}`) overrides the dumped HTML-named one.

## Without `dangerouslySetInnerHTML`

The SVG body is rendered as React elements, built from the dumped tree: nothing is parsed as HTML at runtime.
