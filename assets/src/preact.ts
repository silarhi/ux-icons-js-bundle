import { type ComponentChild, type ComponentChildren, Fragment, h, type JSX, type VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import {
    getLoadedIcon,
    loadIcon,
    mapNodes,
    resolveIcon,
    splitAttributes,
    type UXIconData,
    type UXIconLoaders,
} from './index'

// "SVGAttributes" moved from the JSX namespace to the "preact" module in Preact 11, the intrinsic <svg> props are in both
// (with an "icon" HTML attribute in Preact 10)
type SVGIconProps = Omit<JSX.IntrinsicElements['svg'], 'dangerouslySetInnerHTML' | 'children' | 'icon'>

export type UXIconProps = SVGIconProps & {
    icon: UXIconData
}

export type UXLazyIconProps = Omit<SVGIconProps, 'name'> & {
    /** the icon name, e.g. from an API response; an unknown name renders the fallback */
    name: string | null | undefined
    /** the "loaders" map of "var/icons/loaders.js" */
    loaders: UXIconLoaders
    /** rendered while the icon loads, or for an unknown name (default: nothing) */
    fallback?: ComponentChildren
}

/**
 * Renders a dumped icon, with the same attributes as the "ux_icon()" Twig function.
 *
 * Preact sets the HTML attribute names (from the YAML configuration and SVG files) as they are, without conversion.
 *
 *     import { LucideTrash2Icon } from '../var/icons/index.js';
 *
 *     <UXIcon icon={LucideTrash2Icon} class="text-danger" aria-label="Delete" />
 */
export function UXIcon({ icon, className, ...props }: UXIconProps): VNode {
    // On SVG elements, Preact sets "className" as "class" in the browser, but not on the server: it is given as "class"
    const [attributes, passthrough] = splitAttributes(className === undefined ? props : { class: className, ...props })

    return h(
        'svg',
        { ...resolveIcon(icon, attributes), ...passthrough },
        mapNodes<ComponentChild>(icon.children, (tag, attributes, children) => h(tag, attributes, children))
    )
}

/**
 * Renders an icon by a name known only at runtime, loading that icon alone, like {@link UXIcon} once loaded.
 *
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     <UXLazyIcon name={data.icon} loaders={loaders} fallback={<Spinner />} />
 */
export function UXLazyIcon({ name, loaders, fallback = null, ...props }: UXLazyIconProps): VNode {
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

    // until the effect runs, the state may still hold the icon of the previous name;
    // the fallback is wrapped as Preact < 10.25 types a component as returning a VNode or null
    return icon !== null && icon.name === name ? UXIcon({ ...props, icon }) : h(Fragment, null, fallback)
}
