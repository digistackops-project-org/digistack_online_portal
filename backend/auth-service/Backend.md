## Launch EC2 "t2.micro" Instance and In Sg, Open port "5000" for Python Application 
# Backend-Node.js Application server

## Install Node and NPM
```
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 16
```
### Check Node Version
```
node -v
npm -v
```
### Install Git
```
sudo yum install git -y
```
## Get the Code
```
sudo mkdir /apps
cd /apps
sudo git clone https://github.com/digistackops-project-org/digistack_online_portal.git
cd digistack_online_portal
sudo git checkout 00-V1-Admin_portal_Login
sudo chown -R ec2-user:ec2-user /apps/digistack_online_portal
```
```
cd backend/auth-service
```
## Setup your Application Database by executing "initdb.sql" script from Application-server

Step:1 ==> install "POstgresql-Client" for communicate with POstgresql Database
```
sudo dnf update -y
sudo dnf install -y postgresql16
```
Step:2 ==> Execute your "init.sql" script for your Application DB setup

```
PGPASSWORD="Admin@123" psql -h <DB-Private-IP> -U dbadmin -d postgres -f initdb.sql
```
## Add .env for DB Credentials 
```
sudo vim .env
```
```
# ================================================
# auth-service/.env.example
# Copy to .env for local dev. NEVER commit .env
# ================================================

NODE_ENV=development
PORT=4001

# PostgreSQL
DB_HOST=<DB-Private-IP>
DB_PORT=5432
DB_NAME=<DB-Name>
DB_USER=<DB-User>
DB_PASSWORD=<DB-Password>
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000

# JWT
# To get the JWT need to run these command ==> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# first one is "JWT_SECRET"
# Second one is "JWT_REFRESH_SECRET"
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_change_in_prod
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=your_refresh_secret_change_in_prod
JWT_REFRESH_EXPIRES_IN=7d

# CORS
# If we use Nginc Reverse Proxy in Ec2 frontend then no need these --> ALLOWED_ORIGINS=...
# If you are using ALB or DNS for Frontend then --> ALLOWED_ORIGINS=http://yourdomain.com
ALLOWED_ORIGINS=http://<Frontend-Public-IP>:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

## Install Dependencies
```
npm install
```

## Start the App
```
npm start
```
HERE it is not recommend in Production, so we follow the HA in Production

Start Backend Application
```
npm install -g pm2
```
To run these Backend Application up and Running we use Pm2 service
```
pm2 start app.js --name auth-service
```
<img width="1089" height="110" alt="image" src="https://github.com/user-attachments/assets/4acd9488-9434-4dc3-86a1-c598bd6658c0" />

To list all pm2 Services
```
pm2 list
```
To stop these pm2 service
```
pm2 stop auth-service
```
<img width="1105" height="127" alt="image" src="https://github.com/user-attachments/assets/a584378a-fb91-4911-8112-51cf7e49ab0e" />

To delete these pm2 service
```
pm2 delete auth-service
```

