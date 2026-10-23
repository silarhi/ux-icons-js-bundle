import { type ComponentChildren, h, type JSX } from 'preact'
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

type SVGIconProps = Omit<JSX.SVGAttributes<SVGSVGElement>, 'dangerouslySetInnerHTML' | 'children'>

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
 * Preact takes HTML attribute names ("class", "stroke-width"), so the dumped attributes are given as they are.
 *
 *     import { LucideTrash2Icon } from '../var/icons/index.js';
 *
 *     <UXIcon icon={LucideTrash2Icon} class="text-danger" aria-label="Delete" />
 */
export function UXIcon({ icon, className, ...props }: UXIconProps): JSX.Element {
    // "className" is an alias of "class" in Preact: it overrides the dumped class instead of adding a second one
    const [attributes, passthrough] = splitAttributes(
        className === undefined || 'class' in props ? props : { ...props, class: className }
    )

    return h(
        'svg',
        { ...resolveIcon(icon, attributes), ...passthrough },
        ...mapNodes<JSX.Element>(icon.children, (tag, attributes, children) => h(tag, attributes, ...children))
    )
}

/**
 * Renders an icon by a name known only at runtime, loading that icon alone, like {@link UXIcon} once loaded.
 *
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     <UXLazyIcon name={data.icon} loaders={loaders} fallback={<Spinner />} />
 */
export function UXLazyIcon({ name, loaders, fallback = null, ...props }: UXLazyIconProps): ComponentChildren {
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
    return icon !== null && icon.name === name ? h(UXIcon, { ...props, icon }) : fallback
}
