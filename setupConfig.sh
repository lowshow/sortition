#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

[[ -d "$HOME/.sortition" ]] || mkdir "$HOME/.sortition"

USER="$(whoami)"
echo "You are $USER"

CURR_PATH=$(pwd)
echo "Your path $CURR_PATH"

[[ -d config ]] || mkdir config

read -rp "Nginx port >> " PORT
read -rp "Service hostname >> " HOSTNAME
read -rp "Additional hostnames >> " ADDITIONAL_HOSTNAMES
read -rp "Sortition port >> " SORTITION_PORT

sed -e "s@{{port}}@$PORT@g" \
    -e "s@{{server_name}}@$HOSTNAME $ADDITIONAL_HOSTNAMES@g" \
    -e "s@{{project_path}}@$CURR_PATH@g" \
    -e "s@{{sortition_port}}@$SORTITION_PORT@g" \
    templates/sortition_nginx.conf.template > config/sortition_nginx.conf

sed -e "s@{{user}}@$USER@g" \
    -e "s@{{path}}@$CURR_PATH@g" \
    -e "s@{{sortition_port}}@$SORTITION_PORT@g" \
    templates/sortition_server.service.template > config/sortition_server.service

# Symlink the nginx conf file
sudo ln -s "$CURR_PATH/config/sortition_nginx.conf" \
    "/etc/nginx/sites-enabled/"

# Restart nginx to enable conf file
sudo service nginx restart

# Create a system entry for the service
sudo cp "$CURR_PATH/config/sortition_server.service" \
    "/etc/systemd/system/sortition_server.service"

# Run the service
sudo systemctl start sortition_server
sudo systemctl enable sortition_server
