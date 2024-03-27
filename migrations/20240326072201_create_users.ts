// src/migrations/20230324_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('slack_user_id').unique().notNullable();
    table.string('slack_team_id').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
