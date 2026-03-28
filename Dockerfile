FROM jami-daemon AS jami-web

WORKDIR /web-client

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    lldb \
    liblldb-dev

# Copy the nodejs package from the daemon image (excluded by .dockerignore)
RUN mkdir -p daemon/bin/nodejs && \
    cp -r /daemon/bin/nodejs/src daemon/bin/nodejs/ && \
    cp -r /daemon/bin/nodejs/npm daemon/bin/nodejs/ && \
    cp -r /daemon/bin/nodejs/scripts daemon/bin/nodejs/ && \
    cp /daemon/bin/nodejs/package.json daemon/bin/nodejs/ && \
    cp /daemon/bin/nodejs/tsconfig.json daemon/bin/nodejs/ && \
    node daemon/bin/nodejs/scripts/pack-native.mjs /daemon/bin/nodejs/build/Release/jamid.node

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY common common
COPY server/scripts server/scripts
COPY server/locale server/locale
COPY server/available_languages.json server/available_languages.json

RUN npm ci
COPY . .

RUN touch server/.env

FROM jami-web AS development
RUN echo "NODE_ENV=development" >> server/.env;
CMD ["npm", "start"]

FROM jami-web AS test
RUN npm run lint

FROM jami-web AS build
RUN npm run build

FROM build AS production
CMD ["npm", "run", "start:prod"]
