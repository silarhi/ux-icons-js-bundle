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

namespace Silarhi\UxIconsJsBundle\EventListener;

use function count;
use function in_array;

use LogicException;
use Silarhi\UxIconsJsBundle\IconsDumper;

use function sprintf;

use Symfony\Component\Console\ConsoleEvents;
use Symfony\Component\Console\Event\ConsoleCommandEvent;
use Symfony\Component\Console\Event\ConsoleTerminateEvent;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Dumps the icons again after "ux:icons:import" and "ux:icons:lock", and prints the export name of each new icon.
 *
 * Both commands are final in symfony/ux-icons: the dump happens around them instead of inside them.
 *
 * @internal
 */
final class IconsCommandListener implements EventSubscriberInterface
{
    public const COMMANDS = ['ux:icons:import', 'ux:icons:lock'];

    /** @var list<string>|null the icon names before the command, null outside of an icons command */
    private ?array $before = null;

    public function __construct(
        private readonly IconsDumper $dumper,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            ConsoleEvents::COMMAND => 'onCommand',
            ConsoleEvents::TERMINATE => 'onTerminate',
        ];
    }

    public function onCommand(ConsoleCommandEvent $event): void
    {
        if (!in_array($event->getCommand()?->getName(), self::COMMANDS, true)) {
            return;
        }

        try {
            $this->before = $this->dumper->iconNames();
        } catch (LogicException) {
            // export name collision: never prevent an import, the dump reports it once the command is done
            $this->before = [];
        }
    }

    public function onTerminate(ConsoleTerminateEvent $event): void
    {
        if (null === $before = $this->before) {
            return;
        }

        $this->before = null;

        // "ux:icons:import" fails when one of the icons is not found, the other ones are imported anyway
        $names = $this->dumper->dump();

        $io = new SymfonyStyle($event->getInput(), $event->getOutput());

        $new = array_diff($names, $before);
        if ([] !== $new) {
            $io->writeln(sprintf(
                ' JavaScript: <comment>import { %s }</comment>',
                implode(', ', array_map(IconsDumper::exportName(...), $new)),
            ));
        }

        $io->comment(sprintf('Dumped %d icon(s) for JavaScript.', count($names)));
    }
}
