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

use Silarhi\UxIconsJsBundle\IconResolver;
use Silarhi\UxIconsJsBundle\IconsDumper;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\UX\Icons\IconFactory;
use Symfony\UX\Icons\IconRenderer;
use Symfony\UX\Icons\Registry\LocalSvgIconRegistry;
use Symfony\UX\Icons\Twig\UXIconRuntime;

/*
 * Dumps the icons of the documentation examples for JavaScript (docs/src/data/icons/), and renders each example of
 * docs/examples/examples.json with ux_icon() (docs/src/data/examples/<name>.html): the Example component compares
 * these renders with renderIcon() at build time.
 *
 *     php docs/scripts/render-examples.php
 */

require \dirname(__DIR__, 2) . '/vendor/autoload.php';

$docs = \dirname(__DIR__);

// The ux_icons configuration of the examples, see the "Live examples" page
$iconDir = $docs . '/examples/icons';
$defaultIconAttributes = ['width' => '1.5em', 'height' => '1.5em'];
$iconSetAttributes = ['lucide' => ['class' => 'lucide']];
$aliases = ['delete' => 'lucide:trash-2'];

$registry = new LocalSvgIconRegistry(new IconFactory(), $iconDir);
$uxIcon = new UXIconRuntime(new IconRenderer($registry, $defaultIconAttributes, $aliases, $iconSetAttributes));

$filesystem = new Filesystem();
$filesystem->remove([$docs . '/src/data/icons', $docs . '/src/data/examples']);

$names = (new IconsDumper(new IconResolver($registry, $defaultIconAttributes, $aliases, $iconSetAttributes), $iconDir, [], $aliases, $docs . '/src/data/icons', false))->dump();

/** @var array<string, array{icon: string, attributes?: array<string, mixed>}> $examples */
$examples = json_decode((string) file_get_contents($docs . '/examples/examples.json'), true, flags: \JSON_THROW_ON_ERROR);
foreach ($examples as $name => $example) {
    $filesystem->dumpFile(\sprintf('%s/src/data/examples/%s.html', $docs, $name), $uxIcon->renderIcon($example['icon'], $example['attributes'] ?? []));
}

printf("Dumped %d icons, rendered %d examples.\n", \count($names), \count($examples));
