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

namespace Silarhi\UxIconsJsBundle\CacheWarmer;

use Silarhi\UxIconsJsBundle\IconsDumper;
use Symfony\Component\HttpKernel\CacheWarmer\CacheWarmerInterface;

/**
 * @internal
 */
final readonly class IconsDumperCacheWarmer implements CacheWarmerInterface
{
    public function __construct(
        private IconsDumper $dumper,
    ) {
    }

    /**
     * The dump directory is an AssetMapper path, which must exist as soon as the container is built.
     *
     * Dumping only reads local icons, it never downloads anything.
     */
    public function isOptional(): bool
    {
        return false;
    }

    public function warmUp(string $cacheDir, ?string $buildDir = null): array
    {
        $this->dumper->dump();

        return [];
    }
}
