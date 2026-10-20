import { describe, expect, test, vi } from 'vitest'
import { createIconElement, getLoadedIcon, loadIcon, renderIcon, resolveIcon, type UXIconData } from '../src/index'

const icon: UXIconData<'lucide:trash-2'> = {
    name: 'lucide:trash-2',
    attributes: { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor', class: 'icon' },
    children: [['path', { d: 'M3 6h18' }]],
}

describe('resolveIcon', () => {
    test('dumped attributes are kept, and aria-hidden is added', () => {
        expect(resolveIcon(icon)).toEqual({
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'currentColor',
            class: 'icon',
            'aria-hidden': 'true',
        })
    })

    test('given attributes override dumped ones, and keep the dumped order', () => {
        const attributes = resolveIcon(icon, { class: 'text-danger', width: 24 })

        expect(attributes.class).toBe('text-danger')
        expect(attributes.width).toBe('24')
        expect(Object.keys(attributes)).toEqual(['xmlns', 'viewBox', 'fill', 'class', 'width', 'aria-hidden'])
    })

    test('undefined keeps the dumped value, null omits it', () => {
        const attributes = resolveIcon(icon, { class: undefined, fill: null })

        expect(attributes.class).toBe('icon')
        expect(attributes).not.toHaveProperty('fill')
    })

    test('booleans follow the html_attr() rules', () => {
        const attributes = resolveIcon(icon, {
            fill: false,
            focusable: true,
            'aria-current': true,
            'aria-expanded': false,
            'data-active': true,
            'data-hidden': false,
        })

        expect(attributes).not.toHaveProperty('fill')
        expect(attributes).not.toHaveProperty('data-hidden')
        expect(attributes.focusable).toBe('')
        expect(attributes['aria-current']).toBe('true')
        expect(attributes['aria-expanded']).toBe('false')
        expect(attributes['data-active']).toBe('true')
    })

    test.each(['aria-hidden', 'aria-label', 'aria-labelledby', 'title'])(
        'no aria-hidden when "%s" is provided',
        (name) => {
            const attributes = resolveIcon(icon, { [name]: 'Delete' })

            expect(attributes['aria-hidden']).toBe(name === 'aria-hidden' ? 'Delete' : undefined)
        }
    )

    test('dumped booleans are rendered like Icon::toHtml()', () => {
        const attributes = resolveIcon({
            ...icon,
            attributes: { focusable: false, 'aria-busy': false, 'aria-current': true, 'data-x': true },
        })

        expect(attributes).toEqual({ 'aria-current': 'true', 'data-x': '', 'aria-hidden': 'true' })
    })

    test('omitted attributes keep their position, like Icon::withAttributes()', () => {
        const dumped = { ...icon, attributes: { xmlns: 'http://www.w3.org/2000/svg', focusable: false, fill: 'none' } }

        expect(Object.keys(resolveIcon(dumped, { focusable: true }))).toEqual([
            'xmlns',
            'focusable',
            'fill',
            'aria-hidden',
        ])
    })

    test('arrays are token lists, like html_attr()', () => {
        expect(resolveIcon(icon, { class: ['btn', false, null, undefined, 'active', 1] }).class).toBe('btn active 1')
        expect(resolveIcon(icon, { class: ['btn', true] }).class).toBe('btn')
        expect(resolveIcon(icon, { class: [true] }).class).toBe('')
        expect(resolveIcon(icon, { class: [false, null] })).not.toHaveProperty('class')
        expect(resolveIcon(icon, { 'aria-describedby': ['a', 'b'] })['aria-describedby']).toBe('a b')
    })

    test('style objects and arrays are inline styles, like html_attr()', () => {
        expect(resolveIcon(icon, { style: { color: 'red', 'font-size': null, opacity: 0, margin: '' } }).style).toBe(
            'color: red; opacity: 0;'
        )
        expect(resolveIcon(icon, { style: ['color: red;', ' width: 1px '] }).style).toBe('color: red; width: 1px;')
        expect(resolveIcon(icon, { style: { color: null } })).not.toHaveProperty('style')
    })

    test('data-* arrays and objects are JSON encoded like json_encode()', () => {
        const attributes = resolveIcon(icon, { 'data-config': { url: 'a/b', label: 'é' }, 'data-ids': [1, 2] })

        expect(attributes['data-config']).toBe('{"url":"a\\/b","label":"\\u00e9"}')
        expect(attributes['data-ids']).toBe('[1,2]')
    })

    test('aria-hidden can be explicitly disabled', () => {
        expect(resolveIcon(icon, { 'aria-hidden': false })['aria-hidden']).toBe('false')
    })
})

describe('renderIcon', () => {
    test('renders the same HTML as ux_icon()', () => {
        expect(renderIcon(icon, { class: 'a"b', 'aria-label': 'Delete' })).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="a&quot;b" aria-label="Delete"><path d="M3 6h18"></path></svg>'
        )
    })

    test('serializes the body like the PHP HTML5 serializer', () => {
        const html = renderIcon({
            ...icon,
            children: [
                ['text', { title: 'a<b>c&d"e\u00A0' }, ['x<y>z&w\u00A0v"q\'', ['tspan', {}, ['t']]]],
                ['style', {}, ['a > b {}']],
            ],
        })

        expect(html).toContain(
            '<text title="a<b>c&amp;d&quot;e&nbsp;">x&lt;y&gt;z&amp;w&nbsp;v"q\'<tspan>t</tspan></text><style>a &gt; b {}</style>'
        )
    })
})

