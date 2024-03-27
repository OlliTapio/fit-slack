import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pushup_records', (table) => {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.date('date').notNullable();
    table.integer('count').notNullable();
    // Add other fields as needed
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('pushup_records');
}
