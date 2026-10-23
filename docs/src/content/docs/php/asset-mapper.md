---
title: Webpack Encore and AssetMapper
description: Import the dumped icons with Webpack Encore, Vite or AssetMapper.
sidebar:
    order: 3
---

## Webpack Encore, Vite, any bundler

Import the dumped module by its relative path, from `assets/`:

```js
import { LucideTrash2Icon } from '../var/icons/index.js'
```

Only the imported icons end up in your bundle. An alias makes the imports shorter:

```js
// webpack.config.js
Encore.addAliases({ '@icons': path.resolve(__dirname, 'var/icons/index.js') })
```

```js
import { LucideTrash2Icon } from '@icons'
```

[`ux:icons:lock`](/php/remote-icons/#uxiconslock) finds these imports too: it looks for any module path containing
`icons`.

## AssetMapper

The bundle maps the dump directory as `var/icons`. Give the module a name in your import map:

```php
// importmap.php
return [
    // ...
    '@icons' => [
        'path' => './var/icons/index.js',
    ],
    // to load icons by name
    '@icons/loaders' => [
        'path' => './var/icons/loaders.js',
    ],
];
```

```js
import { LucideTrash2Icon } from '@icons'
import { loaders } from '@icons/loaders'
```

Then add the package, with the React, Preact or Vue entry point if you use one (and the framework itself):

```bash
php bin/console importmap:require @silarhi/ux-icons-js @silarhi/ux-icons-js/react react
```

Without a bundler, the browser downloads every icon of the module, used or not. The TypeScript types are useless in
production: disable them there with [`dump_typescript`](/reference/configuration/).
