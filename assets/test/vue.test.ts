import { describe, expect, test, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import type { UXIconData, UXIconLoaders } from '../src/index'
import { UXIcon, UXLazyIcon } from '../src/vue'

const icon: UXIconData = {
    name: 'lucide:trash-2',
    attributes: { viewBox: '0 0 24 24', class: 'icon', 'stroke-width': '1.5' },
    children: [
        ['g', { 'stroke-linecap': 'round' }, [['path', { d: 'M3 6h18' }]]],
        ['title', {}, ['Trash']],
    ],
}

function mount(attrs: Record<string, unknown> = {}): SVGSVGElement {
    const container = document.createElement('div')
    createApp({ render: () => h(UXIcon, { icon, ...attrs }) }).mount(container)

    return container.querySelector('svg') as SVGSVGElement
}

describe('UXIcon', () => {
    test('renders the icon with dumped attributes', () => {
        const svg = mount()

        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('class')).toBe('icon')
        expect(svg.getAttribute('stroke-width')).toBe('1.5')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.innerHTML).toBe('<g stroke-linecap="round"><path d="M3 6h18"></path></g><title>Trash</title>')
        expect((svg.querySelector('path') as Element).namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    test('attributes override dumped ones', () => {
        const svg = mount({ class: 'text-danger', 'stroke-width': 2, 'aria-label': 'Delete' })

        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.getAttribute('stroke-width')).toBe('2')
        expect(svg.hasAttribute('aria-hidden')).toBe(false)
    })

    test('class arrays and objects keep the Vue semantics', () => {
        const svg = mount({ class: ['a', { b: true, c: false }] })

        expect(svg.getAttribute('class')).toBe('a b')
    })

    test('listeners are passed as-is', () => {
        const onClick = vi.fn()
        mount({ onClick }).dispatchEvent(new MouseEvent('click'))

        expect(onClick).toHaveBeenCalledOnce()
    })
})

describe('UXLazyIcon', () => {
    async function flush(): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve))
        await nextTick()
    }

    function mountByName(props: { name?: string | null; loaders: UXIconLoaders; class?: string }): HTMLElement {
        const container = document.createElement('div')
        createApp({
            render: () => h(UXLazyIcon, props, { fallback: () => 'loading' }),
        }).mount(container)

        return container
    }

    test('renders the fallback slot, then the loaded icon', async () => {
        const container = mountByName({
            name: 'lucide:trash-2',
            loaders: { 'lucide:trash-2': () => Promise.resolve({ default: icon }) },
            class: 'text-danger',
        })
        expect(container.textContent).toBe('loading')

        await flush()

        const svg = container.querySelector('svg') as SVGSVGElement
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.innerHTML).toContain('<path d="M3 6h18">')
    })

    test('renders the fallback slot for an unknown name or a failed load', async () => {
        const unknown = mountByName({ name: 'lucide:missing', loaders: {} })
        const broken = mountByName({ name: 'broken', loaders: { broken: () => Promise.reject(new Error('network')) } })
        await flush()

        expect(unknown.textContent).toBe('loading')
        expect(broken.textContent).toBe('loading')
    })

    test('follows the name', async () => {
        const other = { ...icon, name: 'lucide:x', children: [['path', { d: 'M0 0' }]] } satisfies UXIconData
        const loaders = {
            'lucide:trash-2': () => Promise.resolve({ default: icon }),
            'lucide:x': () => Promise.resolve({ default: other }),
        }
        const name = ref('lucide:trash-2')
        const container = document.createElement('div')
        createApp({ render: () => h(UXLazyIcon, { name: name.value, loaders }) }).mount(container)
        await flush()
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M3 6h18')

        name.value = 'lucide:x'
        await flush()
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')
    })
})
