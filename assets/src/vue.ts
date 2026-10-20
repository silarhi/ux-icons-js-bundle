import { defineComponent, h, type PropType, shallowRef, type VNode, watch } from 'vue'
import {
    getLoadedIcon,
    loadIcon,
    mapNodes,
    resolveIcon,
    splitAttributes,
    type UXIconData,
    type UXIconLoaders,
} from './index'

/**
 * Renders a dumped icon, with the same attributes as the "ux_icon()" Twig function.
 *
 *     <script setup>
 *     import { UXIcon } from '@silarhi/ux-icons-js/vue';
 *     import { LucideTrash2Icon } from '../var/icons/index.js';
 *     </script>
 *
 *     <UXIcon :icon="LucideTrash2Icon" class="text-danger" aria-label="Delete" />
 */
export const UXIcon = defineComponent({
    name: 'UXIcon',
    inheritAttrs: false,
    props: {
        icon: {
            type: Object as PropType<UXIconData>,
            required: true,
        },
    },
    setup(props, { attrs }) {
        return () => {
            const [attributes, passthrough] = splitAttributes(attrs)

            return h(
                'svg',
                { ...resolveIcon(props.icon, attributes), ...passthrough },
                mapNodes<VNode>(props.icon.children, (tag, attributes, children) => h(tag, attributes, children))
            )
        }
    },
})

/**
 * Renders an icon by a name known only at runtime, loading that icon alone, like {@link UXIcon} once loaded.
 *
 * The "fallback" slot renders while the icon loads, or for an unknown name.
 *
 *     <script setup>
 *     import { UXLazyIcon } from '@silarhi/ux-icons-js/vue';
 *     import { loaders } from '../var/icons/loaders.js';
 *     </script>
 *
 *     <UXLazyIcon :name="data.icon" :loaders="loaders"><template #fallback>…</template></UXLazyIcon>
 */
export const UXLazyIcon = defineComponent({
    name: 'UXLazyIcon',
    inheritAttrs: false,
    props: {
        name: {
            type: String as PropType<string | null>,
            default: undefined,
        },
        loaders: {
            type: Object as PropType<UXIconLoaders>,
            required: true,
        },
    },
    setup(props, { attrs, slots }) {
        const loaded = shallowRef<UXIconData | null>(null)

        watch(
            () => [props.loaders, props.name] as const,
            ([loaders, name], _, onCleanup) => {
                let active = true
                onCleanup(() => {
                    active = false
                })

                // an icon loaded earlier renders at once, without a fallback flash
                loaded.value = getLoadedIcon(loaders, name)
                loadIcon(loaders, name).then(
                    (icon) => {
                        if (active) {
                            loaded.value = icon
                        }
                    },
                    () => {
                        if (active) {
                            loaded.value = null
                        }
                    }
                )
            },
            { immediate: true }
        )

        return () =>
            loaded.value !== null && loaded.value.name === props.name
                ? h(UXIcon, { ...attrs, icon: loaded.value })
                : (slots.fallback?.() ?? null)
    },
})
