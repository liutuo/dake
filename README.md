DaKe script
===

## Installation
sudo npm install pm2@latest -g
npm install 

## Execution
pm2 start dake.js -- [username] [password]

pm2 save

pm2 startup
-> run the prompted command

## Check Status
pm2 list

## Check Log
pm2 logs