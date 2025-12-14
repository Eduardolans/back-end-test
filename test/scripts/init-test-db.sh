#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE vehicle_registry_test;
    GRANT ALL PRIVILEGES ON DATABASE vehicle_registry_test TO postgres;
EOSQL

echo "✅ Test database 'vehicle_registry_test' created successfully"
