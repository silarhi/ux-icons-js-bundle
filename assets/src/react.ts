import {
    type CSSProperties,
    createElement,
    type ReactElement,
    type ReactNode,
    type SVGProps,
    useEffect,
    useState,
} from 'react'
import {
    getLoadedIcon,
    loadIcon,
    mapNodes,
    resolveIcon,
    splitAttributes,
    type UXIconData,
    type UXIconLoaders,
} from './index'

// "name" selects the icon to load, it is not the SVG attribute
type SVGIconProps = Omit<SVGProps<SVGSVGElement>, 'dangerouslySetInnerHTML' | 'children' | 'name'>

/**
 * An icon imported by its export name, or loaded by a name known only at runtime.
 */
export type UXIconProps = SVGIconProps &
    (
        | { icon: UXIconData; name?: never; loaders?: never; fallback?: never }
        | {
              icon?: never
              /** e.g. from an API response; unknown names render the fallback */
              name: string | null | undefined
              /** the "loaders" map of "var/icons/loaders.js" */
              loaders: UXIconLoaders
              /** rendered while the icon loads, or for an unknown name (default: nothing) */
              fallback?: ReactNode
          }
    )

const REACT_PROP_NAMES: Record<string, string> = {
    class: 'className',
    for: 'htmlFor',
    tabindex: 'tabIndex',
}

/**
 * Renders a dumped icon, with the same attributes as the "ux_icon()" Twig function.
 *
 *     import { LucideTrash2Icon } from '../var/icons/index.js';
 *
 *     <UXIcon icon={LucideTrash2Icon} className="text-danger" aria-label="Delete" />
 *
 * Or by a name known only at runtime, loading that icon alone:
 *
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     <UXIcon name={data.icon} loaders={loaders} fallback={<Spinner />} />
 */
export function UXIcon(props: UXIconProps): ReactElement {
    if (props.icon === undefined) {
        return createElement(LazyUXIcon, props)
    }

    const { icon, ...rest } = props
    const [attributes, passthrough] = splitAttributes(rest)

    return createElement(
        'svg',
        { ...toReactProps(resolveIcon(icon, attributes)), ...passthrough },
        // Static children given as arguments, so React does not require keys
        ...mapNodes<ReactElement>(icon.children, (tag, attributes, children) =>
            createElement(tag, toReactProps(attributes), ...children)
        )
    )
}

function LazyUXIcon({
    name,
    loaders,
    fallback = null,
    ...props
}: SVGIconProps & { name: string | null | undefined; loaders: UXIconLoaders; fallback?: ReactNode }): ReactNode {
    // an icon loaded earlier renders at once, without a fallback flash
    const [icon, setIcon] = useState(() => getLoadedIcon(loaders, name))

    useEffect(() => {
        let active = true
        loadIcon(loaders, name).then(
            (loaded) => active && setIcon(loaded),
            () => active && setIcon(null)
        )

        return () => {
            active = false
        }
    }, [loaders, name])

    // until the effect runs, the state may still hold the icon of the previous name
    return icon !== null && icon.name === name ? createElement(UXIcon, { ...props, icon }) : fallback
}

/**
 * Converts HTML attribute names (from the YAML configuration and SVG files) to React prop names.
 *
 * "class" => "className", "stroke-width" => "strokeWidth", "xlink:href" => "xlinkHref", "style" => object, ...
 *
 * As attributes are processed in order, a React-named prop given by the user (e.g. "strokeWidth") overrides the dumped HTML-named one (e.g. "stroke-width").
 */
function toReactProps(attributes: Record<string, string>): Record<string, unknown> {
    const props: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(attributes)) {
        if (name === 'style') {
            props.style = parseStyle(value)
        } else if (name.startsWith('aria-') || name.startsWith('data-')) {
            props[name] = value
        } else {
            props[REACT_PROP_NAMES[name] ?? camelize(name)] = value
        }
    }

    return props
}

function parseStyle(style: string): CSSProperties {
    const properties: Record<string, string> = {}
    for (const declaration of style.split(';')) {
        const index = declaration.indexOf(':')
        if (index === -1) {
            continue
        }

        const property = declaration.slice(0, index).trim()
        properties[property.startsWith('--') ? property : camelize(property)] = declaration.slice(index + 1).trim()
    }

    return properties
}

function camelize(name: string): string {
    return name.replace(/[-:]([a-z])/g, (_, letter: string) => letter.toUpperCase())
}
