/**
 * An icon dumped by the "ux-icons-js:dump" command (or on cache warmup) into "var/icons/index.js".
 *
 * Its attributes are already resolved with the bundle configuration ("default_icon_attributes", icon set "icon_attributes", and "suffixes").
 */
export interface UXIconData<Name extends string = string> {
    readonly name: Name
    readonly attributes: Readonly<Record<string, string | boolean>>
    readonly children: readonly UXIconNode[]
}

/**
 * A node of the (sanitized) icon body: a text, or an element as a [tag, attributes, children?] tuple.
 *
 *     ['g', { fill: 'none' }, [['path', { d: 'M0 0' }]]]
 */
export type UXIconNode = string | UXIconElement

export type UXIconElement = readonly [
    tag: string,
    attributes: Readonly<Record<string, string>>,
    children?: readonly UXIconNode[],
]

type UXIconScalar = string | number | boolean | null | undefined

/**
 * Same values as the ones accepted by the "ux_icon()" Twig function.
 *
 * - "undefined" means "not provided", as with React/Vue optional props
 * - arrays are token lists, e.g. { class: ['btn', isActive && 'active'] }
 * - "style" also accepts an object, e.g. { style: { color: 'red', 'font-size': null } }
 * - "data-*" arrays and objects are JSON encoded
 */
export type UXIconAttributeValue = UXIconScalar | readonly UXIconScalar[] | Readonly<Record<string, UXIconScalar>>

export type UXIconAttributes = Record<string, UXIconAttributeValue>

/**
 * Resolves the final SVG attributes of an icon, following the same rules as the "ux_icon()" Twig function.
 *
 * See "UXIconRuntime", twig/html-extra "HtmlExtension::htmlAttrValue()" and "IconRenderer":
 *
 * - precedence: dumped icon attributes < given attributes
 * - "undefined": the attribute is not provided, the dumped value is kept (JS-only, e.g. optional props)
 * - "null": the attribute is omitted, even if it has a dumped value
 * - "false": the attribute is omitted, except "aria-*" which becomes "false"
 * - "true": the attribute is rendered without value (""), except "aria-*" and "data-*" which become "true"
 * - numbers are cast to strings
 * - "aria-hidden" is set to "true" unless "aria-hidden", "aria-label", "aria-labelledby" or "title" is defined
 *
 * The returned object preserves insertion order (dumped attributes first), framework adapters rely on it.
 */
export function resolveIcon(icon: UXIconData, attributes: UXIconAttributes = {}): Record<string, string> {
    // "null" marks an omitted attribute: like "false" in "Icon::withAttributes()", it keeps its position if set again
    const resolved: Record<string, string | null> = {}

    // Dumped attributes come from the configuration and SVG files, they are rendered like "Icon::toHtml()"
    for (const [name, value] of Object.entries(icon.attributes)) {
        resolved[name] = value === false ? null : value === true ? (name.startsWith('aria-') ? 'true' : '') : value
    }

    // Given attributes are rendered like "ux_icon()" ones, overriding a dumped value keeps its position
    for (const [name, value] of Object.entries(attributes)) {
        if (value !== undefined) {
            resolved[name] = htmlAttrValue(name, value)
        }
    }

    const rendered: Record<string, string> = {}
    for (const [name, value] of Object.entries(resolved)) {
        if (value !== null) {
            rendered[name] = value
        }
    }

    if (!['aria-hidden', 'aria-label', 'aria-labelledby', 'title'].some((name) => name in rendered)) {
        rendered['aria-hidden'] = 'true'
    }

    return rendered
}

/**
 * Port of twig/html-extra "HtmlExtension::htmlAttrValue()", "null" means omitted.
 */
function htmlAttrValue(name: string, value: Exclude<UXIconAttributeValue, undefined>): string | null {
    if (name.startsWith('aria-') && typeof value === 'boolean') {
        return String(value)
    }

    if (name.startsWith('data-')) {
        if (value !== null && typeof value === 'object') {
            return phpJsonEncode(value)
        }
        if (value === true) {
            return 'true'
        }
    }

    if (value !== null && typeof value === 'object') {
        return name === 'style' ? inlineStyle(value) : separatedTokenList(Object.values(value))
    }

    if (value === true) {
        return ''
    }

    return value === null || value === false ? null : String(value)
}

