#!/bin/sh
# Runs once on first container start. Creates the two application roles and the dev/test databases.
#   dairy_owner : owns the schema, runs migrations. Not a superuser, cannot bypass RLS by default.
#   dairy_app   : used by the API/worker at runtime. NOSUPERUSER NOBYPASSRLS, so RLS always applies (docs/01 section 3).
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_pw="$DB_OWNER_PASSWORD" -v app_pw="$DB_APP_PASSWORD" <<'SQL'
CREATE ROLE dairy_owner LOGIN PASSWORD :'owner_pw' NOSUPERUSER NOBYPASSRLS CREATEDB;
CREATE ROLE dairy_app   LOGIN PASSWORD :'app_pw'   NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
CREATE DATABASE dairy_dev  OWNER dairy_owner;
CREATE DATABASE dairy_test OWNER dairy_owner;
SQL

for db in dairy_dev dairy_test; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" -v dbname="$db" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
REVOKE ALL ON DATABASE :"dbname" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"dbname" TO dairy_owner, dairy_app;
SQL
done
