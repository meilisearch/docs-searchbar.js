# Contributing <!-- omit in TOC -->

First of all, thank you for contributing to Meilisearch! The goal of this document is to provide everything you need to know in order to contribute to Meilisearch and its different integrations.

- [Assumptions](#assumptions)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Git Guidelines](#git-guidelines)
- [Release Process (for internal team only)](#release-process-for-internal-team-only)

## Assumptions

1. **You're familiar with [GitHub](https://github.com) and the [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)(PR) workflow.**
2. **You've read the Meilisearch [documentation](https://www.meilisearch.com/docs) and the [README](/README.md).**
3. **You know about the [Meilisearch community](https://discord.com/invite/meilisearch). Please use this for help.**

## How to Contribute

1. Make sure that the contribution you want to make is explained or detailed in a GitHub issue! Find an [existing issue](https://github.com/meilisearch/docs-searchbar.js/issues/) or [open a new one](https://github.com/meilisearch/docs-searchbar.js/issues/new).
2. Once done, [fork the docs-searchbar.js repository](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) in your own GitHub account. Ask a maintainer if you want your issue to be checked before making a PR.
3. [Create a new Git branch](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository).
4. Review the [Development Workflow](#development-workflow) section that describes the steps to maintain the repository.
5. Make the changes on your branch.
6. [Submit the branch as a PR](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) pointing to the `main` branch of the main docs-searchbar.js repository. A maintainer should comment and/or review your Pull Request within a few days. Although depending on the circumstances, it may take longer.<br>
   We do not enforce a naming convention for the PRs, but **please use something descriptive of your changes**, having in mind that the title of your PR will be automatically added to the next [release changelog](https://github.com/meilisearch/docs-searchbar.js/releases/).

## Development Workflow

### Requirements <!-- omit in TOC -->

To run this project, you will need:

- Node.js >= v12 and node =< 18
- Yarn

### Install <!-- omit in TOC -->

Install all the dependencies:

```bash
yarn install --dev
```

### Tests and Linter <!-- omit in TOC -->

Each PR should pass the tests and the linter to be accepted.

```bash
# Run all the tests
yarn test
# With auto-reload
yarn test:watch
# End-to-end tests
yarn test:e2e
# Linter
yarn lint
# Linter with auto-correct
yarn lint:fix
# Prettier for Markdown (auto-correct)
yarn format:md
# Prettier for SCSS (auto-correct)
yarn format:scss
```

## Playground

We provide a playground in this repository that hot-reloads on change. The playground points to a remote Meilisearch server that contains the scraped [documentation of Meilisearch](https://www.meilisearch.com/docs/).
You can play arround with the options and or just try out the search.

For example, type `create an indxe` to experience Meilisearch [typo tolerance](https://www.meilisearch.com/docs/learn/getting_started/customizing_relevancy#typo-tolerance).

To launch and open the playground you first need to setup your Meilisearch with some documents to have something on which we can search.

```bash
yarn playground:setup
```

Then you can start the playground.

```bash
yarn playground
```

### Build

```bash
yarn build
```

This command will build all files in `./dist`. This includes regular and minified files for `<script>` inclusion, as well as classes `import`.

The command itself is split into `yarn run build:js` and `yarn run build:css` if you want to build a subset.


## Git Guidelines

### Git Branches <!-- omit in TOC -->

All changes must be made in a branch and submitted as PR.
We do not enforce any branch naming style, but please use something descriptive of your changes.

### Git Commits <!-- omit in TOC -->

As minimal requirements, your commit message should:

- be capitalized
- not finish by a dot or any other punctuation character (!,?)
- start with a verb so that we can read your commit message this way: "This commit will ...", where "..." is the commit message.
  e.g.: "Fix the home page button" or "Add more tests for create_index method"

We don't follow any other convention, but if you want to use one, we recommend [this one](https://chris.beams.io/posts/git-commit/).

### GitHub Pull Requests <!-- omit in TOC -->

Some notes on GitHub PRs:

- [Convert your PR as a draft](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/changing-the-stage-of-a-pull-request) if your changes are a work in progress: no one will review it until you pass your PR as ready for review.<br>
  The draft PR can be very useful if you want to show that you are working on something and make your work visible.
- The branch related to the PR must be **up-to-date with `main`** before merging. Fortunately, this project [integrates a bot](https://github.com/meilisearch/integration-guides/blob/main/resources/bors.md) to automatically enforce this requirement without the PR author having to do it manually.
- All PRs must be reviewed and approved by at least one maintainer.
- The PR title should be accurate and descriptive of the changes. The title of the PR will be indeed automatically added to the next [release changelogs](https://github.com/meilisearch/docs-searchbar.js/releases/).

## Release Process (for the internal team only)

Meilisearch tools follow the [Semantic Versioning Convention](https://semver.org/).

### Automation to Rebase and Merge the PRs <!-- omit in TOC -->

This project integrates a bot that helps us manage pull requests merging.<br>
_[Read more about this](https://github.com/meilisearch/integration-guides/blob/main/resources/bors.md)._

### Automated Changelogs <!-- omit in TOC -->

This project integrates a tool to create automated changelogs.<br>
_[Read more about this](https://github.com/meilisearch/integration-guides/blob/main/resources/release-drafter.md)._

### How to Publish the Release <!-- omit in TOC -->

⚠️ Before doing anything, make sure you got through the guide about [Releasing an Integration](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md).

Make a PR modifying the files [`package.json`](/package.json) and [`src/lib/version.js`](/src/lib/version.js) with the right version.

```javascript
'version': 'X.X.X',
```

```javascript
export default 'X.X.X'
```

Once the changes are merged on `main`, you can publish the current draft release via the [GitHub interface](https://github.com/meilisearch/docs-searchbar.js/releases): on this page, click on `Edit` (related to the draft release) > update the description (be sure you apply [these recommendations](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md#writting-the-release-description)) > when you are ready, click on `Publish release`.

GitHub Actions will be triggered and push the package to [npm](https://www.npmjs.com/package/docs-searchbar.js).

#### Release a `beta` Version

Here are the steps to release a beta version of this package:

- Create a new branch containing the "beta" changes with the following format `xxx-beta` where `xxx` explains the context.

  For example:
    - When implementing a beta feature, create a branch `my-feature-beta` where you implement the feature.
      ```bash
        git checkout -b my-feature-beta
      ```
    - During the Meilisearch pre-release, create a branch originating from `bump-meilisearch-v*.*.*` named `meilisearch-v*.*.*-beta`. <br>
    `v*.*.*` is the next version of the package, NOT the version of Meilisearch!

      ```bash
      git checkout bump-meilisearch-v*.*.*
      git pull origin bump-meilisearch-v*.*.*
      git checkout -b bump-meilisearch-v*.*.*-beta
      ```

- Change the version in [`package.json`](/package.json) and [`src/lib/version.js`](/src/lib/version.js) with `*.*.*-xxx-beta.0` and commit it to the `beta` branch.

- Go to the [GitHub interface for releasing](https://github.com/meilisearch/docs-searchbar.js/releases): on this page, click on `Draft a new release`.

- Create a GitHub pre-release:
  - Fill the description with the detailed changelogs
  - Fill the title with `vX.X.X-beta.0`
  - Fill the tag with `vX.X.X-beta.0`
  - ⚠️ Select the `vX.X.X-beta.0` branch and NOT `main`
  - ⚠️ Click on the "This is a pre-release" checkbox
  - Click on "Publish release"

GitHub Actions will be triggered and push the beta version to [npm](https://www.npmjs.com/package/docs-searchbar.js).

💡 If you need to release a new beta for the same version (i.e. `vX.X.X-beta.1`):
- merge the change into your beta branch
- change the version name in `package.json`
- creata a pre-release via the GitHub interface

<hr>

Thank you again for reading this through. We can not wait to begin to work with you if you make your way through this contributing guide ❤️
