#!/bin/bash

# Add or remove a vhost ex. myapp.local. This will modify /etc/hosts

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;93m'
NC='\033[0m'

ETC_HOSTS=/etc/hosts
IP="127.0.0.1"

source ".docker/.env"
DOMAIN=$(echo "$DOMAIN")

echo -e "${BLUE}Add or remove in /etc/host ${DOMAIN} [a/r]: ${NC}"
read QUESTION

if [ ${QUESTION} == "a" ]; then

	HOSTS_LINE="$IP\t${DOMAIN}"

	if [ -n "$(grep ${DOMAIN} /etc/hosts)" ]; then
		echo -e ${YELLOW}"${DOMAIN} already exists: $(grep ${DOMAIN} $ETC_HOSTS) ${NC}"
	else
		echo -e ${GREEN}"Adding ${DOMAIN} to your $ETC_HOSTS ${NC}"
		sudo -- sh -c -e "echo '$HOSTS_LINE' >> /etc/hosts"

		if [ -n "$(grep ${DOMAIN} /etc/hosts)" ]; then
			echo -e ${GREEN}"${DOMAIN} was added succesfully \n $(grep ${DOMAIN} /etc/hosts) ${NC}"
		else
			echo -e ${RED}"Failed to Add ${DOMAIN}, Try again! ${NC}"
		fi
	fi

fi

if [ ${QUESTION} == "r" ]; then

	if [ -n "$(grep ${DOMAIN} /etc/hosts)" ]; then
		echo -e ${GREEN}"${DOMAIN} Found in your $ETC_HOSTS, Removing now... ${NC}"
		sudo sed -i".bak" "/${DOMAIN}/d" $ETC_HOSTS
	else
		echo -e ${RED}"${DOMAIN} was not found in your $ETC_HOSTS ${NC}"
	fi

fi
