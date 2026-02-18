# Backend-Node.js Auth Service
### Launch EC2 "t2.micro" Instance and In Sg, Open port "4001" for NodeJS Auth service Application 
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

#### Step:1 ==> install "POstgresql-Client" for communicate with POstgresql Database
```
sudo dnf update -y
sudo dnf install -y postgresql16
```
#### Step:2 ==> Execute your "init.sql" script for your Application DB setup

```
PGPASSWORD="Admin@123" psql -h <DB-Private-IP> -U dbadmin -d postgres -f /apps/digistack_online_portal/db/seeds/00_create_database.sql
```
#### Step:3 ==> Create Tables using LiquiBase Db versioning Tool
##### Install LiquiBase Tool
###### Step:1 -> install JAVA Tool
```
sudo apt install -y default-jdk
```
###### Step:2 -> Download Liquibase
```
sudo wget https://github.com/liquibase/liquibase/releases/download/v4.27.0/liquibase-4.27.0.tar.gz
sudo tar xzf liquibase-4.27.0.tar.gz -C /opt/liquibase
sudo ln -s /opt/liquibase/liquibase /usr/local/bin/liquibase
```
###### Step:3 -> Download PostgreSQL JDBC driver for Liquibase
```
sudo wget https://jdbc.postgresql.org/download/postgresql-42.7.3.jar -O /opt/liquibase/lib/postgresql.jar
```
##### Run  LiquiBase Migration
```
cd db
```
```
sudo liquibase \
  --url="jdbc:postgresql://<DB-Private-IP>:5432/<DB-Name>" \
  --username=<DB-Username> \
  --password=<DB-Password> \
  --changeLogFile=/apps/digistack_online_portal/db/migrations/db.changelog-master.xml \
  update
```
## Add .env for DB Credentials 
```
cd /apps/digistack_online_portal/backend/auth-service
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
sudo npm install -g pm2
```
To run these Backend Application up and Running we use Pm2 service
```
sudo pm2 start server.js --name auth-service
```
<img width="1089" height="110" alt="image" src="https://github.com/user-attachments/assets/4acd9488-9434-4dc3-86a1-c598bd6658c0" />

To list all pm2 Services
```
sudo pm2 list
```
To stop these pm2 service
```
sudo pm2 stop auth-service
```
<img width="1105" height="127" alt="image" src="https://github.com/user-attachments/assets/a584378a-fb91-4911-8112-51cf7e49ab0e" />

To delete these pm2 service
```
sudo pm2 delete auth-service
```

