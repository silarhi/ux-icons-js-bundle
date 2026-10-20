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
 *
 * Or by a name known only at runtime, loading that icon alone (the "fallback" slot renders while it loads, or for an
 * unknown name):
 *
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     <UXIcon :name="data.icon" :loaders="loaders"><template #fallback>…</template></UXIcon>
 */
export const UXIcon = defineComponent({
    name: 'UXIcon',
    inheritAttrs: false,
    props: {
        icon: {
            type: Object as PropType<UXIconData>,
            default: undefined,
        },
        name: {
            type: String as PropType<string | null>,
            default: undefined,
        },
        loaders: {
            type: Object as PropType<UXIconLoaders>,
            default: undefined,
        },
    },
    setup(props, { attrs, slots }) {
        const loaded = shallowRef<UXIconData | null>(null)

        watch(
            () => [props.loaders, props.name] as const,
            ([loaders, name], _, onCleanup) => {
                if (loaders === undefined) {
                    loaded.value = null

                    return
                }

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

        return () => {
            const icon = props.icon ?? (loaded.value !== null && loaded.value.name === props.name ? loaded.value : null)
            if (icon === null) {
                return slots.fallback?.() ?? null
            }

            const [attributes, passthrough] = splitAttributes(attrs)

            return h(
                'svg',
                { ...resolveIcon(icon, attributes), ...passthrough },
                mapNodes<VNode>(icon.children, (tag, attributes, children) => h(tag, attributes, children))
            )
        }
    },
})
