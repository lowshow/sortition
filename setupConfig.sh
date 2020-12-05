#!/bin/bash

# Prevent running in case of failures
set -euf -o pipefail

[[ -d "$HOME/.sortition" ]] || mkdir "$HOME/.sortition"

USER="$(whoami)"
echo "You are $USER"

CURR_PATH=$(pwd)
echo "Your path $CURR_PATH"

[[ -d config ]] || mkdir config

CONFIG_PATH="config/template_gen"

if [[ -f "$CONFIG_PATH" ]]; then

    source "$CONFIG_PATH"

fi

PORT=${PORT:-"8000"}
read -rp "Nginx port ($PORT) >> " PORT_INPUT
PORT=${PORT_INPUT:-"$PORT"}

NGINX_HOSTNAME=${NGINX_HOSTNAME:-"127.0.0.1"}
read -rp "Service hostname ($NGINX_HOSTNAME) >> " NGINX_HOSTNAME_INPUT
NGINX_HOSTNAME=${NGINX_HOSTNAME_INPUT:-"$NGINX_HOSTNAME"}

ADDITIONAL_NGINX_HOSTNAMES=${ADDITIONAL_NGINX_HOSTNAMES:-""}
read -rp "Additional hostnames ($ADDITIONAL_NGINX_HOSTNAMES) >> " ADDITIONAL_NGINX_HOSTNAMES_INPUT
ADDITIONAL_NGINX_HOSTNAMES=${ADDITIONAL_NGINX_HOSTNAMES_INPUT:-"$ADDITIONAL_NGINX_HOSTNAMES"}

SORTITION_PORT=${SORTITION_PORT:-"8001"}
read -rp "Sortition port ($SORTITION_PORT) >> " SORTITION_PORT_INPUT
SORTITION_PORT=${SORTITION_PORT_INPUT:-"$SORTITION_PORT"}

cat << EOF > "$CONFIG_PATH"
PORT="$PORT"
NGINX_HOSTNAME="$NGINX_HOSTNAME"
ADDITIONAL_NGINX_HOSTNAMES="$ADDITIONAL_NGINX_HOSTNAMES"
SORTITION_PORT="$SORTITION_PORT"
EOF

sed -e "s@{{port}}@$PORT@g" \
    -e "s@{{server_name}}@$NGINX_HOSTNAME $ADDITIONAL_NGINX_HOSTNAMES@g" \
    -e "s@{{project_path}}@$CURR_PATH@g" \
    -e "s@{{sortition_port}}@$SORTITION_PORT@g" \
    templates/sortition_nginx.conf.template > config/sortition_nginx.conf

sed -e "s@{{user}}@$USER@g" \
    -e "s@{{path}}@$CURR_PATH@g" \
    -e "s@{{sortition_port}}@$SORTITION_PORT@g" \
    templates/sortition_server.service.template > config/sortition_server.service

ENV=${1:-"prod"}

if [[ "$ENV" == "dev" ]]; then

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then

        if [[ -f "/etc/nginx/sites-enabled/sortition_nginx.conf" ]]; then

            sudo rm "/etc/nginx/sites-enabled/sortition_nginx.conf"

        fi
        
        # Symlink the nginx conf file
        sudo ln -s "$CURR_PATH/config/sortition_nginx.conf" \
            "/etc/nginx/sites-enabled/"

        # Restart nginx to enable conf file
        sudo service nginx restart

    elif [[ "$OSTYPE" == "darwin"* ]]; then

        if [[ -f "/usr/local/etc/nginx/servers/sortition_nginx.conf" ]]; then

            rm "/usr/local/etc/nginx/servers/sortition_nginx.conf"

        fi

        # Symlink the nginx conf file
        ln -s "$CURR_PATH/config/sortition_nginx.conf" \
            "/usr/local/etc/nginx/servers/"

        # Restart nginx to enable conf file
        brew services restart nginx

    else
    
        echo "Unknown OS"
    
    fi

elif [[ "$ENV" == "prod" ]]; then

    if [[ -f "/etc/nginx/sites-enabled/sortition_nginx.conf" ]]; then

        sudo rm "/etc/nginx/sites-enabled/sortition_nginx.conf"

    fi
    
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

else
    
    echo "Unknown arg: $ENV"

fi