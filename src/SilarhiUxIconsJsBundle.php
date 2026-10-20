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

namespace Silarhi\UxIconsJsBundle;

use function assert;

use Override;
use Silarhi\UxIconsJsBundle\CacheWarmer\IconsDumperCacheWarmer;
use Silarhi\UxIconsJsBundle\Command\DumpIconsCommand;
use Silarhi\UxIconsJsBundle\DependencyInjection\UxIconsConfigurationPass;
use Silarhi\UxIconsJsBundle\EventListener\IconsCommandListener;
use Silarhi\UxIconsJsBundle\Finder\JavaScriptIconFinder;
use Symfony\Component\AssetMapper\AssetMapperInterface;
use Symfony\Component\Config\Definition\ConfigurationInterface;
use Symfony\Component\Config\Definition\Configurator\DefinitionConfigurator;
use Symfony\Component\Config\Definition\Processor;
use Symfony\Component\DependencyInjection\Argument\AbstractArgument;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\ConfigurationExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

use Symfony\Component\HttpKernel\Bundle\AbstractBundle;
use Symfony\UX\Icons\IconFinderInterface;

final class SilarhiUxIconsJsBundle extends AbstractBundle
{
    /** The AssetMapper path of the dumped icons: import { LucideTrash2Icon } from 'var/icons/index.js' */
    public const ASSET_MAPPER_NAMESPACE = 'var/icons';

    #[Override]
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $container->addCompilerPass(new UxIconsConfigurationPass());
    }

    #[Override]
    public function configure(DefinitionConfigurator $definition): void
    {
        $definition->rootNode()
            ->children()
                ->scalarNode('dump_directory')
                    ->info('The directory where the JavaScript module is dumped.')
                    ->defaultValue('%kernel.project_dir%/var/icons')
                    ->cannotBeEmpty()
                ->end()
                ->booleanNode('dump_typescript')
                    ->info('Whether TypeScript types are dumped alongside the icons. Disable this if you do not use TypeScript (e.g. in production when using AssetMapper).')
                    ->defaultTrue()
                ->end()
                ->arrayNode('scan_directories')
                    ->info('The directories scanned for icons imported in JavaScript files (see "ux:icons:lock").')
                    ->defaultValue(['%kernel.project_dir%/assets'])
                    ->scalarPrototype()->end()
                ->end()
            ->end();
    }

    #[Override]
    public function prependExtension(ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        if (!$this->isAssetMapperAvailable($builder)) {
            return;
        }

        // The configuration is not processed yet: process it to know the dump directory (an AbstractBundle always has one)
        $extension = $this->getContainerExtension();
        assert($extension instanceof ConfigurationExtensionInterface);
        $configuration = $extension->getConfiguration([], $builder);
        assert($configuration instanceof ConfigurationInterface);

        /** @var array{dump_directory: string} $config */
        $config = (new Processor())->processConfiguration($configuration, $builder->getExtensionConfig($extension->getAlias()));

        $builder->prependExtensionConfig('framework', [
            'asset_mapper' => [
                'paths' => [$config['dump_directory'] => self::ASSET_MAPPER_NAMESPACE],
            ],
        ]);
    }

    #[Override]
    public function loadExtension(array $config, ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        /** @var array{dump_directory: string, dump_typescript: bool, scan_directories: list<string>} $config */
        $services = $container->services();

        // Local icons only: dumping must never trigger an on-demand download
        $services->set('silarhi_ux_icons_js.icon_resolver', IconResolver::class)
            ->args([
                service(UxIconsConfigurationPass::LOCAL_REGISTRY),
                new AbstractArgument('default_icon_attributes'),
                new AbstractArgument('icon_aliases'),
                new AbstractArgument('icon_set_attributes'),
                new AbstractArgument('icon_suffix_attributes'),
            ]);

        $services->set('silarhi_ux_icons_js.dumper', IconsDumper::class)
            ->args([
                service('silarhi_ux_icons_js.icon_resolver'),
                new AbstractArgument('icon_dir'),
                new AbstractArgument('icon_set_paths'),
                new AbstractArgument('icon_aliases'),
                $config['dump_directory'],
                $config['dump_typescript'],
            ]);
        $services->alias(IconsDumper::class, 'silarhi_ux_icons_js.dumper');

        $services->set('silarhi_ux_icons_js.cache_warmer', IconsDumperCacheWarmer::class)
            ->args([service('silarhi_ux_icons_js.dumper')])
            ->tag('kernel.cache_warmer');

        // symfony/ux-icons 2.x has no finder extension point: "ux:icons:lock" only scans the Twig templates there
        if (interface_exists(IconFinderInterface::class)) {
            $services->set('silarhi_ux_icons_js.icon_finder', JavaScriptIconFinder::class)
                ->args([$config['scan_directories']])
                ->tag('ux_icons.finder');
        }

        $services->set('silarhi_ux_icons_js.command.dump', DumpIconsCommand::class)
            ->args([service('silarhi_ux_icons_js.dumper')])
            ->tag('console.command');

        $services->set('silarhi_ux_icons_js.command_listener', IconsCommandListener::class)
            ->args([service('silarhi_ux_icons_js.dumper')])
            ->tag('kernel.event_subscriber');
    }

    private function isAssetMapperAvailable(ContainerBuilder $builder): bool
    {
        /** @var array<string, array{path: string}> $bundlesMetadata */
        $bundlesMetadata = $builder->getParameter('kernel.bundles_metadata');

        // Before Symfony 8.2, FrameworkBundle provided the AssetMapper configuration.
        if (!interface_exists(AssetMapperInterface::class) || !isset($bundlesMetadata['FrameworkBundle'])) {
            return false;
        }

        return isset($bundlesMetadata['AssetMapperBundle'])
            || is_file($bundlesMetadata['FrameworkBundle']['path'] . '/Resources/config/asset_mapper.php');
    }
}
