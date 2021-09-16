# kont

[![trunk](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma-labs/kont/actions/workflows/trunk.yml)

Project template for TypeScript libraries

#### Quickstart

1. Setup a clone of this repo:

   ```
   gh repo clone prisma-labs/kont <your package name> && cd <your package name> && yarn
   ```

1. Run the bootstrapper script:

   ```
   yarn -s bootstrap \
      --repoOrg '<your org>/<your repo>' \
      --developerName '<your full name>' \
      --packageName '<your package name>' \
      --createGithubRepo
   ```

1. [Setup a repo secret ](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets) called `NPM_TOKEN` containing an [npm token](https://docs.npmjs.com/creating-and-viewing-authentication-tokens) for CI package publishing.

Example:

```
gh repo clone prisma-labs/kont foobar \
   && cd foobar \
   && yarn \
   && yarn -s bootstrap \
      --repoOrg 'jasonkuhrt/foobar' \
      --developerName 'Jason Kuhrt' \
      --packageName 'foobar' \
      --createGithubRepo
```

#### Features

1. [TypeScript](https://www.typescriptlang.org/)

   1. Optimal settings for the safety of your implementation
      1. [`strict`](https://www.typescriptlang.org/tsconfig#strict) mode enabled.
      1. All lint flags enabled:
         - [`noImplicitReturns`](https://www.typescriptlang.org/tsconfig#noImplicitReturns)
         - [`noFallthroughCasesInSwitch`](https://www.typescriptlang.org/tsconfig#noFallthroughCasesInSwitch)
         - [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
         - [`noPropertyAccessFromIndexSignature`](https://www.typescriptlang.org/tsconfig#noPropertyAccessFromIndexSignature)
         - [`noImplicitOverride`](https://www.typescriptlang.org/tsconfig#noImplicitOverride)
   1. `.tsbuildinfo` cache setup, output discretely into `node_modules/.cache`
   1. Base `tsconfig.json` shared across `tests`, `src`, and `ts-node`.
   1. [`ttypescript`](https://github.com/cevek/ttypescript) setup for enhanced language features:
      1. [`ts-nameof`](https://github.com/dsherret/ts-nameof) for pulling the names of identifier down into your runtime!
      1. [`typescript-transform-paths`](https://github.com/LeDDGroup/typescript-transform-paths) for a **_working_** [tsconfig `paths` config](https://www.typescriptlang.org/tsconfig#paths)!
      1. Tricky `ts-node` configuration taken care of.
   1. Optimal output setup for your users
      1. Target ES2019 which Node as low as version 12 has good support for ([kangax compat table](https://node.green/#ES2019)).
      1. [`declaration`](https://www.typescriptlang.org/tsconfig#declaration) so your users can power their intellisense with your packages typings.
      1. [`declarationMap`](https://www.typescriptlang.org/tsconfig#declarationMap) enabled to make your published source code be navigated to when your users use "go to definition".
      1. `package.json` [`typeVersions`](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions) used to emit only **one** set of declaration files shared by both CJS and ESM builds.
      1. [`sourceMap`](https://www.typescriptlang.org/tsconfig#sourceMap) enabled to allow your users' tools to base off the source for e.g. stack traces instead of the less informative derived built JS.
      1. [`importHelpers`](https://www.typescriptlang.org/tsconfig#importHelpers) enabled to minimize build size.

1. [ESLint](https://eslint.org/)
   1. TypeScript integration
   1. TS type-checker powered eslint checks enabled
   1. Prettier integration using just [`eslint-config-prettier`](https://github.com/prettier/eslint-config-prettier). [`eslint-plugin-prettier`](https://github.com/prettier/eslint-plugin-prettier) is _not_ used to avoid lint noise and slower run time. Prettier is expected to be run by your IDE and your CI and if really neeeded _you manually_ via `yarn format`.
   1. Setup as a CI check for PRs
   1. Always display as warning to keep IDE error feedback for TypeScript (CI enforces warnings).
1. [`jest`](https://jestjs.io) for testing
   1. Setup with `ts-jest`
   1. Handy watch mode plugins
      1. [`jest-watch-typeahead`](https://github.com/jest-community/jest-watch-typeahead)
      1. [`jest-watch-suspend`](https://github.com/unional/jest-watch-suspend)
      1. [`jest-watch-select-projects`](https://github.com/jest-community/jest-watch-select-projects)
   1. `jest.config.ts` for type safe & intellisense configuration!
   1. [`typescript-snapshots-plugin`](https://github.com/asvetliakov/typescript-snapshots-plugin) for viewing snapshots on hover of `.toMatchSnapshot` method!
1. [`dripip`](https://github.com/prisma-labs/dripip) for release management
1. Simple succinct friendly low-barrier issue templates
   1. Emojis ✈️
   1. Feature / bug / docs / something-else
   1. Config to display discussions link right in new issue type listing UI
1. [Prettier](https://prettier.io/) for code formating
   1. Prisma Labs config preset, 110 line width
   1. Setup as a CI check for PRs
   1. [VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) in recommended extensions list so that when collaborators open the project they'll get prompted to install it if they haven't already.
   1. npm script
1. [`format-imports`](https://github.com/daidodo/format-imports)
   1. Setup as a CI check for PRs
   1. [VSCode extension](https://marketplace.visualstudio.com/items?itemName=dozerg.tsimportsorter) in recommended extensions list so that when collaborators open the project they'll get prompted to install it if they haven't already.
   1. npm script
   1. [Config in package.json](https://github.com/daidodo/format-imports#configuration-resolution) to disable [empty lines between groups](https://github.com/daidodo/format-imports/blob/main/docs/interfaces/configuration.md#emptylinesbetweengroups).
1. npm scripts for development lifecycle
   1. `clean` to remove cache and dist files
   1. `build` that runs `clean` beforehand
   1. `prepublishOnly` that runs `build` beforehand
   1. `format` to quickly run `prettier` and `format-imports` over whole codebase
   1. `lint` to quickly run `eslint` over whole codebase
1. CI with GitHub Actions
   1. Separate trunk and pull-request (PR) workflows.
   1. [Dependency install cache](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#caching-packages-dependencies) enabled.
   1. On PR:
      1. Prettier Check
      1. Format Imports Check
      1. Lint Check
      1. Tests across matrix of mac/linux/windows for Node 14/16
   1. On trunk:
      1. Tests across matrix of mac/linux/windows for Node 14/16
      1. Automated canary release
1. [Renovate](https://github.com/renovatebot/renovate) configuration
   1. JSON Schema setup for optimal intellisense
   1. Group all non-major devDependency updates into single PR (wich "chore" conventional commit type)
   1. Group all major devDependency updates into single PR (with "chore" conventional commit type)
   1. Group all non-major dependency updates into single PR (with "deps" conventional commit type)
   1. Each major dependency update in own PR (with "deps" conventional commit type)
1. [Yarn 1](https://classic.yarnpkg.com/lang/en/) for package management (mostly for great script runner behaviour)
1. Hybrid package build CJS+ESM (see [Dr. Axel's article about this](https://2ality.com/2019/10/hybrid-npm-packages.html))
   1. Use `exports` field to give support to both modern `import` and legacy `require` consumers using Node 12.x and up. For details about the `exports` field refer to the [Official Node.js Docs](https://nodejs.org/api/packages.html#packages_package_entry_points) about it.
   1. Use `main` field for legacy versions of Node (before `12.x`) requiring the CJS build.
   1. Use `module` field for legacy bundlers importing the ESM build.
1. VSCode Settings
   1. Optimize project search by ignoring `dist-cjs`/`dist-esm` directories.
   1. Enable `typescript.enablePromptUseWorkspaceTsdk` so that oneself and collaborators will get prompted to use the workspace version of TypeScript instead of the one in the editor.

#### Tips

1. Update your GitHub org's label-sync repo to include config for your new repo, assuming your org has such a thing. For example for Prisma Labs: [prisma-labs/label-sync](https://github.com/prisma-labs/prisma-labs-labelsync/blob/master/labelsync.ts).
