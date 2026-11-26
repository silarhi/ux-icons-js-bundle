---
title: The <ux-icon> element
description: Render an icon by its name in plain HTML, Twig templates or Turbo Streams, with a custom element.
sidebar:
    order: 7
---

`defineIconElement()` registers a `<ux-icon>` custom element, to render an icon by its name in HTML written outside of a
framework: Twig templates, Turbo Streams, HTML built by a Stimulus controller or returned by an API.

```js
// assets/app.js
import { defineIconElement } from '@silarhi/ux-icons-js/element'
import { loaders } from '../var/icons/loaders.js'

defineIconElement(loaders)
```

```html
<button type="button">
    <ux-icon name="lucide:trash-2" class="text-danger" aria-label="Delete"></ux-icon>
</button>
```

The element is a placeholder: once its icon is loaded, it is **replaced** by the `<svg>` that `ux_icon()` renders with
the same attributes (all but `name`). The page then holds exactly the HTML of
`{{ ux_icon('lucide:trash-2', { class: 'text-danger', 'aria-label': 'Delete' }) }}`, so your CSS selectors and
Stimulus targets work the same.

- Each icon is downloaded on its first use only, like [`loadIcon()`](/javascript/dynamic-names/). An icon loaded
  earlier is rendered at once, e.g. when Turbo renders the page again.
- Its children are shown until the icon is loaded, and stay for an unknown name or a failed load:

    ```html
    <ux-icon name="lucide:bell"><span class="placeholder"></span></ux-icon>
    ```

- Changing the `name` of a placeholder that is not rendered yet loads the new icon. Once rendered, the placeholder is
  gone: to change an icon later, replace the `<svg>` (e.g. with [`createIconElement()`](/javascript/vanilla/)).

`defineIconElement(loaders, 'app-icon')` registers another tag name. Defining a tag name again returns the element
already defined, e.g. on hot module replacement.

:::caution
React, Preact and Vue manage the elements they render: a placeholder that replaces itself breaks their updates. Use
[`UXLazyIcon`](/javascript/dynamic-names/#react-preact-and-vue) there.
:::

## `ux:icons:lock`

`ux:icons:lock` finds the icons of the `<ux-icon name="…">` elements written in the `.html`, `.twig` and JavaScript files
of [`scan_directories`](/reference/configuration/) (`assets/` and `templates/` by default). A name built at runtime
(`name="{{ icon }}"`, `name="${icon}"`) cannot be found: [import it](/php/remote-icons/) first.
