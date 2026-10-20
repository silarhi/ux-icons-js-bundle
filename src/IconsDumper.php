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

use DOMAttr;
use DOMDocument;
use DOMElement;
use DOMText;

use function in_array;

use LogicException;
use RuntimeException;

use function sprintf;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\UX\Icons\Exception\IconNotFoundException;
use Symfony\UX\Icons\Icon;

/**
 * Dumps local icons as a JavaScript module, to be rendered by "@silarhi/ux-icons-js".
 *
 * Each icon is exported as a named constant (e.g. "lucide:trash-2" => "LucideTrash2Icon"), so bundlers can tree-shake the icons that are never imported.
 *
 * Configured attributes (default, icon set, and suffix) are resolved here, so the JavaScript side applies the same precedence rules as the "ux_icon()" Twig function.
 */
final readonly class IconsDumper
{
    public const PACKAGE = '@silarhi/ux-icons-js';

    /** The directory of the icon modules loaded by name, relative to the dump directory */
    public const LAZY_DIRECTORY = 'icons';

    private const JSON_FLAGS = \JSON_THROW_ON_ERROR | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE;

    /** @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign ("adjust SVG tag names") */
    private const SVG_TAG_NAMES = [
        'altglyph' => 'altGlyph', 'altglyphdef' => 'altGlyphDef', 'altglyphitem' => 'altGlyphItem', 'animatecolor' => 'animateColor',
        'animatemotion' => 'animateMotion', 'animatetransform' => 'animateTransform', 'clippath' => 'clipPath', 'feblend' => 'feBlend',
        'fecolormatrix' => 'feColorMatrix', 'fecomponenttransfer' => 'feComponentTransfer', 'fecomposite' => 'feComposite',
        'feconvolvematrix' => 'feConvolveMatrix', 'fediffuselighting' => 'feDiffuseLighting', 'fedisplacementmap' => 'feDisplacementMap',
        'fedistantlight' => 'feDistantLight', 'fedropshadow' => 'feDropShadow', 'feflood' => 'feFlood', 'fefunca' => 'feFuncA',
        'fefuncb' => 'feFuncB', 'fefuncg' => 'feFuncG', 'fefuncr' => 'feFuncR', 'fegaussianblur' => 'feGaussianBlur', 'feimage' => 'feImage',
        'femerge' => 'feMerge', 'femergenode' => 'feMergeNode', 'femorphology' => 'feMorphology', 'feoffset' => 'feOffset',
        'fepointlight' => 'fePointLight', 'fespecularlighting' => 'feSpecularLighting', 'fespotlight' => 'feSpotLight', 'fetile' => 'feTile',
        'feturbulence' => 'feTurbulence', 'foreignobject' => 'foreignObject', 'glyphref' => 'glyphRef', 'lineargradient' => 'linearGradient',
        'radialgradient' => 'radialGradient', 'textpath' => 'textPath',
    ];

    /** @see https://html.spec.whatwg.org/multipage/parsing.html#adjust-svg-attributes */
    private const SVG_ATTRIBUTE_NAMES = [
        'attributename' => 'attributeName', 'attributetype' => 'attributeType', 'basefrequency' => 'baseFrequency', 'baseprofile' => 'baseProfile',
        'calcmode' => 'calcMode', 'clippathunits' => 'clipPathUnits', 'diffuseconstant' => 'diffuseConstant', 'edgemode' => 'edgeMode',
        'filterunits' => 'filterUnits', 'glyphref' => 'glyphRef', 'gradienttransform' => 'gradientTransform', 'gradientunits' => 'gradientUnits',
        'kernelmatrix' => 'kernelMatrix', 'kernelunitlength' => 'kernelUnitLength', 'keypoints' => 'keyPoints', 'keysplines' => 'keySplines',
        'keytimes' => 'keyTimes', 'lengthadjust' => 'lengthAdjust', 'limitingconeangle' => 'limitingConeAngle', 'markerheight' => 'markerHeight',
        'markerunits' => 'markerUnits', 'markerwidth' => 'markerWidth', 'maskcontentunits' => 'maskContentUnits', 'maskunits' => 'maskUnits',
        'numoctaves' => 'numOctaves', 'pathlength' => 'pathLength', 'patterncontentunits' => 'patternContentUnits',
        'patterntransform' => 'patternTransform', 'patternunits' => 'patternUnits', 'pointsatx' => 'pointsAtX', 'pointsaty' => 'pointsAtY',
        'pointsatz' => 'pointsAtZ', 'preservealpha' => 'preserveAlpha', 'preserveaspectratio' => 'preserveAspectRatio',
        'primitiveunits' => 'primitiveUnits', 'refx' => 'refX', 'refy' => 'refY', 'repeatcount' => 'repeatCount', 'repeatdur' => 'repeatDur',
        'requiredextensions' => 'requiredExtensions', 'requiredfeatures' => 'requiredFeatures', 'specularconstant' => 'specularConstant',
        'specularexponent' => 'specularExponent', 'spreadmethod' => 'spreadMethod', 'startoffset' => 'startOffset',
        'stddeviation' => 'stdDeviation', 'stitchtiles' => 'stitchTiles', 'surfacescale' => 'surfaceScale', 'systemlanguage' => 'systemLanguage',
        'tablevalues' => 'tableValues', 'targetx' => 'targetX', 'targety' => 'targetY', 'textlength' => 'textLength', 'viewbox' => 'viewBox',
        'viewtarget' => 'viewTarget', 'xchannelselector' => 'xChannelSelector', 'ychannelselector' => 'yChannelSelector',
        'zoomandpan' => 'zoomAndPan',
    ];

    /**
     * @param array<string, string>    $iconSetPaths
     * @param array<array-key, string> $aliases
     */
    public function __construct(
        private IconResolver $resolver,
        private string $iconDir,
        private array $iconSetPaths,
        private array $aliases,
        private string $dumpDir,
        private bool $dumpTypeScript = true,
        private Filesystem $filesystem = new Filesystem(),
    ) {
    }

    /**
     * @return list<string> the dumped icon names
     */
    public function dump(): array
    {
        $exports = $this->exports();

        $header = "// This file is auto-generated by silarhi/ux-icons-js-bundle, do not edit it manually.\n";
        $js = $dts = $header;
        $dts .= sprintf("import type { UXIconData } from '%s';\n", self::PACKAGE);
        $loaders = $header . "export const loaders = {\n";
        $lazyFiles = [];
        foreach ($exports as $exportName => [$name, $icon]) {
            $data = json_encode([
                'name' => $name,
                'attributes' => (object) $icon->getAttributes(),
                'children' => self::children($icon->getInnerSvg()),
            ], self::JSON_FLAGS);
            $js .= sprintf("export const %s = %s;\n", $exportName, $data);
            $dts .= sprintf("export declare const %s: UXIconData<%s>;\n", $exportName, json_encode($name, self::JSON_FLAGS));

            // One module per icon, so a name known only at runtime loads its icon alone. Named by its lowercase id
            // ("img:a:b:icon" => "img--a--b--icon"): export names only differ by case on case-insensitive filesystems
            $lazyFile = sprintf('%s/%s.js', self::LAZY_DIRECTORY, Icon::nameToId($name));
            $lazyFiles[$lazyFile] = sprintf("%sexport default %s;\n", $header, $data);
            $loaders .= sprintf("    %s: () => import('./%s'),\n", json_encode($name, self::JSON_FLAGS), $lazyFile);
        }
        $loaders .= "};\n";

        $names = array_map(static fn (array $export): string => json_encode($export[0], self::JSON_FLAGS), $exports);
        $loadersDts = $header
            . sprintf("import type { UXIconLoaders } from '%s';\n", self::PACKAGE)
            . sprintf("export type IconName = %s;\n", [] === $names ? 'never' : implode(' | ', $names))
            . "export declare const loaders: UXIconLoaders<IconName>;\n";

        $this->write('index.js', $js);
        $this->write('loaders.js', $loaders);
        foreach ($lazyFiles as $lazyFile => $content) {
            $this->write($lazyFile, $content);
        }
        $this->removeStaleLazyFiles(array_keys($lazyFiles));

        if ($this->dumpTypeScript) {
            $this->write('index.d.ts', $dts);
            $this->write('loaders.d.ts', $loadersDts);
        } else {
            $this->filesystem->remove([$this->dumpDir . '/index.d.ts', $this->dumpDir . '/loaders.d.ts']);
        }

        return array_column(array_values($exports), 0);
    }

    /**
     * The names of the icons a dump would export, without dumping them.
     *
     * @return list<string>
     */
    public function iconNames(): array
    {
        return array_column(array_values($this->exports()), 0);
    }

    /**
     * "lucide:trash-2" => "LucideTrash2Icon", "500" => "_500Icon".
     */
    public static function exportName(string $name): string
    {
        $exportName = str_replace(' ', '', ucwords(str_replace([':', '-'], ' ', $name))) . 'Icon';

        return ctype_digit($exportName[0]) ? '_' . $exportName : $exportName;
    }

    /**
     * Converts the sanitized inner SVG into a tree, so JavaScript renders it without "innerHTML".
     *
     * An element is a [tag, attributes, children?] tuple, a text node is a string.
     *
     *     '<g fill="none"><path d="M0 0"></path></g>' => [['g', {fill: 'none'}, [['path', {d: 'M0 0'}]]]]
     *
     * @return list<array{0: string, 1: object, 2?: list<mixed>}|string>
     */
    public static function children(string $innerSvg): array
    {
        return class_exists(\Dom\HTMLDocument::class) ? self::html5Children($innerSvg) : self::legacyChildren($innerSvg);
    }

    /**
     * @return list<array{0: string, 1: object, 2?: list<mixed>}|string>
     */
    private static function html5Children(string $innerSvg): array
    {
        // The inner SVG is serialized as HTML (see IconFactory::innerSvg()), so it is parsed like a browser parses the "ux_icon()" output
        $document = \Dom\HTMLDocument::createFromString('<!DOCTYPE html><svg>' . $innerSvg . '</svg>', \LIBXML_NOERROR);
        $svg = $document->body->firstElementChild ?? throw new RuntimeException('The icon body is not valid SVG.');

        return self::nodes($svg);
    }

    /**
     * Same as {@see children()} before PHP 8.4, with the libxml HTML 4 parser.
     *
     * It lowercases element and attribute names: the SVG ones are adjusted back like the HTML 5 parser does.
     *
     * @internal
     *
     * @return list<array{0: string, 1: object, 2?: list<mixed>}|string>
     */
    public static function legacyChildren(string $innerSvg): array
    {
        $document = new DOMDocument();
        $document->loadHTML('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><svg>' . $innerSvg . '</svg></body></html>', \LIBXML_NOERROR | \LIBXML_NOWARNING | \LIBXML_NONET);
        $svg = $document->getElementsByTagName('svg')->item(0) ?? throw new RuntimeException('The icon body is not valid SVG.');

        return self::legacyNodes($svg);
    }

    /**
     * @return array<string, array{0: string, 1: Icon}> the icons by export name, sorted
     */
    private function exports(): array
    {
        $exports = [];
        foreach ($this->candidateNames() as $name) {
            try {
                $icon = $this->resolver->resolve($name);
            } catch (IconNotFoundException) {
                // e.g. an alias targeting a remote icon that has not been imported/locked
                continue;
            }

            $exportName = self::exportName($name);
            if (isset($exports[$exportName])) {
                throw new LogicException(sprintf('Icons "%s" and "%s" would both be exported as "%s", rename one of them.', $exports[$exportName][0], $name, $exportName));
            }

            $exports[$exportName] = [$name, $icon];
        }

        ksort($exports);

        return $exports;
    }

    /**
     * Rewrites a file only when its content changes, so a watching bundler does not rebuild every icon chunk.
     */
    private function write(string $file, string $content): void
    {
        $path = $this->dumpDir . '/' . $file;
        if (!is_file($path) || file_get_contents($path) !== $content) {
            $this->filesystem->dumpFile($path, $content);
        }
    }

    /**
     * @param list<string> $lazyFiles the icon modules of this dump
     */
    private function removeStaleLazyFiles(array $lazyFiles): void
    {
        $directory = $this->dumpDir . '/' . self::LAZY_DIRECTORY;
        if (!is_dir($directory)) {
            return;
        }

        foreach (Finder::create()->files()->in($directory)->depth(0)->name('*.js') as $file) {
            if (!in_array(self::LAZY_DIRECTORY . '/' . $file->getFilename(), $lazyFiles, true)) {
                $this->filesystem->remove($file->getPathname());
            }
        }
    }

    /**
     * @return list<array{0: string, 1: object, 2?: list<mixed>}|string>
     */
    private static function nodes(\Dom\Element $parent): array
    {
        $nodes = [];
        foreach ($parent->childNodes as $node) {
            if ($node instanceof \Dom\Text) {
                $nodes[] = $node->data;
            } elseif ($node instanceof \Dom\Element) {
                $attributes = [];
                foreach ($node->attributes as $attribute) {
                    // qualified name, e.g. "xlink:href"
                    $attributes[$attribute->name] = $attribute->value;
                }

                $element = [$node->localName, (object) $attributes];
                $children = self::nodes($node);
                if ([] !== $children) {
                    $element[] = $children;
                }

                $nodes[] = $element;
            }
        }

        return $nodes;
    }

    /**
     * @return list<array{0: string, 1: object, 2?: list<mixed>}|string>
     */
    private static function legacyNodes(DOMElement $parent): array
    {
        $nodes = [];
        foreach ($parent->childNodes as $node) {
            if ($node instanceof DOMText) {
                $nodes[] = $node->data;
            } elseif ($node instanceof DOMElement) {
                $attributes = [];
                foreach ($node->attributes as $attribute) {
                    /* @var DOMAttr $attribute */
                    $attributes[self::SVG_ATTRIBUTE_NAMES[$attribute->name] ?? $attribute->name] = $attribute->value;
                }

                $element = [self::SVG_TAG_NAMES[$node->nodeName] ?? $node->nodeName, (object) $attributes];
                $children = self::legacyNodes($node);
                if ([] !== $children) {
                    $element[] = $children;
                }

                $nodes[] = $element;
            }
        }

        return $nodes;
    }

    /**
     * @return list<string>
     */
    private function candidateNames(): array
    {
        $names = [];

        foreach ($this->svgFiles($this->iconDir) as $relativeName) {
            $names[] = str_replace('/', ':', $relativeName);
        }

        foreach ($this->iconSetPaths as $prefix => $path) {
            foreach ($this->svgFiles($path) as $relativeName) {
                $names[] = $prefix . ':' . str_replace('/', ':', $relativeName);
            }
        }

        // numeric aliases (e.g. "500") are integer keys
        $names = [...$names, ...array_map(strval(...), array_keys($this->aliases))];

        return array_values(array_filter(array_unique($names), Icon::isValidName(...)));
    }

    /**
     * @return iterable<string> the SVG paths relative to the directory, without extension
     */
    private function svgFiles(string $directory): iterable
    {
        if (!is_dir($directory)) {
            return;
        }

        foreach (Finder::create()->files()->in($directory)->name('*.svg')->sortByName() as $file) {
            yield substr(str_replace('\\', '/', $file->getRelativePathname()), 0, -4);
        }
    }
}
