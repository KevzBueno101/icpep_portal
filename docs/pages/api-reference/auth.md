---
title: Auth API
description: Authentication and user management endpoints
---

# Auth API

Base path: `/api/auth/`

## Register

```bash
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "contact_number": "09171234567",
  "school": "University of Example",
  "course": "BSIT",
  "year": "3rd Year",
  "address": "123 Main St",
  "payment_method": "gcash"
}
```

**Response** `201 Created`:
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "PENDING",
  "message": "Registration successful. Awaiting admin approval."
}
```

## Login

```bash
POST /api/auth/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`:
```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi...",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "member",
    "status": "APPROVED"
  }
}
```

## Admin Login

```bash
POST /api/auth/admin-login/
Content-Type: application/json

{
  "username": "admin",
  "password": "adminpassword"
}
```

**Response** `200 OK`:
```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@icpep.org",
    "role": "admin",
    "access_level": "FULL_CONTROL"
  }
}
```

## Refresh Token

```bash
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

**Response** `200 OK`:
```json
{
  "access": "eyJ0eXAiOiJKV1Qi..."
}
```

## Get Current User

```bash
GET /api/auth/me/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "member",
  "status": "APPROVED",
  "member_profile": {
    "school": "University of Example",
    "course": "BSIT",
    "year": "3rd Year",
    "contact_number": "09171234567",
    "payment_method": "gcash"
  }
}
```

## Check Availability

```bash
POST /api/auth/availability/
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response** `200 OK`:
```json
{
  "email_available": false
}
```

## Forgot Password

```bash
POST /api/auth/forgot-password/
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response** `200 OK`:
```json
{
  "message": "Password reset link sent to your email."
}
```

## Reset Password

```bash
POST /api/auth/reset-password/
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response** `200 OK`:
```json
{
  "message": "Password reset successful."
}
```
