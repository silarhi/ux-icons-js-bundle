import { defineSilarhiDocs } from '@silarhi/docs-kit'

export default defineSilarhiDocs({
    slug: 'ux-icons-js-bundle',
    title: 'UX Icons JS Bundle',
    description:
        'Render Symfony UX Icons in JavaScript, React and Vue, with the same attributes, configuration and HTML as ux_icon().',
    sidebar: [
        { label: 'Getting started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'JavaScript', items: [{ autogenerate: { directory: 'javascript' } }] },
        { label: 'PHP', items: [{ autogenerate: { directory: 'php' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
    ],
})
