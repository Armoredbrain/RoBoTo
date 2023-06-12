# Conversationnal agent Roboto

## Introduction

This is a micro service to manage bot speech.
It is in communication with a NLU server from rasa [here](https://github.com/Armoredbrain/rasa_nlu_server)

## How to talk with your bot?

Once your NLU server is up you can talk with your bot by `POST` to `/speak?<insert session id if it exists>` with a payload like this :

```json
{
    "say": {
        "message": "Coucou le bot"
    }
}
```

#

# That's all folks, happy hacking :robot:

## Scripts

Before all you can run `nvm use`, it will change your node version to lts based on `.nvmrc`. If you haven't installed it yet follow this steps:

-   `nvm install 18.16.0`
-   `nvm use`

Currently last lts version is `18.16.0`, it will change sooner or later. So when it does, simply change content in `.nvmrc` then run `nvm install <insert lts version>` and `nvm use`

### Start app

-   `yarn start`
    Server will start with nodemon to allow auto-reload

-   `./get_container_info.sh`
    Allow you to know where is your NLU container, should be done after your NLU server is running. Then modify your `.env` with found value

### Mapping bot flows and intents

You will find a file [mapping](./config/mapping.json). It is here to allow you to route your intent from nlu server to corresponding bot flow

```json
{
    "flow_name_1": ["intent_1", "intent_2"],
    "flow_name_2": ["intent_3", "intent_4", "intent_5"],
    "flow_name_3": [],
    "flow_name_4": ["intent_6"]
}
```

### Build app

-   `yarn build`
    It will build in `./build/`

### Husky

#### What to do first to have husky setup

-   `yarn husky:setup`
    It will setup husky to roll before commit
    If you run it multiple times you will add duplicate pre-commit hooks, so if in a doubt simply delete `.husky/` folder and run yarn `husky:setup`

:warn: On windows you could run into some trouble to push your change, if so go to `./.husky/pre-push` and add before `yarn build`:

```bash
if [ -t 1 ]; then
  exec < /dev/tty
fi
```

### Jest

#### Simple test run

-   `yarn test`

#### Watch test run

-   `yarn test:watch`

#### Coverage test run

-   `yarn test:watch`

### Stryker

#### Documentation

[here](https://github.com/stryker-mutator/stryker-js)

#### Simple test run

-   `yarn stryker`

### Prettier

#### Check project format

-   `yarn prettier`

#### Fix project format

-   `yarn prettier:fix`

### EsLint

#### Check project lint error and warn

-   `yarn lint`

#### Fix project lint error and warn

-   `yarn lint:fix`