/**
 * Port of twig/html-extra "SeparatedTokenList::getValue()".
 */
function separatedTokenList(tokens: readonly UXIconScalar[]): string | null {
    // "undefined" has no PHP equivalent, it is ignored like "null"
    const filtered = tokens.filter((token) => token !== null && token !== undefined && token !== false)
    if (filtered.length === 0) {
        return null
    }

    // "true" tokens are not printed, but keep the attribute
    return filtered
        .filter((token) => token !== true)
        .join(' ')
        .trim()
}

/**
 * Port of twig/html-extra "InlineStyle::getValue()": { color: 'red' } => "color: red;", ['color: red'] => "color: red;".
 */
function inlineStyle(declarations: Readonly<Record<string, UXIconScalar>> | readonly UXIconScalar[]): string | null {
    let style = ''
    for (const [name, value] of Object.entries(declarations)) {
        // "0" is a valid CSS value, only the values that carry no declaration are skipped
        if (value === null || value === undefined || typeof value === 'boolean' || value === '') {
            continue
        }

        style += /^\d+$/.test(name) ? `${trimChars(String(value), '; ')}; ` : `${name}: ${value}; `
    }

    return style.trim() || null
}

/**
 * Port of PHP "json_encode()" default flags: "/" and non-ASCII characters are escaped.
 */
