# Jami Web

The web version of Jami.

The repo is structured as 4 subprojects:

- `client`: the web front-end made with React
- `server`: the back-end server made with Express.js, which starts a daemon instance
- `common`: the common code used by both `client` and `server`
- `daemon`: a submodule containing the Jami daemon

To view the deployment instructions for jami-web, refer to the [Deployment Guide](./deployment.md).

## Prerequisites

- Linux
- [Node.js 22](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [SWIG >= 4.3:](https://www.swig.org/) (required for N-API support)
  - Build from source with the following instructions: <https://swig.org/svn.html>

    > Note: you will need to have Bison installed. On Ubuntu, this can be installed using `sudo apt install bison`.

    ```sh
    git clone https://github.com/swig/swig.git
    cd swig
    ./autogen.sh
    ./configure
    make
    sudo make install
    ```

## Install from npm

Jami Web is published as `@savoirfairelinux/jami-web`. The package installs a `jami-web` command and depends on `@savoirfairelinux/jami-core`, which provides the native daemon module for the current platform.

```sh
npm install -g @savoirfairelinux/jami-web
jami-web
```

By default the server listens on port `8080`. Set `PORT` to override it:

```sh
PORT=8081 jami-web
```

The server also starts a local Unix socket CLI control API, used by
`jami-web accounts` and `jami-web create-bot`.
By default it uses `RUNTIME_DIRECTORY/cli.sock` (systemd), then
`XDG_RUNTIME_DIR/jami-web/cli.sock`, then a data-directory fallback.
Override it with `JAMI_WEB_CLI_SOCKET` when needed.

The setup wizard stores signing keys and server data in the operating system's Jami Web application data directory, so the `jami-web` command can be started from any working directory. Set `JAMI_WEB_DATA_DIR` to store data in a custom location.

The first start automatically creates persistent JWT signing keys when they do not already exist. You can still run `jami-web setup` for the interactive CLI setup wizard.

### First-run setup

After installing, configure the server once with the setup wizard:

```sh
jami-web setup
```

The wizard creates the admin account, JWT signing keys, and the authentication
configuration. For unattended installs, run it non-interactively:

```sh
JAMI_WEB_ADMIN_PASSWORD='change-me' jami-web setup --non-interactive --enable-local
```

Useful CLI commands:

- `jami-web install` — install and start Jami Web as a per-user startup service
- `jami-web doctor` — run health checks (data dir, keys, admin account, native daemon, listeners)
- `jami-web config` — show the resolved data directory, env file, and effective runtime settings
- `jami-web genkeys` — (re)generate JWT signing keys

`jami-web accounts ...` and `jami-web create-bot ...` now require a running server.
If the server is down, they fail and ask you to start the server first.

### Run in production

For production deployments (reverse proxy with TLS, systemd service, Docker,
backups, and upgrades), see the [Deployment Guide](./deployment.md).

## Setup

Before proceeding, you must initialize the Git submodule repositories by running the following command:
`git submodule update --init --recursive`

### Build the Jami daemon with Node.js bindings

1. Install the required dependencies: <https://docs.jami.net/build/dependencies.html>

   > Note: for Ubuntu, the needed dependencies are:

   ```
   sudo apt install autoconf automake autopoint bison build-essential cmake curl git libarchive-dev libasio-dev libasound2-dev libdbus-1-dev libdbus-c++-dev libexpat1-dev libfmt-dev libgmp-dev nettle-dev libgnutls28-dev libjsoncpp-dev libmsgpack-dev libnatpmp-dev libopus-dev libpulse-dev libspeex-dev libspeexdsp-dev libssl-dev libtool libudev-dev libupnp-dev libva-dev libvdpau-dev libvpx-dev libx264-dev libyaml-cpp-dev libhttp-parser-dev libwebrtc-audio-processing-dev libsecp256k1-dev guile-3.0-dev nasm pkg-config yasm libpipewire-0.3-dev libsystemd-dev
   ```

2. Install `node-gyp` and `node-addon-api` to build the daemon with Node.js bindings:

   ```
   npm install -g node-gyp node-addon-api
   ```

3. Compile the daemon with Node.js bindings:

   ```sh
   cd ../..
   mkdir build && cd build
   cmake .. -DJAMI_NODEJS=On -DBUILD_TESTING=Off -GNinja
   ninja
   ```

4. Pack the native addon into the platform-specific core package:

   ```sh
   cd ../..
   npm run pack-native --workspace=@savoirfairelinux/jami-core
   ```

5. Set the environement variables for development:
   in `server/.env` set `NODE_ENV=development`.

### Install npm dependencies and set up Git hooks

```
npm install
```

This will install the relevant dependencies for all subprojects and configure Git hooks.

## Usage

### Run with hot-reload for development

Start both the client and server:

```sh
npm start
```

> Keep in mind that this script runs the --mode option on the client, allowing it to utilize development variables. Do not use npm start to launch the application in a production environment.

You can also start the client and server individually:

```sh
npm start --workspace client
npm start --workspace server
```

Open <http://localhost:3000> in your browser to view the app.

> Note: Many people experience a problem with the calls to the nameserver. For example, this problem prevents the registration of new users (and other issues): jami-web will not be able to validate whether the new username is available or not. If you experience this problem, you can try to launch the server this way: `HOME=/tmp npm start --workspace server`. This is a temporary solution. It brings other problems related to the fact it makes the data non-persistent. For example, the users you created will be deleted after a certain amount of time.

### Build for production

```
npm run build
```

### Run for production & preview the production build

Set the environement variables for production: in `server/.env` set `NODE_ENV=production`, if NODE_ENV isn't provided then the server will run for production anyway.

```sh
npm run start:prod
```

### Lint files

```
npm run lint
```

Lint and fix files:

```
npm run lint:fix
```

### Format files

```
npm run format
```

### Clean build output

```
npm run clean
```

## Testing

Run the Chromium Playwright suite:

```sh
npx playwright test --project=chromium
```

Playwright starts the mock API server on port 5002 and the client development
server on port 3000 automatically. To inspect the application against the mock
server outside the test runner, start it manually:

```sh
npx tsx tests/mock-server.ts
npm run start --workspace=client
```

The standalone mock server has these preconfigured accounts:

| Role  | Username | Password      |
| ----- | -------- | ------------- |
| Admin | —        | AdminPass123! |
| User  | testuser | Test1234!     |

To reset the mock server to its initial state, send a `POST` request to
`/__reset`.

## Using a Docker container

You may instead wish to use a Docker container for development or to deploy the app.

This allows you to avoid having to install all the dependencies needed to build the daemon on your computer. The development container uses bind mounts to mount the source code from your computer into the container, so that the container rebuilds the project whenever changes are made locally.

> Initialize Git submodule repositories by running the following command:
> `git submodule update --init --recursive`

### With Docker Compose

`docker-compose` is required, it can be installed with the following command on linux :`sudo apt install docker-compose`

#### Build for production

```
docker compose up --build -d
```

#### Build for development

```
docker-compose -f docker-compose.dev.yml up

```

The application is now `running on port 3000` of your local machine.

### Without Docker Compose

#### Build for production

1. Build the Docker image for the daemon:

   ```sh
   cd daemon
   docker build --build-arg cmake_args=-DJAMI_NODEJS=ON -t jami-daemon .
   cd ..
   ```

> If you encounter the error `ERROR [internal] load metadata for docker.io/library/ubuntu:22.04`, simply open your `~/.docker/config.json` file and delete the line that contains `"credsStore": "desktop"`.

2. Build the Docker image for Jami web:

   ```sh
   docker build --target production -t jami-web .
   ```

3. Run the Docker container:
   ```
   docker run -it \
       -p 8080:8080 \
       jami-web
   ```

#### Build for development

1. Build the Docker image for the daemon:

   ```sh
   cd daemon
   docker build --build-arg cmake_args=-DJAMI_NODEJS=ON -t jami-daemon .
   cd ..
   ```

> If you encounter the error `ERROR [internal] load metadata for docker.io/library/ubuntu:22.04`, simply open your `~/.docker/config.json` file and delete the line that contains `"credsStore": "desktop"`.

2. Build the Docker image for Jami web:

   ```sh
   docker build --target development -t jami-web .
   ```

3. Run the Docker container:
   ```
   docker run -it \
       -p 3000:3000 \
       -p 5002:5002 \
       --volume ${PWD}/client/src:/web-client/client/src \
       --volume ${PWD}/server/src:/web-client/server/src \
       --volume ${PWD}/client/.env.development:/web-client/client/.env.development \
       --volume ${PWD}/server/.env:/web-client/server/.env \
       jami-web
   ```
