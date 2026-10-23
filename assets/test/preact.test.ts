import { type ComponentChild, h, render } from 'preact'
import { act } from 'preact/test-utils'
import { renderToString } from 'preact-render-to-string'
import { describe, expect, test, vi } from 'vitest'
import { loadIcon, renderIcon, type UXIconData } from '../src/index'
import { UXIcon, type UXIconProps, UXLazyIcon } from '../src/preact'

const icon: UXIconData = {
    name: 'lucide:trash-2',
    attributes: { viewBox: '0 0 24 24', class: 'icon', 'stroke-width': '1.5', style: 'color: red; --size: 2em' },
    children: [
        ['g', { 'stroke-linecap': 'round', class: 'inner' }, [['path', { d: 'M3 6h18' }]]],
        ['title', {}, ['Trash & co']],
    ],
}

function mount(props: Partial<UXIconProps> = {}): SVGSVGElement {
    const container = document.createElement('div')
    render(h(UXIcon, { icon, ...props }), container)

    return container.querySelector('svg') as SVGSVGElement
}

describe('UXIcon', () => {
    test('renders on the server the same HTML as renderIcon()', () => {
        const attributes = { class: 'text-danger', 'aria-label': 'Delete', 'data-id': 1 }

        expect(renderToString(h(UXIcon, { icon }))).toBe(renderIcon(icon))
        expect(renderToString(h(UXIcon, { icon, ...attributes }))).toBe(renderIcon(icon, attributes))
    })

    test('renders the icon with dumped attributes', () => {
        const svg = mount()

        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('class')).toBe('icon')
        expect(svg.getAttribute('stroke-width')).toBe('1.5')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(svg.innerHTML).toBe(
            '<g stroke-linecap="round" class="inner"><path d="M3 6h18"></path></g><title>Trash &amp; co</title>'
        )
        expect((svg.querySelector('path') as Element).namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    test('attributes override dumped ones', () => {
        const svg = mount({ class: 'text-danger', 'stroke-width': 2, 'aria-label': 'Delete' })

        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.getAttribute('stroke-width')).toBe('2')
        expect(svg.hasAttribute('aria-hidden')).toBe(false)
    })

    test('className is given as class, on the server too', () => {
        expect(mount({ className: 'text-danger' }).getAttribute('class')).toBe('text-danger')
        expect(renderToString(h(UXIcon, { icon, className: 'text-danger' }))).toContain('class="text-danger"')
        expect(mount({ class: 'a', className: 'b' }).getAttribute('class')).toBe('a')
    })

    test('non-primitive props are passed as-is', () => {
        const onClick = vi.fn()
        const svg = mount({ onClick, style: { color: 'blue' } })
        svg.dispatchEvent(new MouseEvent('click'))

        expect(onClick).toHaveBeenCalledOnce()
        expect(svg.style.color).toBe('blue')
    })
})

describe('UXLazyIcon', () => {
    function mountByName(element: ComponentChild): {
        container: HTMLElement
        rerender: (next: ComponentChild) => void
    } {
        const container = document.createElement('div')
        act(() => render(element, container))

        return { container, rerender: (next) => act(() => render(next, container)) }
    }

    // loadIcon() resolves a few promises after the loader, act() alone does not wait for them
    async function flush(): Promise<void> {
        await act(() => new Promise((resolve) => setTimeout(resolve)))
    }

    const deferred = () => {
        let resolve: (value: { default: UXIconData }) => void = () => {}
        const promise = new Promise<{ default: UXIconData }>((r) => {
            resolve = r
        })

        return { promise, resolve }
    }

    test('renders the fallback, then the loaded icon', async () => {
        const pending = deferred()
        const loaders = { 'lucide:trash-2': () => pending.promise }
        const { container } = mountByName(
            h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: 'loading', class: 'text-danger' })
        )

        expect(container.textContent).toBe('loading')

        pending.resolve({ default: icon })
        await flush()

        const svg = container.querySelector('svg') as SVGSVGElement
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.querySelector('path')?.getAttribute('d')).toBe('M3 6h18')
    })

    test('renders an icon loaded earlier at once', async () => {
        const loaders = { 'lucide:trash-2': () => Promise.resolve({ default: icon }) }
        await loadIcon(loaders, 'lucide:trash-2')

        expect(renderToString(h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: 'loading' }))).toBe(
            renderIcon(icon)
        )
    })

    test('renders the fallback for an unknown name or a failed load', async () => {
        const loaders = { broken: () => Promise.reject(new Error('network')) }
        const unknown = mountByName(h(UXLazyIcon, { name: 'lucide:missing', loaders, fallback: '?' }))
        const broken = mountByName(h(UXLazyIcon, { name: 'broken', loaders, fallback: '?' }))
        const empty = mountByName(h(UXLazyIcon, { name: null, loaders }))
        await flush()

        expect(unknown.container.textContent).toBe('?')
        expect(broken.container.textContent).toBe('?')
        expect(empty.container.innerHTML).toBe('')
    })

    test('never renders the previous icon for a new name', async () => {
        const other = { ...icon, name: 'lucide:x', children: [['path', { d: 'M0 0' }]] } satisfies UXIconData
        const pending = deferred()
        const loaders = {
            'lucide:trash-2': () => Promise.resolve({ default: icon }),
            'lucide:x': () => pending.promise,
        }
        const { container, rerender } = mountByName(h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: '…' }))
        await flush()
        expect(container.querySelector('svg')).not.toBeNull()

        rerender(h(UXLazyIcon, { name: 'lucide:x', loaders, fallback: '…' }))
        expect(container.textContent).toBe('…')

        pending.resolve({ default: other })
        await flush()
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')
    })
})
