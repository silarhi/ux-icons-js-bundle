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

use LogicException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\IconResolver;
use Silarhi\UxIconsJsBundle\IconsDumper;
use stdClass;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\UX\Icons\IconFactory;
use Symfony\UX\Icons\Registry\LocalSvgIconRegistry;

final class IconsDumperTest extends TestCase
{
    private const FIXTURES = __DIR__ . '/Fixtures';

    private string $dumpDir;

    protected function setUp(): void
    {
        $this->dumpDir = sys_get_temp_dir() . '/ux_icons_dumper_' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->dumpDir);
    }

    public function testDumpLocalIconsWithResolvedAttributes(): void
    {
        $dumper = $this->createDumper(
            defaultAttributes: ['fill' => 'currentColor', 'class' => 'icon'],
            setAttributes: ['img' => ['class' => 'icon icon-img']],
            iconSetPaths: ['img' => self::FIXTURES . '/images'],
            aliases: ['me' => 'user', 'remote' => 'lucide:circle'],
        );

        $names = $dumper->dump();

        self::assertSame(['a:icon', 'img:a:b:icon', 'img:a:icon', 'img:ab:icon', 'img:icon', 'me', 'sub:check', 'user'], $names);
        self::assertNotContains('sub_dir:check', $names, 'Invalid icon names are skipped.');
        self::assertNotContains('remote', $names, 'Aliases targeting a missing icon are skipped.');
        self::assertSame($names, $dumper->iconNames());

        $js = (string) file_get_contents($this->dumpDir . '/index.js');
        self::assertMatchesRegularExpression('/' . preg_quote('export const UserIcon = {"name":"user","attributes":{', '/') . '("xmlns":"[^"]+",)?' . preg_quote('"viewBox":"0 0 24 24","fill":"currentColor","class":"icon"},"children":[["path",{"fill-rule":"evenodd","d":"M7.5', '/') . '/', $js);
        self::assertStringContainsString('export const ImgIconIcon = {"name":"img:icon","attributes":{', $js);
        self::assertStringContainsString('"class":"icon icon-img"', $js);
        self::assertStringNotContainsString('aria-hidden', $js, 'aria-hidden depends on invocation attributes, it is resolved in JavaScript.');

        $dts = (string) file_get_contents($this->dumpDir . '/index.d.ts');
        self::assertStringContainsString("import type { UXIconData } from '@silarhi/ux-icons-js';", $dts);
        self::assertStringContainsString('export declare const SubCheckIcon: UXIconData<"sub:check">;', $dts);
    }

    public function testDumpIconModulesLoadedByName(): void
    {
        $this->createDumper(aliases: ['me' => 'user'])->dump();

        $loaders = (string) file_get_contents($this->dumpDir . '/loaders.js');
        self::assertStringContainsString("export const loaders = {\n", $loaders);
        self::assertStringContainsString('    "user": () => import(\'./icons/user.js\'),', $loaders);
        self::assertStringContainsString('    "sub:check": () => import(\'./icons/sub--check.js\'),', $loaders);
        self::assertStringContainsString('    "me": () => import(\'./icons/me.js\'),', $loaders, 'Aliases are loaded by name too.');

        $user = (string) file_get_contents($this->dumpDir . '/icons/user.js');
        self::assertStringContainsString('export default {"name":"user","attributes":{', $user);
        self::assertStringContainsString('export default {"name":"me",', (string) file_get_contents($this->dumpDir . '/icons/me.js'));

        $dts = (string) file_get_contents($this->dumpDir . '/loaders.d.ts');
        self::assertStringContainsString("import type { UXIconLoaders } from '@silarhi/ux-icons-js';", $dts);
        self::assertStringContainsString('export type IconName = "a:icon" | "me" | "sub:check" | "user";', $dts);
        self::assertStringContainsString('export declare const loaders: UXIconLoaders<IconName>;', $dts);
    }

    public function testIconModulesDoNotCollideOnCaseInsensitiveFilesystems(): void
    {
        // "img:a:b:icon" and "img:ab:icon" are exported as "ImgABIconIcon" and "ImgAbIconIcon"
        $this->createDumper(iconSetPaths: ['img' => self::FIXTURES . '/images'])->dump();

        self::assertStringContainsString('export default {"name":"img:a:b:icon",', (string) file_get_contents($this->dumpDir . '/icons/img--a--b--icon.js'));
        self::assertStringContainsString('export default {"name":"img:ab:icon",', (string) file_get_contents($this->dumpDir . '/icons/img--ab--icon.js'));
    }

    public function testDumpRemovesTheModulesOfRemovedIcons(): void
    {
        (new Filesystem())->dumpFile($this->dumpDir . '/icons/removed.js', 'stale');
        (new Filesystem())->dumpFile($this->dumpDir . '/icons/README.md', 'not an icon module');

        $this->createDumper()->dump();

        self::assertFileDoesNotExist($this->dumpDir . '/icons/removed.js');
        self::assertFileExists($this->dumpDir . '/icons/user.js');
        self::assertFileExists($this->dumpDir . '/icons/README.md');
    }

    public function testDumpKeepsUnchangedFiles(): void
    {
        $dumper = $this->createDumper();
        $dumper->dump();
        touch($this->dumpDir . '/icons/user.js', 1_000_000_000);
        clearstatcache();

        $dumper->dump();
        clearstatcache();

        self::assertSame(1_000_000_000, filemtime($this->dumpDir . '/icons/user.js'), 'An unchanged icon module is not rewritten.');
    }

    public function testDumpWithoutIcons(): void
    {
        $dumper = new IconsDumper(new IconResolver(new LocalSvgIconRegistry(new IconFactory(), self::FIXTURES . '/missing')), self::FIXTURES . '/missing', [], [], $this->dumpDir);

        self::assertSame([], $dumper->dump());
        self::assertStringContainsString("export const loaders = {\n};", (string) file_get_contents($this->dumpDir . '/loaders.js'));
        self::assertStringContainsString('export type IconName = never;', (string) file_get_contents($this->dumpDir . '/loaders.d.ts'));
    }

    public function testIconNamesDoesNotDump(): void
    {
        self::assertContains('user', $this->createDumper()->iconNames());
        self::assertDirectoryDoesNotExist($this->dumpDir);
    }

    public function testDumpWithoutTypeScript(): void
    {
        (new Filesystem())->dumpFile($this->dumpDir . '/index.d.ts', 'stale');
        (new Filesystem())->dumpFile($this->dumpDir . '/loaders.d.ts', 'stale');

        $this->createDumper(dumpTypeScript: false)->dump();

        self::assertFileExists($this->dumpDir . '/index.js');
        self::assertFileExists($this->dumpDir . '/loaders.js');
        self::assertFileDoesNotExist($this->dumpDir . '/index.d.ts');
        self::assertFileDoesNotExist($this->dumpDir . '/loaders.d.ts');
    }

    public function testDumpThrowsOnExportNameCollision(): void
    {
        $dumper = $this->createDumper(aliases: ['sub-check' => 'user']);

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('Icons "sub:check" and "sub-check" would both be exported as "SubCheckIcon"');

        $dumper->dump();
    }

    public function testMissingIconSetDirectory(): void
    {
        $names = $this->createDumper(iconSetPaths: ['missing' => self::FIXTURES . '/missing'])->dump();

        self::assertContains('user', $names);
        self::assertSame([], array_filter($names, static fn (string $name): bool => str_starts_with($name, 'missing:')));
    }

    public function testNumericAliases(): void
    {
        self::assertContains('500', $this->createDumper(aliases: ['500' => 'user'])->dump());
        self::assertStringContainsString('export const _500Icon = ', (string) file_get_contents($this->dumpDir . '/index.js'));
    }

    /**
     * @param list<mixed> $expected
     */
    #[DataProvider('provideChildren')]
    public function testChildren(string $innerSvg, array $expected): void
    {
        self::assertSame(json_encode($expected), json_encode(IconsDumper::children($innerSvg)));
    }

    /**
     * @return iterable<string, array{string, list<mixed>}>
     */
    public static function provideChildren(): iterable
    {
        yield 'nested elements' => [
            '<g fill="none"><path d="M0 0"></path></g>',
            [['g', ['fill' => 'none'], [['path', ['d' => 'M0 0']]]]],
        ];
        yield 'elements without attributes are objects' => [
            '<path></path>',
            [['path', new stdClass()]],
        ];
        yield 'SVG case and namespaced attributes' => [
            '<defs><linearGradient id="a"></linearGradient></defs><use xlink:href="#a"></use>',
            [['defs', new stdClass(), [['linearGradient', ['id' => 'a']]]], ['use', ['xlink:href' => '#a']]],
        ];
        yield 'texts are decoded, style is raw' => [
            '<style>a > b {}</style><text>a &amp; b &lt;c&gt;<tspan>d</tspan></text>',
            [['style', new stdClass(), ['a > b {}']], ['text', new stdClass(), ['a & b <c>', ['tspan', new stdClass(), ['d']]]]],
        ];
    }

    /**
     * @param list<mixed> $expected
     */
    #[DataProvider('provideChildren')]
    public function testLegacyChildren(string $innerSvg, array $expected): void
    {
        self::assertSame(json_encode($expected), json_encode(IconsDumper::legacyChildren($innerSvg)));
    }

    public function testLegacyChildrenAdjustSvgNames(): void
    {
        $innerSvg = '<defs><clipPath id="c" clipPathUnits="userSpaceOnUse"><rect></rect></clipPath><radialGradient gradientTransform="x"></radialGradient></defs><foreignObject></foreignObject><text>é&nbsp;</text>';

        self::assertSame(json_encode(IconsDumper::children($innerSvg)), json_encode(IconsDumper::legacyChildren($innerSvg)));
        self::assertStringContainsString('["clipPath",{"id":"c","clipPathUnits":"userSpaceOnUse"}', (string) json_encode(IconsDumper::legacyChildren($innerSvg)));
    }

    #[DataProvider('provideExportNames')]
    public function testExportName(string $name, string $expected): void
    {
        self::assertSame($expected, IconsDumper::exportName($name));
    }

    /**
     * @return iterable<array{string, string}>
     */
    public static function provideExportNames(): iterable
    {
        yield ['user', 'UserIcon'];
        yield ['lucide:trash-2', 'LucideTrash2Icon'];
        yield ['flags:fr', 'FlagsFrIcon'];
        yield ['500', '_500Icon'];
        yield ['delete', 'DeleteIcon'];
    }

    /**
     * @param array<string, string>                $defaultAttributes
     * @param array<string, array<string, string>> $setAttributes
     * @param array<string, string>                $iconSetPaths
     * @param array<array-key, string>             $aliases
     */
    private function createDumper(array $defaultAttributes = [], array $setAttributes = [], array $iconSetPaths = [], array $aliases = [], bool $dumpTypeScript = true): IconsDumper
    {
        $registry = new LocalSvgIconRegistry(new IconFactory(), self::FIXTURES . '/icons', $iconSetPaths);
        $resolver = new IconResolver($registry, $defaultAttributes, $aliases, $setAttributes);

        return new IconsDumper($resolver, self::FIXTURES . '/icons', $iconSetPaths, $aliases, $this->dumpDir, $dumpTypeScript);
    }
}
