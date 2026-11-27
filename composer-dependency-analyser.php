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

use ShipMonk\ComposerDependencyAnalyser\Config\Configuration;
use ShipMonk\ComposerDependencyAnalyser\Config\ErrorType;

$bundle = [__DIR__ . '/src/SilarhiUxIconsJsBundle.php', __DIR__ . '/src/DependencyInjection'];

// Only a kernel loads the bundle class and its compiler pass, and a kernel has the framework, symfony/config and
// symfony/dependency-injection: they stay in require-dev, the rest of src/ must not use them. symfony/asset-mapper is
// optional, behind an interface_exists() guard.
$configuration = (new Configuration())
    ->ignoreErrorsOnPackageAndPath('symfony/config', __DIR__ . '/src/SilarhiUxIconsJsBundle.php', [ErrorType::DEV_DEPENDENCY_IN_PROD])
    ->ignoreErrorsOnPackageAndPaths('symfony/dependency-injection', $bundle, [ErrorType::DEV_DEPENDENCY_IN_PROD])
    ->ignoreErrorsOnPackageAndPath('symfony/asset-mapper', __DIR__ . '/src/SilarhiUxIconsJsBundle.php', [ErrorType::DEV_DEPENDENCY_IN_PROD])
    // service() is a plain function of symfony/dependency-injection, declared outside of its autoloader
    ->ignoreUnknownFunctions(['Symfony\Component\DependencyInjection\Loader\Configurator\service']);

// symfony/ux-icons 2.x has no IconFinderInterface: the bundle registers JavaScriptIconFinder behind an
// interface_exists() guard
if (!is_file(__DIR__ . '/vendor/symfony/ux-icons/src/IconFinderInterface.php')) {
    $configuration->ignoreUnknownClasses(['Symfony\\UX\\Icons\\IconFinderInterface']);
}

return $configuration;
