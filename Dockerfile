FROM jami-daemon AS jami-web

WORKDIR /web-client
ENV LD_LIBRARY_PATH=/daemon/src/.libs

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    lldb \
    liblldb-dev

# Create a symlink to the daemon node app
RUN mkdir -p server && ln -s /daemon/bin/nodejs/build/Release/jamid.node server/jamid.node

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
