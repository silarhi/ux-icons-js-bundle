<?php

declare(strict_types=1);

/*
 * This file is part of the UX Icons JS Bundle package.
 *
 * (c) SILARHI <dev@silarhi.fr>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Silarhi\UxIconsJsBundle\DependencyInjection;

use LogicException;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Reuses the "ux_icons" configuration, so the dumped icons get the same attributes as "ux_icon()".
 *
 * The values are copied from the internal UXIconsBundle services, once its extension has resolved them: the icon renderer (default, icon set and suffix attributes, aliases) and the local registry (icon directory, icon set paths).
 *
 * @internal
 */
final class UxIconsConfigurationPass implements CompilerPassInterface
{
    public const RENDERER = '.ux_icons.icon_renderer';

    public const LOCAL_REGISTRY = '.ux_icons.local_svg_icon_registry';

    public function process(ContainerBuilder $container): void
    {
        if (!$container->hasDefinition(self::RENDERER) || !$container->hasDefinition(self::LOCAL_REGISTRY)) {
            throw new LogicException('SilarhiUxIconsJsBundle requires Symfony\UX\Icons\UXIconsBundle: enable it in config/bundles.php.');
        }

        $renderer = $container->getDefinition(self::RENDERER);
        $registry = $container->getDefinition(self::LOCAL_REGISTRY);

        $container->getDefinition('silarhi_ux_icons_js.icon_resolver')
            ->setArgument(1, $renderer->getArgument(1))
            ->setArgument(2, $renderer->getArgument(2))
            ->setArgument(3, $renderer->getArgument(3))
            ->setArgument(4, $renderer->getArgument(4))
        ;

        $container->getDefinition('silarhi_ux_icons_js.dumper')
            ->setArgument(1, $registry->getArgument(1))
            ->setArgument(2, $registry->getArgument(2))
            ->setArgument(3, $renderer->getArgument(2))
        ;
    }
}
