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

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Silarhi\UxIconsJsBundle\IconResolver;
use Symfony\UX\Icons\Exception\IconNotFoundException;
use Symfony\UX\Icons\IconFactory;
use Symfony\UX\Icons\IconRenderer;
use Symfony\UX\Icons\Registry\LocalSvgIconRegistry;

/**
 * The resolver ports the attribute resolution of the (final, internal) IconRenderer: both must agree.
 */
final class IconResolverTest extends TestCase
{
    private const FIXTURES = __DIR__ . '/Fixtures';

    private const DEFAULT_ATTRIBUTES = ['fill' => 'currentColor', 'class' => 'icon'];

    private const ALIASES = ['me' => 'user', 'small' => 'img:a:icon', 'done' => 'suf:check-mini-solid'];

    private const SET_ATTRIBUTES = ['img' => ['class' => 'icon icon-img', 'stroke' => 'red'], 'suf' => ['stroke' => 'red']];

    // sorted by length, longest first, like UXIconsExtension does
    private const SUFFIX_ATTRIBUTES = [
        'img' => ['' => ['data-default-suffix' => 'yes']],
        'suf' => ['mini-solid' => ['width' => '16', 'class' => 'mini'], 'solid' => ['width' => '24', 'stroke' => 'blue'], '' => ['data-default-suffix' => 'yes']],
    ];

    #[DataProvider('provideIconNames')]
    public function testSameAttributesAsIconRenderer(string $name): void
    {
        $registry = new LocalSvgIconRegistry(new IconFactory(), self::FIXTURES . '/icons', ['img' => self::FIXTURES . '/images', 'suf' => self::FIXTURES . '/suffixes']);
        $renderer = new IconRenderer($registry, self::DEFAULT_ATTRIBUTES, self::ALIASES, self::SET_ATTRIBUTES, self::SUFFIX_ATTRIBUTES);
        $resolver = new IconResolver($registry, self::DEFAULT_ATTRIBUTES, self::ALIASES, self::SET_ATTRIBUTES, self::SUFFIX_ATTRIBUTES);

        // The renderer adds aria-hidden, the resolver leaves it to JavaScript: given explicitly, both render the same HTML
        self::assertSame(
            $renderer->renderIcon($name, ['aria-hidden' => 'true']),
            $resolver->resolve($name)->withAttributes(['aria-hidden' => 'true'])->toHtml(),
        );
    }

    /**
     * @return iterable<array-key, array{string}>
     */
    public static function provideIconNames(): iterable
    {
        yield ['user'];
        yield ['sub:check'];
        yield ['me'];
        yield ['img:icon'];
        yield ['img:a:icon'];
        yield ['img:a:b:icon'];
        yield ['small'];
        yield 'longest suffix first' => ['suf:check-mini-solid'];
        yield 'suffix' => ['suf:check-solid'];
        yield 'empty suffix as fallback' => ['suf:check'];
        yield 'suffix of the alias target' => ['done'];
    }

    public function testSuffixAttributes(): void
    {
        $registry = new LocalSvgIconRegistry(new IconFactory(), self::FIXTURES . '/icons', ['suf' => self::FIXTURES . '/suffixes']);
        $resolver = new IconResolver($registry, self::DEFAULT_ATTRIBUTES, self::ALIASES, self::SET_ATTRIBUTES, self::SUFFIX_ATTRIBUTES);

        self::assertEquals(['width' => '16', 'class' => 'mini', 'stroke' => 'red'], array_intersect_key($resolver->resolve('suf:check-mini-solid')->getAttributes(), ['width' => 1, 'class' => 1, 'stroke' => 1]));
        self::assertEquals(['width' => '24', 'stroke' => 'blue'], array_intersect_key($resolver->resolve('suf:check-solid')->getAttributes(), ['width' => 1, 'stroke' => 1]));
        self::assertSame('yes', $resolver->resolve('suf:check')->getAttributes()['data-default-suffix'] ?? null);
    }

    public function testMissingIcon(): void
    {
        $resolver = new IconResolver(new LocalSvgIconRegistry(new IconFactory(), self::FIXTURES . '/icons'));

        $this->expectException(IconNotFoundException::class);

        $resolver->resolve('lucide:circle');
    }
}
