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

namespace Silarhi\UxIconsJsBundle\Tests\EventListener;

use Closure;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\EventListener\IconsCommandListener;
use Silarhi\UxIconsJsBundle\IconResolver;
use Silarhi\UxIconsJsBundle\IconsDumper;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Event\ConsoleCommandEvent;
use Symfony\Component\Console\Event\ConsoleTerminateEvent;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\UX\Icons\IconFactory;
use Symfony\UX\Icons\Registry\LocalSvgIconRegistry;

final class IconsCommandListenerTest extends TestCase
{
    private const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>';

    private string $directory;

    private IconsCommandListener $listener;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/ux_icons_js_listener_' . bin2hex(random_bytes(4));
        (new Filesystem())->dumpFile($this->directory . '/icons/user.svg', self::SVG);

        $registry = new LocalSvgIconRegistry(new IconFactory(), $this->directory . '/icons');
        $this->listener = new IconsCommandListener(new IconsDumper(new IconResolver($registry), $this->directory . '/icons', [], [], $this->directory . '/dump'));
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->directory);
    }

    #[DataProvider('provideCommands')]
    public function testDumpsAndPrintsTheNewIcons(string $command, int $exitCode): void
    {
        $output = $this->runCommand($command, $exitCode, function (): void {
            // what "ux:icons:import lucide:trash-2" does
            (new Filesystem())->dumpFile($this->directory . '/icons/lucide/trash-2.svg', self::SVG);
        });

        self::assertStringContainsString('JavaScript: import { LucideTrash2Icon }', $output);
        self::assertStringContainsString('Dumped 2 icon(s) for JavaScript.', $output);
        self::assertStringContainsString('export const LucideTrash2Icon = ', (string) file_get_contents($this->directory . '/dump/index.js'));
    }

    /**
     * @return iterable<array{string, int}>
     */
    public static function provideCommands(): iterable
    {
        yield ['ux:icons:import', Command::SUCCESS];
        yield ['ux:icons:lock', Command::SUCCESS];
        yield 'import fails when one of the icons is not found, the other ones are imported' => ['ux:icons:import', Command::FAILURE];
    }

    public function testDumpsWithoutNewIcons(): void
    {
        $output = $this->runCommand('ux:icons:lock');

        self::assertStringNotContainsString('JavaScript: import', $output);
        self::assertStringContainsString('Dumped 1 icon(s) for JavaScript.', $output);
    }

    public function testIgnoresOtherCommands(): void
    {
        self::assertSame('', $this->runCommand('ux:icons:warm-cache'));
        self::assertDirectoryDoesNotExist($this->directory . '/dump');
    }

    private function runCommand(string $name, int $exitCode = Command::SUCCESS, ?Closure $execute = null): string
    {
        $command = new Command($name);
        $input = new ArrayInput([]);
        $output = new BufferedOutput();

        $this->listener->onCommand(new ConsoleCommandEvent($command, $input, $output));
        $execute?->__invoke();
        $this->listener->onTerminate(new ConsoleTerminateEvent($command, $input, $output, $exitCode));

        return $output->fetch();
    }
}
