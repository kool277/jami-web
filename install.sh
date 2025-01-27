#!/bin/sh
# Default installation on a debian based system

# Warning: This script requires root privileges to
# install dependencies and configure the service/user.

# ===========Installing dependencies===============

echo "Installing dependencies…\n"

sudo apt-get update
sudo apt install autoconf automake autopoint bison libsecp256k1-1 build-essential cmake curl git nasm pkg-config yasm nodejs npm -y

npm install -g node-gyp
npm install

# ===========Setting up the application =============

echo "\nSetting up the service…"
sudo cp jami-web.service /etc/systemd/system/jami-web.service

cd ..
sudo mv jami-web-production /opt/jami-web

sudo useradd -m -d /opt/jami-web/data jamid

sudo chown -R jamid:jamid /opt/jami-web

sudo systemctl daemon-reload
sudo systemctl enable jami-web.service
sudo systemctl start jami-web.service

echo "\nInstallation successfully completed!"
echo "Jami Web is now active and running on port 8080 on the system."