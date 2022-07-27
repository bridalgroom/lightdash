import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable('openid_identities')) {
        await knex.schema.alterTable('openid_identities', (tableBuilder) => {
            tableBuilder.dropForeign('issuer');
        });
    }
    await knex.schema.dropTableIfExists('openid_issuers');
}

export async function down(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable('openid_issuers'))) {
        await knex.schema.createTable('openid_issuers', (tableBuilder) => {
            tableBuilder.text('issuer').primary();
        });
        await knex('openid_issuers').insert({
            issuer: 'https://accounts.google.com',
        });
    }
    if (await knex.schema.hasTable('openid_identities')) {
        await knex.schema.alterTable('openid_identities', (tableBuilder) => {
            tableBuilder
                .text('issuer')
                .notNullable()
                .references('issuer')
                .inTable('openid_issuers')
                .alter();
        });
    }
}
