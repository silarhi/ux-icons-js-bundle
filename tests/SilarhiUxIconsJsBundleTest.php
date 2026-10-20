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

namespace Silarhi\UxIconsJsBundle\Tests;

use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\SilarhiUxIconsJsBundle;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;

final class SilarhiUxIconsJsBundleTest extends TestCase
{
    public function testPrependsTheDefaultDumpDirectory(): void
    {
        $config = $this->prepend([]);

        self::assertSame([['asset_mapper' => ['paths' => ['%kernel.project_dir%/var/icons' => 'var/icons']]]], $config);
    }

    public function testPrependsTheConfiguredDumpDirectory(): void
    {
        $config = $this->prepend(['dump_directory' => '/app/var/js-icons']);

        self::assertSame([['asset_mapper' => ['paths' => ['/app/var/js-icons' => 'var/icons']]]], $config);
    }

    public function testDoesNotPrependWithoutAssetMapper(): void
    {
        self::assertSame([], $this->prepend([], ['FrameworkBundle' => ['path' => __DIR__]]));
    }

    /**
     * @param array<string, mixed>               $config
     * @param array<string, array{path: string}> $bundles
     *
     * @return array<array<string, mixed>>
     */
    private function prepend(array $config, array $bundles = ['FrameworkBundle' => ['path' => __DIR__], 'AssetMapperBundle' => ['path' => __DIR__]]): array
    {
        $container = new ContainerBuilder();
        $container->setParameter('kernel.bundles_metadata', $bundles);
        $container->setParameter('kernel.environment', 'test');
        $container->setParameter('kernel.build_dir', sys_get_temp_dir());

        $extension = (new SilarhiUxIconsJsBundle())->getContainerExtension();
        self::assertInstanceOf(PrependExtensionInterface::class, $extension);

        $container->registerExtension($extension);
        $container->prependExtensionConfig($extension->getAlias(), $config);
        $extension->prepend($container);

        return $container->getExtensionConfig('framework');
    }
}
