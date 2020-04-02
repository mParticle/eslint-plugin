<img src="https://static.mparticle.com/sdk/mp_logo_black.svg" width="280"><br>

# @mparticle/eslint-plugin

Data quality at mParticle begins with data planning and getting data ingestion right. 

The mParticle ESLint plugin allows developers to lint their code based on their company's [mParticle Data Plan](https://docs.mparticle.com/guides/data-master/#data-plans).

# Setup

1. Download your company's `data plan`.
    - Log into your company's [mParticle dashboard](https://app.mparticle.com).
    - Click on `Data Master`, then `Plans`, then select the plan you want lint against (this is typically your most recent data plan version)
    - Next to `Bulk Import` at the top right, click `...`, then click `Download Plan Version` and place this anywhere in your root directory. In this example, we'll pretend you have an `mParticleConfig` folder at the root of your project. Save the data plan into the `mParticleConfig` folder.
2. Create an `mp.config.json` file in the root of your project with the following:

```
{
    "planningConfig": {
        "baseDir": "mParticleConfig",
        "dataPlanVersionFile": "dataPlan.json"
    }
}
```

3. @mparticle/eslint-plugin has a dependency of ESLint and requires a proper .eslintrc file, which you can learn more about at ESLint's [setup page](https://eslint.org/docs/user-guide/getting-started).
4. In your command line, `cd` to your project root and enter:

```
npm install @mparticle/eslint-plugin
```

5. In your .eslintrc file, add the following lines:

```
"plugins": ["@mparticle/eslint-plugin"],
"extends": ["plugin:@mparticle/data-planning"]
```

If you follow the directions above, you should now be able to see when you are not properly sending events in that adhere to your data plan.

Note that if your path to your data plan is incorrect inside of your mp.config.json file, you'll see an error message wherever mParticle is called that says `Your mParticle data plan was not found. Please be sure to reference your data plan properly in mp.config.json and try again.`

If your company makes changes to your data plan, please repeat step 1, selecting the new data plan.

## Core SDK Documentation

Fully detailed documentation and other information about mParticle web SDK can be found at our doc site

-   [Core mParticle SDK](https://docs.mparticle.com/developers/sdk/web/getting-started)

# Contribution Guidelines

At mParticle, we are proud of our code and like to keep things open source. If you'd like to contribute, simply fork this repo, push any code changes to your fork, and submit a Pull Request against the `master` branch of this repo.

## Running the Tests

Prior to running the tests please install all dev dependencies via an `npm install`. Then simply run `npm run test`

The test script will run all tests using Mocha as unit tests.

## Support

<support@mparticle.com>

## License

The mParticle Web Media SDK is available under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). See the LICENSE file for more info.
