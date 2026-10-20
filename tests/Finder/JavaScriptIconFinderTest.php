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

namespace Silarhi\UxIconsJsBundle\Tests\Finder;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\Finder\JavaScriptIconFinder;
use Silarhi\UxIconsJsBundle\IconsDumper;

use function sprintf;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\UX\Icons\IconFinderInterface;

final class JavaScriptIconFinderTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/ux_icons_js_finder_' . bin2hex(random_bytes(4));

        if (!interface_exists(IconFinderInterface::class)) {
            self::markTestSkipped('symfony/ux-icons 2.x has no IconFinderInterface.');
        }
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->directory);
    }

    public function testFindIconsImportedFromIconModules(): void
    {
        $fs = new Filesystem();
        $fs->dumpFile($this->directory . '/app.js', <<<'JS'
            import { LucideMailIcon, HeroiconsXMarkIcon as Close } from '../var/icons/index.js';
            import { Controller } from '@hotwired/stimulus';
            import { ArrowIcon } from './components/arrow.js';
            JS);
        $fs->dumpFile($this->directory . '/components/Toolbar.tsx', <<<'TSX'
            import type { UXIconData } from '@silarhi/ux-icons-js';
            import {
                SimpleIconsGithubIcon,
                type TablerTrash2Icon,
            } from '@/icons';
            TSX);
        $fs->dumpFile($this->directory . '/node_modules/pkg/index.js', "import { IgnoredDependencyIcon } from '../var/icons/index.js';");

        $icons = (new JavaScriptIconFinder([$this->directory, $this->directory . '/missing']))->icons();

        self::assertContains('lucide:mail', $icons);
        self::assertContains('heroicons:x-mark', $icons);
        self::assertContains('simple-icons:github', $icons);
        self::assertNotContains('tabler:trash-2', $icons, 'Type-only specifiers are not icons.');
        self::assertNotContains('ignored:dependency', $icons, 'node_modules are not scanned.');
        self::assertNotContains('close', $icons, 'Local aliases are ignored.');
        self::assertSame([], array_filter($icons, static fn (string $name): bool => str_starts_with($name, 'controller')), 'Only icon modules are scanned.');
    }

    public function testFindNothingWithoutDirectories(): void
    {
        self::assertSame([], (new JavaScriptIconFinder([$this->directory]))->icons());
    }

    /**
     * @param list<string> $expected
     */
    #[DataProvider('provideIconNames')]
    public function testIconNames(string $exportName, array $expected): void
    {
        $names = JavaScriptIconFinder::iconNames($exportName);

        self::assertSame($expected, $names);
        foreach ($names as $name) {
            self::assertSame($exportName, IconsDumper::exportName($name), sprintf('"%s" is dumped as "%s".', $name, $exportName));
        }
    }

    /**
     * @return iterable<array{string, list<string>}>
     */
    public static function provideIconNames(): iterable
    {
        yield ['LucideMailIcon', ['lucide:mail']];
        yield ['HeroiconsXMarkIcon', ['heroicons:x-mark', 'heroicons-x:mark']];
        yield ['SimpleIconsGithubIcon', ['simple:icons-github', 'simple-icons:github']];
        yield ['LucideTrash2Icon', ['lucide:trash-2', 'lucide:trash2', 'lucide-trash:2']];
        yield ['Mdi2xlIcon', ['mdi:2xl']];
        yield ['Ri24HoursFillIcon', ['ri:24-hours-fill', 'ri-24:hours-fill', 'ri24:hours-fill', 'ri-24-hours:fill', 'ri24-hours:fill']];
        yield ['_500Icon', []];
        yield ['UserIcon', []];
        yield ['Icon', []];
        yield ['UXIconData', []];
        yield ['useIcon', []];
    }
}
