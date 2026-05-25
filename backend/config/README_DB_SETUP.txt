DB connection troubleshooting (local dev)

Symptom:
  password authentication failed for user "kevin"

Cause:
  backend/.env DB_PASSWORD does not match the actual Postgres password for DB_USER.

Steps:
  1) Open backend/.env
       DB_USER=kevin
       DB_PASSWORD=... (must match Postgres)

  2) Rerun migrations from backend/:
       python manage.py migrate

Notes:
  - If you do not know the correct Postgres password, either:
      a) change the DB_PASSWORD in backend/.env to match the database, or
      b) reset the Postgres password for user kevin.

