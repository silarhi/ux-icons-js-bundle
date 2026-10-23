import { type ComponentChild, h, render as renderInto, type VNode } from 'preact'
import { act } from 'preact/test-utils'
import { renderToStaticMarkup } from 'preact-render-to-string'
import { describe, expect, test, vi } from 'vitest'
import { loadIcon, type UXIconData } from '../src/index'
import { UXIcon, UXLazyIcon } from '../src/preact'

const icon: UXIconData = {
    name: 'lucide:trash-2',
    attributes: { viewBox: '0 0 24 24', class: 'icon', 'stroke-width': '1.5', style: 'color: red; --size: 2em' },
    children: [
        ['g', { 'stroke-linecap': 'round', class: 'inner' }, [['path', { d: 'M3 6h18' }]]],
        ['title', {}, ['Trash']],
    ],
}

function mount(element: ComponentChild): HTMLElement {
    const container = document.createElement('div')
    renderInto(element, container)

    return container
}

describe('UXIcon', () => {
    test('renders the icon with dumped attributes', () => {
        const html = renderToStaticMarkup(h(UXIcon, { icon }))

        expect(html).toBe(
            '<svg viewBox="0 0 24 24" class="icon" stroke-width="1.5" style="color: red; --size: 2em" aria-hidden="true"><g stroke-linecap="round" class="inner"><path d="M3 6h18"></path></g><title>Trash</title></svg>'
        )
    })

    test('keeps HTML attribute names in the DOM', () => {
        const svg = mount(
            h(UXIcon, { icon: { ...icon, attributes: { class: 'icon', 'xlink:href': '#a', tabindex: '0' } } })
        ).querySelector('svg') as SVGSVGElement

        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(svg.getAttribute('class')).toBe('icon')
        expect(svg.getAttribute('tabindex')).toBe('0')
        expect(svg.querySelector('g')?.getAttribute('stroke-linecap')).toBe('round')
    })

    test('props override dumped attributes', () => {
        const html = renderToStaticMarkup(
            h(UXIcon, { icon, class: 'text-danger', 'stroke-width': 2, 'aria-label': 'Delete' })
        )

        expect(html).toContain('class="text-danger"')
        expect(html).toContain('stroke-width="2"')
        expect(html).toContain('aria-label="Delete"')
        expect(html).not.toContain('aria-hidden')
    })

    test('className overrides the dumped class, like class', () => {
        const svg = mount(h(UXIcon, { icon, className: 'text-danger' })).querySelector('svg') as SVGSVGElement

        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(renderToStaticMarkup(h(UXIcon, { icon, class: 'a', className: 'b' }))).toContain('class="a"')
    })

    test('renders children as elements, without dangerouslySetInnerHTML', () => {
        const element = UXIcon({ icon }) as VNode<Record<string, unknown>>
        const [group] = element.props.children as VNode<Record<string, unknown>>[]

        expect(element.props).not.toHaveProperty('dangerouslySetInnerHTML')
        expect(group.type).toBe('g')
        expect(group.props).toMatchObject({ 'stroke-linecap': 'round', class: 'inner' })
    })

    test('non-primitive props are passed as-is', () => {
        const onClick = vi.fn()
        const svg = mount(h(UXIcon, { icon, onClick, style: { color: 'blue' } })).querySelector('svg') as SVGSVGElement
        svg.dispatchEvent(new MouseEvent('click'))

        expect(onClick).toHaveBeenCalledOnce()
        expect(svg.style.color).toBe('blue')
    })
})

describe('UXLazyIcon', () => {
    // Preact runs the effects once the act() callback returns: wait in a second act() for the loads they start
    async function settle(callback: () => void = () => {}): Promise<void> {
        await act(callback)
        await act(() => new Promise((resolve) => setTimeout(resolve)))
    }

    async function render(
        element: ComponentChild
    ): Promise<{ container: HTMLElement; rerender: (next: ComponentChild) => Promise<void> }> {
        const container = document.createElement('div')
        await settle(() => renderInto(element, container))

        return { container, rerender: (next) => settle(() => renderInto(next, container)) }
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
        const { container } = await render(
            h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: 'loading', class: 'text-danger' })
        )

        expect(container.textContent).toBe('loading')

        await settle(() => pending.resolve({ default: icon }))

        const svg = container.querySelector('svg') as SVGSVGElement
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.querySelector('path')?.getAttribute('d')).toBe('M3 6h18')
    })

    test('renders an icon loaded earlier at once', async () => {
        const loaders = { 'lucide:trash-2': () => Promise.resolve({ default: icon }) }
        await loadIcon(loaders, 'lucide:trash-2')

        const html = renderToStaticMarkup(h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: 'loading' }))

        expect(html).toContain('<svg')
    })

    test('renders the fallback for an unknown name or a failed load', async () => {
        const loaders = { broken: () => Promise.reject(new Error('network')) }

        expect(
            (await render(h(UXLazyIcon, { name: 'lucide:missing', loaders, fallback: '?' }))).container.textContent
        ).toBe('?')
        expect((await render(h(UXLazyIcon, { name: 'broken', loaders, fallback: '?' }))).container.textContent).toBe(
            '?'
        )
        expect((await render(h(UXLazyIcon, { name: null, loaders }))).container.innerHTML).toBe('')
    })

    test('never renders the previous icon for a new name', async () => {
        const other = { ...icon, name: 'lucide:x', children: [['path', { d: 'M0 0' }]] } satisfies UXIconData
        const pending = deferred()
        const loaders = {
            'lucide:trash-2': () => Promise.resolve({ default: icon }),
            'lucide:x': () => pending.promise,
        }
        const { container, rerender } = await render(h(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: '…' }))
        expect(container.querySelector('svg')).not.toBeNull()

        await rerender(h(UXLazyIcon, { name: 'lucide:x', loaders, fallback: '…' }))
        expect(container.textContent).toBe('…')

        await settle(() => pending.resolve({ default: other }))
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')
    })
})
