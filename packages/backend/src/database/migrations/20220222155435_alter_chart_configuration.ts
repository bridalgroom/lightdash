import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Add new chart type
    await knex('chart_types').insert({ chart_type: 'cartesian' });

    // Add new column for chart config and pivot config
    await knex.schema.alterTable('saved_queries_versions', (tableBuilder) => {
        tableBuilder.jsonb('chart_config').nullable();
        tableBuilder.specificType('pivot_dimensions', 'TEXT[]').nullable();
    });

    // Migrate configs for big_number and table
    await knex.raw(`
    UPDATE saved_queries_versions
    SET chart_config = '{}'::jsonb
    WHERE chart_type in ('big_number', 'table')`);

    // Migrate pivot_config, chart_type and chart_config for bar, line, scatter, column
    await knex.raw(`WITH updates AS (
        SELECT 
            saved_queries_version.id, 
            json_build_object(
                'series', (
                    CASE
                        WHEN sqv.x_dimension IS NULL THEN '[]'::jsonb
                        ELSE COALESCE((
                            select jsonb_agg(jsonb_build_object(
                                'type', 
                                    CASE
                                        WHEN sqv.chart_type in ('bar', 'column') THEN 'bar'
                                        ELSE sqv.chart_type
                                    END,
                                'yField', ym.field_name,
                                'xField', sqv.x_dimension,
                                'flipAxes', sqv.chart_type = 'bar'
                            )) 
                            from saved_queries_version_y_metrics ym 
                            where ym.saved_queries_version_id = sqv.saved_queries_version_id
                        ), '[]'::jsonb)
                    END
                )
            ) as chart_config
        FROM saved_queries_versions sqv
        WHERE chart_type not in ('big_number', 'table');
    ) 
    
    UPDATE saved_queries_versions sqv
    SET chart_type = 'cartesian',
        pivot_dimensions = (
            CASE 
                WHEN sqv.group_dimension is NULL THEN NULL
                ELSE ARRAY[sqv.group_dimension]::TEXT[] 
            END
        ),
        chart_config = updates.chart_config
    FROM updates
        ON sqv.saved_queries_version_id = updates.saved_queries_version_id
    WHERE chart_type not in ('big_number', 'table');
    `);

    // Delete unused y_metrics table
    await knex.schema.dropTableIfExists('saved_queries_version_y_metrics');

    // Delete unused saved_queries_versions columns
    await knex.schema.alterTable('saved_queries_versions', (tableBuilder) => {
        tableBuilder.dropColumn('x_dimension');
        tableBuilder.dropColumn('group_dimension');
    });

    // Drop unused types from chart_types
    await knex('chart_types')
        .whereIn('chart_type', ['bar', 'line', 'scatter', 'column'])
        .delete();
}

export async function down(knex: Knex): Promise<void> {
    throw new Error('Not implemented');
}
