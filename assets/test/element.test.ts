import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineIconElement } from '../src/element'
import { renderIcon, type UXIconData } from '../src/index'

const icon: UXIconData = {
    name: 'lucide:trash-2',
    attributes: { viewBox: '0 0 24 24', class: 'icon' },
    children: [['path', { d: 'M3 6h18' }]],
}

const check: UXIconData = { ...icon, name: 'lucide:check', children: [['path', { d: 'M20 6L9 17l-5-5' }]] }

let count = 0

// a custom element cannot be defined twice: each test registers its own tag name
function define(loaders: Parameters<typeof defineIconElement>[0]): string {
    const tagName = `ux-icon-${++count}`
    defineIconElement(loaders, tagName)

    return tagName
}

function deferred(): {
    promise: Promise<{ default: UXIconData }>
    resolve: (data: UXIconData) => void
    reject: () => void
} {
    let resolve: (data: UXIconData) => void = () => {}
    let reject: () => void = () => {}
    const promise = new Promise<{ default: UXIconData }>((onResolve, onReject) => {
        resolve = (data) => onResolve({ default: data })
        reject = () => onReject(new Error('network'))
    })

    return { promise, resolve, reject }
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve))

afterEach(() => {
    document.body.innerHTML = ''
})

describe('defineIconElement', () => {
    test('replaces the placeholder with the svg of ux_icon()', async () => {
        const tagName = define({ 'lucide:trash-2': () => Promise.resolve({ default: icon }) })
        document.body.innerHTML = `<p><${tagName} name="lucide:trash-2" class="text-danger" aria-label="Delete" data-x></${tagName}></p>`

        await flush()

        expect(document.body.innerHTML).toBe(
            `<p>${renderIcon(icon, { class: 'text-danger', 'aria-label': 'Delete', 'data-x': '' })}</p>`
        )
        expect(document.querySelector('svg')?.namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    test('shows its children until the icon is loaded', async () => {
        const pending = deferred()
        const tagName = define({ 'lucide:trash-2': () => pending.promise })
        document.body.innerHTML = `<${tagName} name="lucide:trash-2">…</${tagName}>`
        await flush()

        expect(document.body.textContent).toBe('…')

        pending.resolve(icon)
        await flush()

        expect(document.querySelector('svg path')?.getAttribute('d')).toBe('M3 6h18')
    })

    test('renders an icon loaded earlier at once', async () => {
        const tagName = define({ 'lucide:trash-2': () => Promise.resolve({ default: icon }) })
        document.body.innerHTML = `<${tagName} name="lucide:trash-2"></${tagName}>`
        await flush()

        document.body.innerHTML = `<${tagName} name="lucide:trash-2"></${tagName}>`

        expect(document.querySelector('svg')).not.toBeNull()
    })

    test.each([
        ['an unknown name', 'name="lucide:missing"'],
        ['no name', ''],
    ])('keeps the placeholder for %s', async (_, attributes) => {
        const tagName = define({ 'lucide:trash-2': () => Promise.resolve({ default: icon }) })
        document.body.innerHTML = `<${tagName} ${attributes}>?</${tagName}>`
        await flush()

        expect(document.querySelector(tagName)?.textContent).toBe('?')
    })

    test('keeps the placeholder when the icon fails to load', async () => {
        const pending = deferred()
        const tagName = define({ 'lucide:trash-2': () => pending.promise })
        document.body.innerHTML = `<${tagName} name="lucide:trash-2">?</${tagName}>`

        pending.reject()
        await flush()

        expect(document.querySelector(tagName)?.textContent).toBe('?')
    })

    test('loads the new icon of a renamed placeholder', async () => {
        const pending = deferred()
        const tagName = define({
            'lucide:trash-2': () => pending.promise,
            'lucide:check': () => Promise.resolve({ default: check }),
        })
        document.body.innerHTML = `<${tagName} name="lucide:trash-2"></${tagName}>`
        document.querySelector(tagName)?.setAttribute('name', 'lucide:check')
        await flush()

        pending.resolve(icon)
        await flush()

        expect(document.querySelectorAll('svg')).toHaveLength(1)
        expect(document.querySelector('svg path')?.getAttribute('d')).toBe('M20 6L9 17l-5-5')
    })

    test('does not render a placeholder removed while its icon loads', async () => {
        const pending = deferred()
        const tagName = define({ 'lucide:trash-2': () => pending.promise })
        document.body.innerHTML = `<${tagName} name="lucide:trash-2"></${tagName}>`
        const placeholder = document.querySelector(tagName) as Element
        placeholder.remove()

        pending.resolve(icon)
        await flush()

        expect(placeholder.isConnected).toBe(false)
        expect(document.querySelector('svg')).toBeNull()
    })

    test('renders a placeholder created by script once connected', async () => {
        const tagName = define({ 'lucide:trash-2': () => Promise.resolve({ default: icon }) })
        const placeholder = document.createElement(tagName)
        placeholder.setAttribute('name', 'lucide:trash-2')
        await flush()
        expect(placeholder.isConnected).toBe(false)

        document.body.append(placeholder)
        await flush()

        expect(document.body.innerHTML).toBe(renderIcon(icon))
    })

    test('returns the element already defined for a tag name', () => {
        const loader = vi.fn(() => Promise.resolve({ default: icon }))
        const tagName = define({ 'lucide:trash-2': loader })

        expect(defineIconElement({}, tagName)).toBe(customElements.get(tagName))
    })
})
