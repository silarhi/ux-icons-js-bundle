/// <reference types="vite/client" />

import { describe, expect, test } from 'vitest'
import { loadIcon, renderIcon, type UXIconAttributes, type UXIconLoaders } from '../src/index'

/*
 * renderIcon() against the real ux_icon(): `php docs/scripts/render-examples.php` dumps the icons of the documentation
 * examples (docs/src/data/icons/) and renders each one with ux_icon() (docs/src/data/examples/<name>.html). The CI job
 * "Docs examples" checks these committed files are up to date with the PHP side, this test with the JavaScript side.
 */

type Examples = Record<string, { icon: string; attributes?: UXIconAttributes }>

const { default: examples } = Object.values(
    import.meta.glob<{ default: Examples }>('../../docs/examples/examples.json', { eager: true })
)[0]
const { loaders } = Object.values(
    import.meta.glob<{ loaders: UXIconLoaders }>('../../docs/src/data/icons/loaders.js', { eager: true })
)[0]
const renders = import.meta.glob<string>('../../docs/src/data/examples/*.html', {
    query: '?raw',
    import: 'default',
    eager: true,
})

describe('renderIcon() renders the same HTML as ux_icon()', () => {
    test.each(Object.entries(examples))('%s', async (name, { icon: iconName, attributes }) => {
        const icon = await loadIcon(loaders, iconName)
        const twigHtml = renders[`../../docs/src/data/examples/${name}.html`]

        if (icon === null || twigHtml === undefined) {
            throw new Error(`Example "${name}" not found: run php docs/scripts/render-examples.php`)
        }

        expect(renderIcon(icon, attributes)).toBe(twigHtml)
    })
})
