---
title: Dynamic icon names
description: Render an icon whose name is only known at runtime, e.g. from an API response, loading that icon alone.
sidebar:
    order: 5
---

Named imports need the icon name when you write the code. When it only comes at runtime, e.g. from an API response
like `{ "icon": "lucide:trash-2" }`, load the icon by its name with the dumped `loaders` map:

```js
import { createIconElement, loadIcon } from '@silarhi/ux-icons-js'
import { loaders } from '../var/icons/loaders.js'

const data = await (await fetch('/api/status')).json()

const icon = await loadIcon(loaders, data.icon) // null for an unknown name
if (icon) {
    badge.append(createIconElement(icon, { class: 'text-success' }))
}
```

`var/icons/loaders.js` maps every dumped name, aliases included, to the module of that icon alone:

```js
export const loaders = {
    'lucide:trash-2': () => import('./icons/lucide--trash-2.js'),
    // …
}
```

Your bundler splits each icon into its own chunk: importing `loaders` downloads none of them, and `loadIcon()` downloads
only the requested one. Static imports from `index.js` are not affected, they stay in your bundle and tree-shaken; and an app that only uses
`UXIcon` does not bundle the loading code of `UXLazyIcon`.

## `loadIcon()`

```ts
loadIcon(loaders: UXIconLoaders, name: string | null | undefined): Promise<UXIconData | null>
```

- Resolves to `null` for `null`, `undefined`, or a name the dump does not know.
- Loads each icon once: concurrent and later calls share the same result. `getLoadedIcon(loaders, name)` returns an
  icon already loaded, synchronously.
- Rejects if the module fails to load (e.g. a network error); the next call tries again.

## React and Vue

`UXLazyIcon` takes the `name` and the `loaders`, and the other props of `UXIcon`. It renders the fallback while the
icon loads, or for an unknown name:

```jsx
import { UXLazyIcon } from '@silarhi/ux-icons-js/react'
import { loaders } from '../var/icons/loaders.js'

const badge = <UXLazyIcon name={status.icon} loaders={loaders} fallback={<span className="placeholder" />} />
```

```vue
<UXLazyIcon :name="status.icon" :loaders="loaders" class="text-success">
    <template #fallback><span class="placeholder" /></template>
</UXLazyIcon>
```

An icon loaded earlier renders at once, without the fallback, also during a server-side render.

## TypeScript

The dumped `loaders.d.ts` exports the union of the dumped names, to type your API responses:

```ts
import type { IconName } from '../var/icons/loaders.js'

interface Status {
    label: string
    icon: IconName // 'lucide:trash-2' | 'user' | …
}
```

## Only local icons

Like the named exports, the loaders only know the dumped, local icons. `ux:icons:lock` cannot guess the names an API
returns: download them first with `ux:icons:import` (see [remote icons](/php/remote-icons/)), or keep them in your icon
directory.
