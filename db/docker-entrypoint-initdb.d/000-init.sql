CREATE USER akvo WITH CREATEDB PASSWORD 'password';

CREATE DATABASE "nwmis-kenya"
WITH OWNER = akvo
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';

\c nwmis-kenya

CREATE DATABASE "nwmis-burkina-faso"
WITH OWNER = akvo
     TEMPLATE = template0
     ENCODING = 'UTF8'
     LC_COLLATE = 'en_US.UTF-8'
     LC_CTYPE = 'en_US.UTF-8';

\c nwmis-burkina-faso

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
