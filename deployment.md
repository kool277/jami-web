# Deploy Jami Web

## Deploy with Docker

**WARNING** : Deploying `jami-web` with Docker is much easier than using the `tar.gz` files. Keep in mind that the data will be managed through Docker volumes and will remain persistent unless manually deleted. Proceed with caution.

### Install docker

1. Set up Docker's `apt` repository.

   ```bash
   # Add Docker's official GPG key:
   sudo apt-get update
   sudo apt-get install ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   # Add the repository to Apt sources:
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   ```

2. Install the Docker packages.
   ```console
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

### Build containers

Ensure that you are in the root of the working directory before proceeding.

```console
docker compose up --build -d
```

The application is now running on port 8080 of your local machine. To set up the reverse proxy, please refer to the Nginx configuration section below.

## Deploy from tar.gz

### Depedencies

**WARNING:** Currently, as the `tar.gz` files are built using an `ubuntu:22.04` container, the `jamid.node` binary can only be executed on this operating system due to dependency issues. This limitation may be resolved in the future. However, for now, if you wish to deploy Jami, please ensure it is installed on an `ubuntu:22.04` machine.
If you still want to deploy Jami on your current OS, please see deployment using Docker containers.

To ensure the application runs correctly, please install the required dependencies.

`sudo apt-get update`

```bash
sudo apt install autoconf automake autopoint bison \
build-essential cmake curl git nasm pkg-config libnatpmp-dev \
libupnp-dev libhttp-parser-dev libsecp256k1-dev libx264-dev \
libspeex-dev libpipewire-0.3-0 libva-drm2 libvdpau-dev libva-x11-2 \
libfmt-dev libvpx-dev libyaml-cpp libspeexdsp-dev yasm npm -y
```

NodeJS version 22 is required

`curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh`
`sudo -E bash nodesource_setup.sh`
`sudo  apt-get  install -y nodejs`

You can verify the version installed using the following command
`node -v`

### User to manage the app

Add the user
`sudo useradd -m jamid`

Give the user the right to create files, modify and delete files in /opt
`sudo chgrp -R jamid /opt`

### Systemd service

Creating a systemd service is a good practice as it allows the application to be managed using systemd commands and ensures that it automatically starts on reboot. This simplifies service management and improves reliability.

`sudo touch /etc/systemd/system/jami-web.service`

```
sudo tee /etc/systemd/system/jami-web.service > /dev/null << EOF
[Service]
Type=simple
WorkingDirectory=/opt/jami-web/server
ExecStart=/usr/bin/node /opt/jami-web/server/dist/index.js
Restart=always
RestartSec=10
User=jamid
Group=jamid
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

Then reload the daemon
`sudo systemctl daemon-reload`

Enable the service
`sudo systemctl enable jami-web.service`

Start the service
`sudo systemctl start jami-web.service`

Give the right to the user to restart the service
`sudo visudo`

Then append this line
`jamid ALL=(ALL) NOPASSWD: /bin/systemctl restart jami-web.service`

### Nginx conf (reverse proxy)

Remember, this is just an example, and other configurations can work perfectly as long as the desired port (80 or 443) is properly redirected to the application's running port (8080). In this example, we use Nginx, but the same setup could be achieved with Apache2 or any reverse proxy of your choice.

`sudo touch /etc/nginx/site-available/jami-web.conf`

```
sudo tee /etc/nginx/site-available/jami-web.conf > /dev/null << EOF server {
    listen 80;
    server_name jami.example.com;

    location / {
        proxy_pass http://localhost:8080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/jami.example.com.access.log;
    error_log /var/log/nginx/jami.example.com.error.log;
}

server {
    listen 443 ssl;
    server_name jami.example.com;

    ssl_certificate /etc/ssl/certs/your_ssl_certificate.crt;
    ssl_certificate_key /etc/ssl/private/your_key.key;

    location / {
        proxy_pass http://localhost:8080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/jami.example.com.ssl.access.log;
    error_log /var/log/nginx/jami.example.com.ssl.error.log;
}
EOF
```

The application can be executed using a GitLab/GitHub runner or through a continuous deployment configuration. This setup will connect to the server, update the necessary files, and restart the server. Ensure that the `jamid` user has a defined home directory; otherwise, the application will be unable to store data.

> Running the app yourself without a continuous deployment configuration is not recommended

Alternatively, for a quick installation, you can run the `./install.sh` script, which will handle all the required steps automatically (except for the Nginx configuration).
