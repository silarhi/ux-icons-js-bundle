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

namespace Silarhi\UxIconsJsBundle\Tests\DependencyInjection;

use function dirname;

use LogicException;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\DependencyInjection\UxIconsConfigurationPass;
use Symfony\Component\Config\Resource\DirectoryResource;
use Symfony\Component\Config\Resource\FileExistenceResource;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;

final class UxIconsConfigurationPassTest extends TestCase
{
    public function testRequiresUxIconsBundle(): void
    {
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('SilarhiUxIconsJsBundle requires Symfony\UX\Icons\UXIconsBundle');

        (new UxIconsConfigurationPass())->process(new ContainerBuilder());
    }

    public function testTracksTheIconDirectories(): void
    {
        $container = new ContainerBuilder();
        $container->setParameter('fixtures_dir', dirname(__DIR__) . '/Fixtures');
        $container->setDefinition(UxIconsConfigurationPass::RENDERER, new Definition(null, [null, [], [], [], []]));
        $container->setDefinition(UxIconsConfigurationPass::LOCAL_REGISTRY, new Definition(null, [null, '%fixtures_dir%/icons', [
            'img' => '%fixtures_dir%/images',
            'missing' => '%fixtures_dir%/missing',
        ]]));
        $container->setDefinition('silarhi_ux_icons_js.icon_resolver', new Definition(null, [null, null, null, null, null]));
        $container->setDefinition('silarhi_ux_icons_js.dumper', new Definition(null, [null, null, null, null]));

        (new UxIconsConfigurationPass())->process($container);

        $resources = array_map(strval(...), $container->getResources());
        $fixturesDir = dirname(__DIR__) . '/Fixtures';

        self::assertContains((string) new DirectoryResource($fixturesDir . '/icons', '/\.svg$/'), $resources);
        self::assertContains((string) new DirectoryResource($fixturesDir . '/images', '/\.svg$/'), $resources);
        self::assertContains((string) new FileExistenceResource($fixturesDir . '/missing'), $resources);
    }
}
