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

use LogicException;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\DependencyInjection\UxIconsConfigurationPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;

final class UxIconsConfigurationPassTest extends TestCase
{
    public function testRequiresUxIconsBundle(): void
    {
        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('SilarhiUxIconsJsBundle requires Symfony\UX\Icons\UXIconsBundle');

        (new UxIconsConfigurationPass())->process(new ContainerBuilder());
    }
}
