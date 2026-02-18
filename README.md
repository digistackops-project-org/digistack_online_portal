# Here is the Architecture Diagram for V1-Admin Portal
<img width="1097" height="381" alt="image" src="https://github.com/user-attachments/assets/d72bc87f-7202-47eb-a911-f3da7d9f3493" />

<img width="1099" height="576" alt="image" src="https://github.com/user-attachments/assets/b9aeda1a-d6c6-455d-9181-d8381452dbef" />



# What we do from Db side
```
1. Install and setup PostgreSQl
2. Create Database "EmployeeDB" and under that create Table "employee"
```
### Problem HERE
We Manually create DB and Tables that lead human error like forget to create Tables so that you app is down

### Solution
so we use Tool "📖 **[Liquibase](Liquibase.md)** — To know more about It

#### Steup DB
To setup DB "📖 **[DB Setup](Liquibase.md)**

# What we do in Backend side

This Admin portal is Microservice Application but for Version V1 we deploy only Auth service

## What this Auth service DO
We use NodeJS for Backend Auth Service
```
1. While user login to Admin portal from frontend -> auth servive -> will check the employee Table and check user exist or Not
2. While user Signup to Admin portal from frontend -> auth servive -> will update user info into employee table
```
#### Steup Backend
To setup Backend "📖 **[Backend Setup](Liquibase.md)**

# What we do in Frontend side
We use React for Frontend UI

#### Steup Backend
To setup Frontend "📖 **[Frontend Setup](Liquibase.md)**
