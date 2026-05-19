"# Test Credentials — Local Connect

## Admin
- Email: `admin@localconnect.in`
- Password: `admin123`
- Role: `admin`

## Test Customer (create via /api/auth/register)
- Email: `customer@test.com`
- Password: `password123`
- Role: `customer`

## Test Seller (register, then POST /api/sellers/apply, then admin approves)
- Email: `seller@test.com`
- Password: `password123`
- Role: `seller`

## Auth endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh
- PUT  /api/auth/me

Auth uses httpOnly cookies (`access_token`, `refresh_token`). Frontend uses `withCredentials: true`.
"