describe('createIconElement', () => {
    test('creates SVG elements, without innerHTML', () => {
        const svg = createIconElement(
            {
                ...icon,
                attributes: { ...icon.attributes, 'xmlns:xlink': 'http://www.w3.org/1999/xlink' },
                children: [['defs', {}, [['linearGradient', { id: 'a' }]]], ['use', { 'xlink:href': '#a' }], 'text'],
            },
            { width: '2em' }
        )

        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(svg.getAttribute('width')).toBe('2em')
        expect(svg.getAttribute('aria-hidden')).toBe('true')

        const gradient = svg.querySelector('linearGradient') as Element
        expect(gradient.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(gradient.tagName).toBe('linearGradient')

        const use = svg.querySelector('use') as Element
        expect(use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#a')
        expect(svg.lastChild?.textContent).toBe('text')
    })
})

describe('loadIcon', () => {
    const loader = (data: UXIconData) => vi.fn(() => Promise.resolve({ default: data }))

    test('loads an icon by its name, once', async () => {
        const trash = loader(icon)
        const loaders = { 'lucide:trash-2': trash }

        expect(getLoadedIcon(loaders, 'lucide:trash-2')).toBeNull()
        expect(await loadIcon(loaders, 'lucide:trash-2')).toBe(icon)
        expect(await loadIcon(loaders, 'lucide:trash-2')).toBe(icon)
        expect(getLoadedIcon(loaders, 'lucide:trash-2')).toBe(icon)
        expect(trash).toHaveBeenCalledOnce()
    })

    test('concurrent calls share one load', async () => {
        const trash = loader(icon)
        const loaders = { 'lucide:trash-2': trash }

        const [first, second] = await Promise.all([
            loadIcon(loaders, 'lucide:trash-2'),
            loadIcon(loaders, 'lucide:trash-2'),
        ])

        expect(first).toBe(icon)
        expect(second).toBe(icon)
        expect(trash).toHaveBeenCalledOnce()
    })

    test.each([null, undefined, 'lucide:missing', 'toString', '__proto__'])('resolves to null for %s', async (name) => {
        expect(await loadIcon({ 'lucide:trash-2': loader(icon) }, name)).toBeNull()
        expect(getLoadedIcon({}, name)).toBeNull()
    })

    test('a failed load rejects and can be retried', async () => {
        const flaky = vi
            .fn<() => Promise<{ default: UXIconData }>>()
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({ default: icon })
        const loaders = { 'lucide:trash-2': flaky }

        await expect(loadIcon(loaders, 'lucide:trash-2')).rejects.toThrow('network')
        expect(await loadIcon(loaders, 'lucide:trash-2')).toBe(icon)
        expect(flaky).toHaveBeenCalledTimes(2)
    })
})
