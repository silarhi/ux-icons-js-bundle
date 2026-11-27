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

namespace Silarhi\UxIconsJsBundle\Tests\Command;

use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\Command\DumpIconsCommand;
use Silarhi\UxIconsJsBundle\IconResolver;
use Silarhi\UxIconsJsBundle\IconsDumper;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\UX\Icons\IconFactory;
use Symfony\UX\Icons\Registry\LocalSvgIconRegistry;

/**
 * The dumper and the command wired by hand, as the "Without the bundle" section of the README does.
 */
final class StandaloneDumpTest extends TestCase
{
    private string $dumpDir;

    protected function setUp(): void
    {
        $this->dumpDir = sys_get_temp_dir() . '/ux_icons_standalone_' . bin2hex(random_bytes(4));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->dumpDir);
    }

    public function testDumpsTheIconsWithoutTheBundle(): void
    {
        $iconDir = __DIR__ . '/../Fixtures/icons';
        $iconSetPaths = ['img' => __DIR__ . '/../Fixtures/images'];
        $aliases = ['me' => 'user'];

        $resolver = new IconResolver(
            new LocalSvgIconRegistry(new IconFactory(), $iconDir, $iconSetPaths),
            ['fill' => 'currentColor'],
            $aliases,
            ['img' => ['class' => 'icon-img']],
        );
        $dumper = new IconsDumper($resolver, $iconDir, $iconSetPaths, $aliases, $this->dumpDir);

        $application = new Application();
        $application->addCommands([new DumpIconsCommand($dumper)]);

        $tester = new CommandTester($application->find('ux-icons-js:dump'));
        $tester->execute([]);

        $tester->assertCommandIsSuccessful();
        self::assertStringContainsString('Dumped 8 icon(s).', $tester->getDisplay());

        $js = (string) file_get_contents($this->dumpDir . '/index.js');
        self::assertStringContainsString('export const MeIcon = {"name":"me",', $js);
        self::assertMatchesRegularExpression('/' . preg_quote('export const ImgIconIcon = {"name":"img:icon","attributes":{', '/') . '("xmlns":"[^"]+",)?' . preg_quote('"viewBox":"-1 -1 2 2","fill":"currentColor","class":"icon-img"}', '/') . '/', $js);
        self::assertFileExists($this->dumpDir . '/loaders.js');
    }
}
