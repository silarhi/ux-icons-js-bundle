import { createElement, type ReactElement, act as reactAct } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { act as testUtilsAct } from 'react-dom/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { loadIcon, type UXIconData } from '../src/index'
import { UXIcon, type UXIconProps, UXLazyIcon } from '../src/react'

// "act" is exported by "react" since React 18.3, and deprecated in "react-dom/test-utils" since React 19
const act = reactAct ?? testUtilsAct

type RenderedProps = Record<string, unknown> & { children: ReactElement<Record<string, unknown>>[] }

// React 19 types the props of an element as "unknown"
function render(props: UXIconProps): ReactElement<RenderedProps> {
    return UXIcon(props) as ReactElement<RenderedProps>
}

const icon: UXIconData = {
    name: 'lucide:trash-2',
    attributes: { viewBox: '0 0 24 24', class: 'icon', 'stroke-width': '1.5', style: 'color: red; --size: 2em' },
    children: [
        ['g', { 'stroke-linecap': 'round', class: 'inner' }, [['path', { d: 'M3 6h18' }]]],
        ['title', {}, ['Trash']],
    ],
}

describe('UXIcon', () => {
    test('converts HTML attribute names to React prop names', () => {
        const element = render({
            icon: {
                ...icon,
                attributes: {
                    class: 'icon',
                    'stroke-width': '1.5',
                    'xlink:href': '#a',
                    tabindex: '0',
                    'aria-label': 'Delete',
                    'data-id': '1',
                    style: 'background-color: red; --size: 2em',
                },
            },
        })

        expect(element.props).toMatchObject({
            className: 'icon',
            strokeWidth: '1.5',
            xlinkHref: '#a',
            tabIndex: '0',
            'aria-label': 'Delete',
            'data-id': '1',
            style: { backgroundColor: 'red', '--size': '2em' },
        })
    })

    test('skips style declarations without a value', () => {
        const element = render({ icon: { ...icon, attributes: { style: 'color: red;; bogus; --size: 2em;' } } })

        expect(element.props.style).toEqual({ color: 'red', '--size': '2em' })
    })

    test('renders the icon with dumped attributes', () => {
        const html = renderToStaticMarkup(createElement(UXIcon, { icon }))

        expect(html).toBe(
            '<svg viewBox="0 0 24 24" class="icon" stroke-width="1.5" style="color:red;--size:2em" aria-hidden="true"><g stroke-linecap="round" class="inner"><path d="M3 6h18"></path></g><title>Trash</title></svg>'
        )
    })

    test('React props override dumped attributes', () => {
        const html = renderToStaticMarkup(
            createElement(UXIcon, { icon, className: 'text-danger', strokeWidth: 2, 'aria-label': 'Delete' })
        )

        expect(html).toContain('class="text-danger"')
        expect(html).toContain('stroke-width="2"')
        expect(html).toContain('aria-label="Delete"')
        expect(html).not.toContain('aria-hidden')
    })

    test('renders children as React elements, without dangerouslySetInnerHTML', () => {
        const element = render({ icon })

        expect(element.props).not.toHaveProperty('dangerouslySetInnerHTML')
        expect(element.props.children[0].type).toBe('g')
        expect(element.props.children[0].props).toMatchObject({ strokeLinecap: 'round', className: 'inner' })
    })

    test('non-primitive props are passed as-is', () => {
        const onClick = vi.fn()
        const element = render({ icon, onClick, style: { color: 'blue' } })

        expect(element.props.onClick).toBe(onClick)
        expect(element.props.style).toEqual({ color: 'blue' })
    })
})

describe('UXLazyIcon', () => {
    // React 19 warns when act() runs outside a test environment flag
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

    async function render(
        element: ReactElement
    ): Promise<{ container: HTMLElement; rerender: (next: ReactElement) => Promise<void> }> {
        const container = document.createElement('div')
        const root = createRoot(container)
        await act(async () => root.render(element))

        return { container, rerender: async (next) => act(async () => root.render(next)) }
    }

    const deferred = () => {
        let resolve: (value: { default: UXIconData }) => void = () => {}
        let reject: (reason: unknown) => void = () => {}
        const promise = new Promise<{ default: UXIconData }>((onResolve, onReject) => {
            resolve = onResolve
            reject = onReject
        })

        return { promise, resolve, reject }
    }

    test('renders the fallback, then the loaded icon', async () => {
        const pending = deferred()
        const loaders = { 'lucide:trash-2': () => pending.promise }
        const { container } = await render(
            createElement(UXLazyIcon, {
                name: 'lucide:trash-2',
                loaders,
                fallback: 'loading',
                className: 'text-danger',
            })
        )

        expect(container.textContent).toBe('loading')

        await act(async () => pending.resolve({ default: icon }))

        const svg = container.querySelector('svg') as SVGSVGElement
        expect(svg.getAttribute('class')).toBe('text-danger')
        expect(svg.querySelector('path')?.getAttribute('d')).toBe('M3 6h18')
    })

    test('renders an icon loaded earlier at once', async () => {
        const loaders = { 'lucide:trash-2': () => Promise.resolve({ default: icon }) }
        await loadIcon(loaders, 'lucide:trash-2')

        const html = renderToStaticMarkup(
            createElement(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: 'loading' })
        )

        expect(html).toContain('<svg')
    })

    test('renders the fallback for an unknown name or a failed load', async () => {
        const loaders = { broken: () => Promise.reject(new Error('network')) }

        expect(
            (await render(createElement(UXLazyIcon, { name: 'lucide:missing', loaders, fallback: '?' }))).container
                .textContent
        ).toBe('?')
        expect(
            (await render(createElement(UXLazyIcon, { name: 'broken', loaders, fallback: '?' }))).container.textContent
        ).toBe('?')
        expect((await render(createElement(UXLazyIcon, { name: null, loaders }))).container.innerHTML).toBe('')
    })

    test('never renders the previous icon for a new name', async () => {
        const other = { ...icon, name: 'lucide:x', children: [['path', { d: 'M0 0' }]] } satisfies UXIconData
        const pending = deferred()
        const loaders = {
            'lucide:trash-2': () => Promise.resolve({ default: icon }),
            'lucide:x': () => pending.promise,
        }
        const { container, rerender } = await render(
            createElement(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: '…' })
        )
        expect(container.querySelector('svg')).not.toBeNull()

        await rerender(createElement(UXLazyIcon, { name: 'lucide:x', loaders, fallback: '…' }))
        expect(container.textContent).toBe('…')

        await act(async () => pending.resolve({ default: other }))
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')
    })

    test.each([
        ['loads', (slow: ReturnType<typeof deferred>) => slow.resolve({ default: icon })],
        ['fails', (slow: ReturnType<typeof deferred>) => slow.reject(new Error('network'))],
    ])('keeps the icon of the new name when the previous one %s late', async (_label, settle) => {
        const other = { ...icon, name: 'lucide:x', children: [['path', { d: 'M0 0' }]] } satisfies UXIconData
        const slow = deferred()
        const loaders = {
            'lucide:trash-2': () => slow.promise,
            'lucide:x': () => Promise.resolve({ default: other }),
        }
        const { container, rerender } = await render(
            createElement(UXLazyIcon, { name: 'lucide:trash-2', loaders, fallback: '…' })
        )
        await rerender(createElement(UXLazyIcon, { name: 'lucide:x', loaders, fallback: '…' }))
        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')

        await act(async () => settle(slow))

        expect(container.querySelector('path')?.getAttribute('d')).toBe('M0 0')
    })
})
