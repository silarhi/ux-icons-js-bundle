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

namespace Silarhi\UxIconsJsBundle\Command;

use function count;

use Silarhi\UxIconsJsBundle\IconsDumper;

use function sprintf;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * @internal
 */
#[AsCommand(
    name: 'ux-icons-js:dump',
    description: 'Dump local icons as a JavaScript module',
)]
final class DumpIconsCommand extends Command
{
    public function __construct(private readonly IconsDumper $dumper)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $names = $this->dumper->dump();

        if ($io->isVerbose()) {
            $io->listing($names);
        }

        $io->success(sprintf('Dumped %d icon(s).', count($names)));

        return Command::SUCCESS;
    }
}
