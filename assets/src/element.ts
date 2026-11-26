import {
    createIconElement,
    getLoadedIcon,
    hasIcon,
    loadIcon,
    type UXIconAttributes,
    type UXIconData,
    type UXIconLoaders,
} from './index'

/**
 * Registers a custom element rendering an icon by its name, for HTML written outside of a framework: Twig templates,
 * Turbo Streams, Stimulus controllers, HTML from an API...
 *
 *     import { defineIconElement } from '@silarhi/ux-icons-js/element';
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     defineIconElement(loaders);
 *
 *     <ux-icon name="lucide:trash-2" class="text-danger" aria-label="Delete"></ux-icon>
 *
 * The element is a placeholder: once its icon is loaded, it is replaced by the <svg> that "ux_icon()" renders with the
 * same attributes (all but "name"). Its children are shown until then, and stay for an unknown name or a failed load.
 *
 * Defining the same tag name again returns the element already defined.
 */
export function defineIconElement(loaders: UXIconLoaders, tagName = 'ux-icon'): CustomElementConstructor {
    const defined = customElements.get(tagName)
    if (defined !== undefined) {
        return defined
    }

    // declared here, so that importing this module does not require the DOM (e.g. on a server)
    class UXIconElement extends HTMLElement {
        static readonly observedAttributes: string[] = ['name']

        connectedCallback(): void {
            this.load()
        }

        // a placeholder renamed while its icon loads (or before it is known) loads the new one
        attributeChangedCallback(): void {
            if (this.isConnected) {
                this.load()
            }
        }

        private load(): void {
            const name = this.getAttribute('name')
            if (!hasIcon(loaders, name)) {
                return
            }

            // an icon loaded earlier is rendered at once, e.g. when Turbo renders the placeholder again
            const loaded = getLoadedIcon(loaders, name)
            if (loaded !== null) {
                this.render(name, loaded)

                return
            }

            loadIcon(loaders, name).then(
                (icon) => icon !== null && this.render(name, icon),
                () => {
                    // the placeholder stays, its children are the fallback
                }
            )
        }

        private render(name: string, icon: UXIconData): void {
            // the placeholder was removed, or renamed, while its icon was loading
            if (!this.isConnected || this.getAttribute('name') !== name) {
                return
            }

            const attributes: UXIconAttributes = {}
            for (const { name, value } of Array.from(this.attributes)) {
                if (name !== 'name') {
                    attributes[name] = value
                }
            }

            this.replaceWith(createIconElement(icon, attributes))
        }
    }

    customElements.define(tagName, UXIconElement)

    return UXIconElement
}
