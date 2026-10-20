---
title: Vue
description: The UXIcon Vue component of @silarhi/ux-icons-js/vue.
sidebar:
    order: 4
---

```vue
<script setup>
import { UXIcon } from '@silarhi/ux-icons-js/vue'
import { LucideTrash2Icon } from '../var/icons/index.js'
</script>

<template>
    <UXIcon :icon="LucideTrash2Icon" class="text-danger" aria-label="Delete" />
</template>
```

`UXIcon` takes the icon in its `icon` prop; every other attribute is applied to the `<svg>` element (Vue 3).

## Attributes

- **Primitive values** (strings, numbers, booleans, `null`) follow the [`ux_icon()` rules](/javascript/attributes/),
  `aria-hidden` included.
- **Other values** keep the Vue semantics: `:class="['a', { active: isActive }]"`, `:style="{ color: 'red' }"`, and
  listeners such as `@click`.

## By name

With an icon name known only at runtime, give `name` and the dumped `loaders` instead of `icon`; the `fallback` slot
renders while the icon loads, or for an unknown name:

```vue
<UXIcon :name="data.icon" :loaders="loaders"><template #fallback>…</template></UXIcon>
```

See [dynamic icon names](/javascript/dynamic-names/).

The SVG body is rendered with `h()` from the dumped tree, without `v-html`.
