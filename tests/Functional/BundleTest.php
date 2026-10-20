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

namespace Silarhi\UxIconsJsBundle\Tests\Functional;

use Silarhi\UxIconsJsBundle\Tests\Fixtures\TestKernel;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\UX\Icons\IconFinderInterface;

final class BundleTest extends KernelTestCase
{
    protected static function getKernelClass(): string
    {
        return TestKernel::class;
    }

    public function testCacheWarmupDumpsIcons(): void
    {
        $kernel = self::bootKernel();

        // the cache warmer is not optional: the dump exists as soon as the container is built
        self::assertFileExists($kernel->getCacheDir() . '/ux_icons_js/index.js');
    }

    public function testDumpCommandUsesTheUxIconsConfiguration(): void
    {
        $kernel = self::bootKernel();
        $tester = new CommandTester((new Application($kernel))->find('ux-icons-js:dump'));

        $tester->execute([], ['verbosity' => \Symfony\Component\Console\Output\OutputInterface::VERBOSITY_VERBOSE]);

        $tester->assertCommandIsSuccessful();
        self::assertStringContainsString('sub:check', $tester->getDisplay());
        self::assertStringContainsString('Dumped 8 icon(s).', $tester->getDisplay());

        $js = (string) file_get_contents($kernel->getCacheDir() . '/ux_icons_js/index.js');
        // default_icon_attributes
        self::assertMatchesRegularExpression('/' . preg_quote('export const UserIcon = {"name":"user","attributes":{', '/') . '("xmlns":"[^"]+",)?' . preg_quote('"viewBox":"0 0 24 24","fill":"currentColor","class":"w-6 h-6","data-default":"yes"}', '/') . '/', $js);
        // icon set path and icon_attributes
        self::assertMatchesRegularExpression('/' . preg_quote('export const ImgIconIcon = {"name":"img:icon","attributes":{', '/') . '("xmlns":"[^"]+",)?' . preg_quote('"viewBox":"-1 -1 2 2","fill":"currentColor","data-default":"yes","class":"icon icon-img"}', '/') . '/', $js);
        // aliases, the remote one is not imported locally
        self::assertStringContainsString('export const MeIcon = {"name":"me",', $js);
        self::assertStringNotContainsString('RemoteIcon', $js);
    }

    public function testLockCommandFindsTheIconsImportedInJavaScript(): void
    {
        if (!interface_exists(IconFinderInterface::class)) {
            self::markTestSkipped('symfony/ux-icons 2.x has no finder extension point.');
        }

        self::bootKernel();

        $finder = self::getContainer()->get('test.ux_icons.icon_finder');
        self::assertInstanceOf(IconFinderInterface::class, $finder);

        self::assertContains('lucide:mail', [...$finder->icons()]);
    }
}
