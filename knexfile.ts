// knexfile.ts
import { Knex } from 'knex';

// Define Knex configuration for your database
const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      database: 'devfit',
      user: 'postgres',
      password: 'mysecretpassword',
      host: 'localhost',
      port: 5432,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
  },
};

export default config;