function phpJsonEncode(value: unknown): string {
    return JSON.stringify(value)
        .replaceAll('/', '\\/')
        .replace(/[\u0080-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

/**
 * Port of PHP "trim($value, $characters)".
 */
function trimChars(value: string, characters: string): string {
    let start = 0
    let end = value.length
    while (start < end && characters.includes(value[start])) {
        start++
    }
    while (end > start && characters.includes(value[end - 1])) {
        end--
    }

    return value.slice(start, end)
}

/**
 * Renders an icon as an HTML string, like the "ux_icon()" Twig function.
 */
export function renderIcon(icon: UXIconData, attributes: UXIconAttributes = {}): string {
    let html = '<svg'
    for (const [name, value] of Object.entries(resolveIcon(icon, attributes))) {
        html += ` ${name}="${escapeRootAttribute(value)}"`
    }

    return `${html}>${icon.children.map(serializeNode).join('')}</svg>`
}

/**
 * Creates an icon as a DOM element, e.g. to be inserted from a Stimulus controller.
 */
export function createIconElement(icon: UXIconData, attributes: UXIconAttributes = {}): SVGSVGElement {
    return createElement(['svg', resolveIcon(icon, attributes), icon.children]) as SVGSVGElement
}

/**
 * Calls "create" for every element of the tree, from the leaves to the root.
 *
 * Framework adapters use it to build their virtual nodes without "innerHTML".
 *
 * @internal
 */
export function mapNodes<T>(
    nodes: readonly UXIconNode[],
    create: (tag: string, attributes: Readonly<Record<string, string>>, children: (T | string)[]) => T
): (T | string)[] {
    return nodes.map((node) =>
        typeof node === 'string' ? node : create(node[0], node[1], mapNodes(node[2] ?? [], create))
    )
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const ATTRIBUTE_NAMESPACES: Record<string, string> = {
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/',
}

function createElement([tag, attributes, children = []]: UXIconElement): Element {
    const element = document.createElementNS(SVG_NAMESPACE, tag)
    for (const [name, value] of Object.entries(attributes)) {
        // "xlink:href" => "xlink", "xmlns" => "xmlns"
        const namespace = ATTRIBUTE_NAMESPACES[name.split(':')[0]]
        if (namespace && (name === 'xmlns' || name.includes(':'))) {
            element.setAttributeNS(namespace, name, value)
        } else {
            element.setAttribute(name, value)
        }
    }
    element.append(
        ...children.map((child) => (typeof child === 'string' ? document.createTextNode(child) : createElement(child)))
    )

    return element
}

/**
 * Serializes like PHP "Dom\HTMLDocument::saveHtml()", used to render the icon body in "ux_icon()".
 */
function serializeNode(node: UXIconNode): string {
    if (typeof node === 'string') {
        return escapeHtml(node, true)
    }

    const [tag, attributes, children = []] = node
    let html = `<${tag}`
    for (const [name, value] of Object.entries(attributes)) {
        html += ` ${name}="${escapeHtml(value)}"`
    }

    return `${html}>${children.map(serializeNode).join('')}</${tag}>`
}

/**
 * Escapes like PHP "htmlspecialchars()", used by "Icon::toHtml()" for the root <svg> attributes.
 */
function escapeRootAttribute(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

/**
 * Escapes like the HTML5 serializer: "&", NBSP, and "<" ">" in texts or '"' in attributes.
 */
function escapeHtml(value: string, text = false): string {
    const escaped = value.replaceAll('&', '&amp;').replaceAll('\u00A0', '&nbsp;')

    return text ? escaped.replaceAll('<', '&lt;').replaceAll('>', '&gt;') : escaped.replaceAll('"', '&quot;')
}

/**
 * Splits framework props between the "ux_icon()" rules and the framework.
 *
 * Primitive values follow the "ux_icon()" rules, others (event handlers, style objects, class arrays, refs) are passed as-is to the framework.
 *
 * @internal
 */
export function splitAttributes(values: Record<string, unknown>): [UXIconAttributes, Record<string, unknown>] {
    const attributes: UXIconAttributes = {}
    const passthrough: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(values)) {
        if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) {
            attributes[name] = value as UXIconAttributeValue
        } else {
            passthrough[name] = value
        }
    }

    return [attributes, passthrough]
}

/**
 * Loads the module of one dumped icon, see "var/icons/loaders.js".
 */
export type UXIconLoader<Name extends string = string> = () => Promise<{ readonly default: UXIconData<Name> }>

/**
 * The "loaders" map dumped into "var/icons/loaders.js": icon name (aliases included) => module of the icon.
 */
export type UXIconLoaders<Name extends string = string> = Readonly<Record<Name, UXIconLoader<Name>>>

const loadedIcons = new WeakMap<UXIconLoaders, Map<string, UXIconData>>()
const pendingIcons = new WeakMap<UXIconLoaders, Map<string, Promise<UXIconData>>>()

function cacheOf<T>(caches: WeakMap<UXIconLoaders, Map<string, T>>, loaders: UXIconLoaders): Map<string, T> {
    let cache = caches.get(loaders)
    if (cache === undefined) {
        cache = new Map()
        caches.set(loaders, cache)
    }

    return cache
}

/**
 * Loads an icon by its name, known only at runtime (e.g. from an API response), from the dumped loaders.
 *
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     const icon = await loadIcon(loaders, data.icon);
 *
 * Resolves to null for a name the dump does not know (not a local icon), and rejects if the module fails to load.
 * Each icon is loaded once: later calls resolve from the cache.
 */
export async function loadIcon(loaders: UXIconLoaders, name: string | null | undefined): Promise<UXIconData | null> {
    if (name === null || name === undefined || !Object.hasOwn(loaders, name)) {
        return null
    }

    const loaded = cacheOf(loadedIcons, loaders).get(name)
    if (loaded !== undefined) {
        return loaded
    }

    const pending = cacheOf(pendingIcons, loaders)
    let promise = pending.get(name)
    if (promise === undefined) {
        promise = loaders[name]().then(
            (module) => {
                cacheOf(loadedIcons, loaders).set(name, module.default)
                pending.delete(name)

                return module.default
            },
            (error: unknown) => {
                // a failed load (e.g. network) can be retried
                pending.delete(name)
                throw error
            }
        )
        pending.set(name, promise)
    }

    return promise
}

/**
 * Returns an icon already loaded by {@link loadIcon}, synchronously, or null.
 *
 * Framework adapters use it to render a loaded icon without waiting for a promise.
 */
export function getLoadedIcon(loaders: UXIconLoaders, name: string | null | undefined): UXIconData | null {
    return name === null || name === undefined ? null : (loadedIcons.get(loaders)?.get(name) ?? null)
}
