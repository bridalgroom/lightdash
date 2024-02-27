import { Knex } from 'knex';

export function getFullTextSearchRankCalcSql(
    database: Knex,
    tableName: string,
    searchVectorColumnName: string,
    query: string,
) {
    return database.raw(
        `ROUND(
            ts_rank_cd(
                ${tableName}.${searchVectorColumnName},
                websearch_to_tsquery('lightdash_english_config', ?),
                32
            )::numeric,
            6
        )::float`,
        [query],
    );
}
