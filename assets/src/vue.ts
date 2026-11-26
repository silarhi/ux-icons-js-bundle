import {
    type ComponentOptionsMixin,
    type DefineComponent,
    defineComponent,
    type ExtractPropTypes,
    h,
    type PropType,
    type PublicProps,
    type Ref,
    shallowRef,
    unref,
    type VNode,
    watch,
} from 'vue'
import {
    getLoadedIcon,
    loadIcon,
    mapNodes,
    resolveIcon,
    splitAttributes,
    type UXIconData,
    type UXIconLoaders,
    type UXIconName,
} from './index'

// biome-ignore lint/complexity/noBannedTypes: "{}" is the default of the DefineComponent type parameters
type Empty = {}

// isolatedDeclarations needs the exported components' types spelled out: they are written from these props objects,
// and each component is defined apart from its export so that the annotation does not change how defineComponent
// infers its props
type UXComponent<Props, Render, Defaults = Empty> = DefineComponent<
    ExtractPropTypes<Props>,
    Render,
    Empty,
    Empty,
    Empty,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    Empty,
    string,
    PublicProps,
    Readonly<ExtractPropTypes<Props>>,
    Defaults
>

const uxIconProps = {
    icon: {
        type: Object as PropType<UXIconData>,
        required: true as const,
    },
}

const uxLazyIconProps = {
    name: {
        type: String as PropType<string | null>,
        default: undefined,
    },
    loaders: {
        type: Object as PropType<UXIconLoaders>,
        required: true as const,
    },
}

const uxIcon = defineComponent({
    name: 'UXIcon',
    inheritAttrs: false,
    props: uxIconProps,
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
 * Renders a dumped icon, with the same attributes as the "ux_icon()" Twig function.
 *
 *     <script setup>
 *     import { UXIcon } from '@silarhi/ux-icons-js/vue';
 *     import { LucideTrash2Icon } from '../var/icons/index.js';
 *     </script>
 *
 *     <UXIcon :icon="LucideTrash2Icon" class="text-danger" aria-label="Delete" />
 */
export const UXIcon: UXComponent<typeof uxIconProps, () => VNode> = uxIcon

type UXIconSource<T> = T | Readonly<Ref<T>> | (() => T)

/**
 * Loads an icon by a name known only at runtime: null while it loads, for an unknown name, or if it fails to load.
 *
 * The name (and the loaders) can be a value, a ref or a getter: the icon follows it.
 *
 *     <script setup>
 *     import { useIcon, UXIcon } from '@silarhi/ux-icons-js/vue';
 *     import { loaders } from '../var/icons/loaders.js';
 *
 *     const props = defineProps(['icon']);
 *     const icon = useIcon(loaders, () => props.icon);
 *     </script>
 *
 *     <UXIcon v-if="icon" :icon="icon" />
 */
export function useIcon<Name extends string>(
    loaders: UXIconSource<UXIconLoaders<Name>>,
    name: UXIconSource<UXIconName<Name> | null | undefined>
): Readonly<Ref<UXIconData<Name> | null>> {
    const icon = shallowRef<UXIconData<Name> | null>(null)
    // "toValue()" needs Vue 3.3
    const read = <T>(source: UXIconSource<T>): T =>
        typeof source === 'function' ? (source as () => T)() : unref(source as T | Ref<T>)

    watch(
        () => [read(loaders), read(name)] as const,
        ([loaders, name], _, onCleanup) => {
            let active = true
            onCleanup(() => {
                active = false
            })

            // an icon loaded earlier renders at once, without a fallback flash
            icon.value = getLoadedIcon(loaders, name)
            loadIcon(loaders, name).then(
                (loaded) => {
                    if (active) {
                        icon.value = loaded
                    }
                },
                () => {
                    if (active) {
                        icon.value = null
                    }
                }
            )
        },
        { immediate: true }
    )

    return icon
}

const uxLazyIcon = defineComponent({
    name: 'UXLazyIcon',
    inheritAttrs: false,
    props: uxLazyIconProps,
    setup(props, { attrs, slots }) {
        // biome-ignore lint/correctness/useHookAtTopLevel: a Vue composable, called in setup()
        const icon = useIcon(
            () => props.loaders,
            () => props.name
        )

        return () => (icon.value !== null ? h(uxIcon, { ...attrs, icon: icon.value }) : (slots.fallback?.() ?? null))
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
export const UXLazyIcon: UXComponent<typeof uxLazyIconProps, () => VNode | VNode[] | null, { name: string | null }> =
    uxLazyIcon
