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

namespace Silarhi\UxIconsJsBundle\Tests\Fixtures;

use function dirname;

use Silarhi\UxIconsJsBundle\SilarhiUxIconsJsBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\UX\Icons\UXIconsBundle;

final class TestKernel extends Kernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new TwigBundle();
        yield new UXIconsBundle();
        yield new SilarhiUxIconsJsBundle();
    }

    public function getProjectDir(): string
    {
        return dirname(__DIR__, 2);
    }

    public function getCacheDir(): string
    {
        return $this->getProjectDir() . '/var/cache/' . $this->environment;
    }

    public function getLogDir(): string
    {
        return $this->getProjectDir() . '/var/log';
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret' => 'S3CRET',
            'test' => true,
            'http_method_override' => false,
            'php_errors' => ['log' => true],
            'handle_all_throwables' => true,
            'http_client' => true,
        ]);

        $container->extension('ux_icons', [
            'icon_dir' => '%kernel.project_dir%/tests/Fixtures/icons',
            'default_icon_attributes' => ['fill' => 'currentColor', 'data-default' => 'yes'],
            'aliases' => [
                'me' => 'user',
                'remote' => 'lucide:circle',
            ],
            'icon_sets' => [
                'img' => [
                    'path' => '%kernel.project_dir%/tests/Fixtures/images',
                    'icon_attributes' => ['class' => 'icon icon-img'],
                ],
            ],
        ]);

        $container->extension('silarhi_ux_icons_js', [
            'dump_directory' => '%kernel.cache_dir%/ux_icons_js',
            'scan_directories' => ['%kernel.project_dir%/tests/Fixtures/assets'],
        ]);

        $container->services()
            ->alias('test.ux_icons.icon_finder', '.ux_icons.icon_finder')->public()
        ;
    }
}
