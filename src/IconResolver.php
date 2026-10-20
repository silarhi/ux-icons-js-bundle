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

namespace Silarhi\UxIconsJsBundle;

use Symfony\UX\Icons\Exception\IconNotFoundException;
use Symfony\UX\Icons\Icon;
use Symfony\UX\Icons\IconRegistryInterface;

/**
 * Resolves an icon with its configured attributes (default, icon set, and suffix), like the "ux_icon()" Twig function.
 *
 * Port of the attribute resolution of the (final, internal) "Symfony\UX\Icons\IconRenderer": invocation attributes and the automatic "aria-hidden" are not applied, the JavaScript side does it.
 *
 * @internal
 */
final readonly class IconResolver
{
    /**
     * @param IconRegistryInterface                               $registry              a registry of local icons only (no on-demand download)
     * @param array<string, scalar>                               $defaultIconAttributes
     * @param array<array-key, string>                            $iconAliases
     * @param array<string, array<string, scalar>>                $iconSetsAttributes
     * @param array<string, array<string, array<string, scalar>>> $iconSuffixAttributes  suffixes sorted by length, longest first
     */
    public function __construct(
        private IconRegistryInterface $registry,
        private array $defaultIconAttributes = [],
        private array $iconAliases = [],
        private array $iconSetsAttributes = [],
        private array $iconSuffixAttributes = [],
    ) {
    }

    /**
     * @throws IconNotFoundException
     */
    public function resolve(string $name): Icon
    {
        $iconName = $this->iconAliases[$name] ?? $name;

        $icon = $this->registry->get($iconName);

        $setAttributes = $suffixAttributes = [];
        if (0 < $pos = (int) strpos($name, ':')) {
            [$setAttributes, $suffixAttributes] = $this->resolveAttributes($name, $pos);
        } elseif ($iconName !== $name && 0 < $pos = (int) strpos($iconName, ':')) {
            [$setAttributes, $suffixAttributes] = $this->resolveAttributes($iconName, $pos);
        }

        return $icon->withAttributes([
            ...$this->defaultIconAttributes,
            ...$setAttributes,
            ...$suffixAttributes,
        ]);
    }

    /**
     * @return array{0: array<string, scalar>, 1: array<string, scalar>}
     */
    private function resolveAttributes(string $name, int $pos): array
    {
        $prefix = substr($name, 0, $pos);

        return [
            $this->iconSetsAttributes[$prefix] ?? [],
            $this->findSuffixAttributes($prefix, substr($name, $pos + 1)),
        ];
    }

    /**
     * @return array<string, scalar>
     */
    private function findSuffixAttributes(string $prefix, string $iconNamePart): array
    {
        foreach ($this->iconSuffixAttributes[$prefix] ?? [] as $suffix => $config) {
            if ('' === $suffix || str_ends_with($iconNamePart, '-' . $suffix)) {
                return $config;
            }
        }

        return [];
    }
}
