CREATE USER akvo WITH CREATEDB PASSWORD 'password';

CREATE DATABASE "kenya"
WITH OWNER = akvo
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';

\c kenya

CREATE DATABASE "burkina-faso"
WITH OWNER = akvo
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';

\c burkina-faso

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
