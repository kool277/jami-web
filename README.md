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
- [Node.js 18](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [SWIG 4.1.0:](https://www.swig.org/)

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

## Setup

Before proceeding, you must initialize the Git submodule repositories by running the following command:
`git submodule update --init --recursive`

### Build the Jami daemon with Node.js bindings

1. Install the required dependencies: <https://docs.jami.net/build/dependencies.html>

   > Note: for Ubuntu, the needed dependencies are:

   ```
   sudo apt install autoconf automake autopoint bison build-essential cmake curl git libarchive-dev libasio-dev libasound2-dev libdbus-1-dev libdbus-c++-dev libexpat1-dev libfmt-dev libgmp-dev nettle-dev libgnutls28-dev libjsoncpp-dev libmsgpack-dev libnatpmp-dev libopus-dev libpulse-dev libspeex-dev libspeexdsp-dev libssl-dev libtool libudev-dev libupnp-dev libva-dev libvdpau-dev libvpx-dev libx264-dev libyaml-cpp-dev libhttp-parser-dev libwebrtc-audio-processing-dev libsecp256k1-dev guile-3.0-dev nasm pkg-config yasm libpipewire-0.3-dev libsystemd-dev
   ```

2. Compile the dependencies:

   ```sh
   cd daemon/contrib
   mkdir native
   cd native
   ../bootstrap
   make -j$(nproc)
   ```

3. Install `node-gyp` to build the daemon with Node.js bindings:

   ```
   npm install -g node-gyp
   ```

4. Compile the daemon with Node.js bindings:

   ```sh
   cd ../..
   mkdir build && cd build
   cmake .. -DJAMI_NODEJS=On -DBUILD_TESTING=Off
   make -j$(nproc)
   ```

5. Create a symlink to `jamid.node` in `server`:

   ```sh
   cd ../server
   ln -s ../daemon/bin/nodejs/build/Release/jamid.node jamid.node
   cd ..
   ```

6. Set the environement variables for development:
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
LD_LIBRARY_PATH="${PWD}/daemon/src/.libs" npm start
```

> Keep in mind that this script runs the --mode option on the client, allowing it to utilize development variables. Do not use npm start to launch the application in a production environment.

You can also start the client and server individually:

```sh
npm start --workspace client
LD_LIBRARY_PATH="${PWD}/daemon/src/.libs" npm start --workspace server
```

Open <http://localhost:3000> in your browser to view the app.

> Note: Many people experience a problem with the calls to the nameserver. For example, this problem prevents the registration of new users (and other issues): jami-web will not be able to validate whether the new username is available or not. If you experience this problem, you can try to launch the server this way: `LD_LIBRARY_PATH="${PWD}/daemon/src/.libs" HOME=/tmp npm start --workspace server`. This is a temporary solution. It brings other problems related to the fact it makes the data non-persistent. For example, the users you created will be deleted after a certain amount of time.

### Build for production

```
npm run build
```

### Run for production & preview the production build

Set the environement variables for production: in `server/.env` set `NODE_ENV=production`, if NODE_ENV isn't provided then the server will run for production anyway.

```sh
LD_LIBRARY_PATH="${PWD}/daemon/src/.libs" npm run start:prod
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
