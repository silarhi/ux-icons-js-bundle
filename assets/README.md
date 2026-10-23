# @silarhi/ux-icons-js

Render the [Symfony UX Icons](https://symfony.com/bundles/ux-icons/current/index.html) dumped by
[`silarhi/ux-icons-js-bundle`](https://github.com/silarhi/ux-icons-js-bundle) in vanilla JavaScript, React, Preact or
Vue, with the same attributes and configuration as the `ux_icon()` Twig function, without `innerHTML`.

```js
import { createIconElement, renderIcon } from '@silarhi/ux-icons-js'
import { UXIcon } from '@silarhi/ux-icons-js/react' // or '/preact', '/vue'
import { LucideTrash2Icon } from '../var/icons/index.js'

element.append(createIconElement(LucideTrash2Icon, { class: 'text-danger', 'aria-label': 'Delete' }))
const icon = <UXIcon icon={LucideTrash2Icon} className="text-danger" aria-label="Delete" />
```

See the [bundle documentation](https://github.com/silarhi/ux-icons-js-bundle#readme).
