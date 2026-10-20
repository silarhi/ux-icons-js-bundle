# Contributing

Contributions are welcome! Bug reports and feature requests go to the
[issue tracker](https://github.com/silarhi/ux-icons-js-bundle/issues), changes to a pull request against `main`.

## Setup

```bash
composer install
pnpm install # Git hooks: lint-staged formats the staged files on commit
cd assets && pnpm install
```

## Quality checks

The CI runs PHPUnit on every supported PHP version, with the lowest and the latest dependencies: PHP 8.2 and 8.3 test
`symfony/ux-icons` 2.x, PHP 8.4 both majors. PHPStan runs once on the latest PHP and dependencies, where every
version-dependent code path exists; PHP CS Fixer and the `composer.json` checks run once too. It does not run Rector:
run it locally before opening a pull request.

```bash
# Tests
vendor/bin/phpunit

# Static analysis (level: max)
vendor/bin/phpstan analyse

# Code style (drop --dry-run --diff to fix)
vendor/bin/php-cs-fixer fix --dry-run --diff

# Code modernization (drop --dry-run to apply)
vendor/bin/rector process --dry-run

# composer.json
composer validate --strict
composer normalize --dry-run
```

The `@silarhi/ux-icons-js` package lives in [`assets/`](assets):

```bash
cd assets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

To run the tests on PHP 8.2 locally, use the Homebrew keg (see `phpv` to switch the CLI):

```bash
/opt/homebrew/opt/php@8.2/bin/php "$(which composer)" update --prefer-lowest
/opt/homebrew/opt/php@8.2/bin/php vendor/bin/phpunit
```

## Documentation

The documentation site, [ux-icons-js-bundle.silarhi.dev](https://ux-icons-js-bundle.silarhi.dev), is built from the
[`docs/`](docs) folder with [Starlight](https://starlight.astro.build). Document a change in the same pull request:

```bash
cd docs
pnpm install
pnpm dev # http://localhost:4321
```

Pull requests touching `docs/` build the site; it is published once merged into `main`.

## License

By contributing, you agree that your contributions are released under the [MIT License](LICENSE).
