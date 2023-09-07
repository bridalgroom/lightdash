import { ForbiddenError, UserAttribute } from '@lightdash/common';
import {
    assertValidDimensionRequiredAttribute,
    buildQuery,
    replaceUserAttributes,
} from './queryBuilder';
import {
    bigqueryClientMock,
    COMPILED_DIMENSION,
    EXPLORE,
    EXPLORE_BIGQUERY,
    EXPLORE_JOIN_CHAIN,
    EXPLORE_WITH_SQL_FILTER,
    METRIC_QUERY,
    METRIC_QUERY_JOIN_CHAIN,
    METRIC_QUERY_JOIN_CHAIN_SQL,
    METRIC_QUERY_SQL,
    METRIC_QUERY_SQL_BIGQUERY,
    METRIC_QUERY_TWO_TABLES,
    METRIC_QUERY_TWO_TABLES_SQL,
    METRIC_QUERY_WITH_ADDITIONAL_METRIC,
    METRIC_QUERY_WITH_ADDITIONAL_METRIC_SQL,
    METRIC_QUERY_WITH_DISABLED_FILTER,
    METRIC_QUERY_WITH_DISABLED_FILTER_SQL,
    METRIC_QUERY_WITH_EMPTY_FILTER,
    METRIC_QUERY_WITH_EMPTY_FILTER_GROUPS,
    METRIC_QUERY_WITH_EMPTY_FILTER_SQL,
    METRIC_QUERY_WITH_EMPTY_METRIC_FILTER,
    METRIC_QUERY_WITH_EMPTY_METRIC_FILTER_SQL,
    METRIC_QUERY_WITH_FILTER,
    METRIC_QUERY_WITH_FILTER_AND_DISABLED_FILTER,
    METRIC_QUERY_WITH_FILTER_OR_OPERATOR,
    METRIC_QUERY_WITH_FILTER_OR_OPERATOR_SQL,
    METRIC_QUERY_WITH_FILTER_SQL,
    METRIC_QUERY_WITH_METRIC_DISABLED_FILTER_THAT_REFERENCES_JOINED_TABLE_DIM,
    METRIC_QUERY_WITH_METRIC_DISABLED_FILTER_THAT_REFERENCES_JOINED_TABLE_DIM_SQL,
    METRIC_QUERY_WITH_METRIC_FILTER,
    METRIC_QUERY_WITH_METRIC_FILTER_AND_ONE_DISABLED_SQL,
    METRIC_QUERY_WITH_METRIC_FILTER_SQL,
    METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS,
    METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS_SQL,
    METRIC_QUERY_WITH_NESTED_METRIC_FILTERS,
    METRIC_QUERY_WITH_NESTED_METRIC_FILTERS_SQL,
    METRIC_QUERY_WITH_SQL_FILTER,
    METRIC_QUERY_WITH_TABLE_REFERENCE,
    METRIC_QUERY_WITH_TABLE_REFERENCE_SQL,
    warehouseClientMock,
} from './queryBuilder.mock';

describe('Query builder', () => {
    test('Should build simple metric query', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL);
    });

    test('Should build simple metric query in BigQuery', () => {
        expect(
            buildQuery({
                explore: EXPLORE_BIGQUERY,
                compiledMetricQuery: METRIC_QUERY,
                warehouseClient: bigqueryClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL_BIGQUERY);
    });

    test('Should build metric query across two tables', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_TWO_TABLES,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_TWO_TABLES_SQL);
    });

    test('Should build metric query where a field references another table', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_TABLE_REFERENCE,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_TABLE_REFERENCE_SQL);
    });

    test('Should join table from filter dimension', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_FILTER_SQL);
    });

    test('should join chain of intermediary tables', () => {
        expect(
            buildQuery({
                explore: EXPLORE_JOIN_CHAIN,
                compiledMetricQuery: METRIC_QUERY_JOIN_CHAIN,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_JOIN_CHAIN_SQL);
    });

    test('Should build query with filter OR operator', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_FILTER_OR_OPERATOR,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_FILTER_OR_OPERATOR_SQL);
    });

    test('Should build query with disabled filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_DISABLED_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_DISABLED_FILTER_SQL);
    });

    test('Should build query with a filter and one disabled filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery:
                    METRIC_QUERY_WITH_FILTER_AND_DISABLED_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_METRIC_FILTER_AND_ONE_DISABLED_SQL);
    });

    test('Should build query with nested filter operators', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_NESTED_FILTER_OPERATORS_SQL);
    });

    test('Should build query with no filter when there are only empty filter groups ', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_FILTER_GROUPS,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_SQL);
    });

    test('Should build second query with metric filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_METRIC_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_METRIC_FILTER_SQL);
    });

    test('Should build query with metric filter (where filter is disabled) and metric references a dimension from a joined table', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery:
                    METRIC_QUERY_WITH_METRIC_DISABLED_FILTER_THAT_REFERENCES_JOINED_TABLE_DIM,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(
            METRIC_QUERY_WITH_METRIC_DISABLED_FILTER_THAT_REFERENCES_JOINED_TABLE_DIM_SQL,
        );
    });

    test('Should build second query with nested metric filters', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_NESTED_METRIC_FILTERS,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_NESTED_METRIC_FILTERS_SQL);
    });

    test('Should build query with additional metric', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_ADDITIONAL_METRIC,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_ADDITIONAL_METRIC_SQL);
    });

    test('Should build query with empty filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_EMPTY_FILTER_SQL);
    });

    test('Should build query with empty metric filter', () => {
        expect(
            buildQuery({
                explore: EXPLORE,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_METRIC_FILTER,
                warehouseClient: warehouseClientMock,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_EMPTY_METRIC_FILTER_SQL);
    });

    test('Should throw error if user attributes are missing', () => {
        expect(
            () =>
                buildQuery({
                    explore: EXPLORE_WITH_SQL_FILTER,
                    compiledMetricQuery: METRIC_QUERY,
                    warehouseClient: warehouseClientMock,
                    userAttributes: [],
                }).query,
        ).toThrowError(ForbiddenError);
    });

    test('Should replace user attributes from sql filter', () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'country',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: null,
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: 'EU',
                    },
                ],
            },
        ];
        expect(
            buildQuery({
                explore: EXPLORE_WITH_SQL_FILTER,
                compiledMetricQuery: METRIC_QUERY_WITH_EMPTY_METRIC_FILTER,
                warehouseClient: warehouseClientMock,
                userAttributes,
            }).query,
        ).toStrictEqual(METRIC_QUERY_WITH_SQL_FILTER);
    });
});

describe('replaceUserAttributes', () => {
    it('method with no user attribute should return same sqlFilter', async () => {
        expect(replaceUserAttributes('${dimension} > 1', [])).toEqual(
            '${dimension} > 1',
        );
        expect(replaceUserAttributes('${table.dimension} = 1', [])).toEqual(
            '${table.dimension} = 1',
        );
        expect(
            replaceUserAttributes('${dimension} = ${TABLE}.dimension', []),
        ).toEqual('${dimension} = ${TABLE}.dimension');
    });

    it('method with missing user attribute should throw error', async () => {
        expect(() =>
            replaceUserAttributes('${lightdash.attribute.test} > 1', []),
        ).toThrowError(ForbiddenError);

        expect(() =>
            replaceUserAttributes('${ld.attr.test} > 1', []),
        ).toThrowError(ForbiddenError);
    });

    it('method should replace sqlFilter with user attribute', async () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'test',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: null,
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: '1',
                    },
                ],
            },
        ];
        const expected = "'1' > 1";

        expect(
            replaceUserAttributes(
                '${lightdash.attribute.test} > 1',
                userAttributes,
            ),
        ).toEqual(expected);

        expect(
            replaceUserAttributes('${ld.attr.test} > 1', userAttributes),
        ).toEqual(expected);
    });

    it('method should replace sqlFilter with multiple user attributes', async () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'test',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: null,
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: '1',
                    },
                ],
            },
            {
                uuid: '',
                name: 'another',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: null,
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: '2',
                    },
                ],
            },
        ];
        const sqlFilter =
            '${dimension} IS NOT NULL OR (${lightdash.attribute.test} > 1 AND ${lightdash.attribute.another} = 2)';
        const expected = "${dimension} IS NOT NULL OR ('1' > 1 AND '2' = 2)";
        expect(replaceUserAttributes(sqlFilter, userAttributes)).toEqual(
            expected,
        );
    });

    it('method should replace sqlFilter using short aliases', async () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'test',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: null,
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: '1',
                    },
                ],
            },
        ];
        const expected = "'1' > 1";
        expect(
            replaceUserAttributes('${ld.attribute.test} > 1', userAttributes),
        ).toEqual(expected);
        expect(
            replaceUserAttributes('${lightdash.attr.test} > 1', userAttributes),
        ).toEqual(expected);
        expect(
            replaceUserAttributes('${ld.attr.test} > 1', userAttributes),
        ).toEqual(expected);

        expect(
            replaceUserAttributes(
                '${lightdash.attributes.test} > 1',
                userAttributes,
            ),
        ).toEqual(expected);
    });

    it('method should not replace any invalid attribute', async () => {
        expect(replaceUserAttributes('${lightdash.foo.test} > 1', [])).toEqual(
            '${lightdash.foo.test} > 1',
        );
    });

    it('method should replace sqlFilter with user value before default', async () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'test',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: 'default_value',
                users: [
                    {
                        userUuid: '',
                        email: '',
                        value: '1',
                    },
                ],
            },
        ];
        const expected = "'1' > 1";

        expect(
            replaceUserAttributes(
                '${lightdash.attribute.test} > 1',
                userAttributes,
            ),
        ).toEqual(expected);

        expect(
            replaceUserAttributes('${ld.attr.test} > 1', userAttributes),
        ).toEqual(expected);
    });

    it('method should replace sqlFilter with default value if user value is not available', async () => {
        const userAttributes: UserAttribute[] = [
            {
                uuid: '',
                name: 'test',
                createdAt: new Date(),
                organizationUuid: '',
                attributeDefault: 'default_value',
                users: [],
            },
        ];
        const expected = "'default_value' > 1";

        expect(
            replaceUserAttributes(
                '${lightdash.attribute.test} > 1',
                userAttributes,
            ),
        ).toEqual(expected);

        expect(
            replaceUserAttributes('${ld.attr.test} > 1', userAttributes),
        ).toEqual(expected);
    });
});

describe('assertValidDimensionRequiredAttribute', () => {
    it('should not throw errors if no user attributes are required', async () => {
        const result = assertValidDimensionRequiredAttribute(
            COMPILED_DIMENSION,
            [],
            '',
        );

        expect(result).toBeUndefined();
    });

    it('should throw errors if required attributes are required and user attributes are missing', async () => {
        expect(() =>
            assertValidDimensionRequiredAttribute(
                {
                    ...COMPILED_DIMENSION,
                    requiredAttributes: {
                        is_admin: 'true',
                    },
                },
                [],
                '',
            ),
        ).toThrowError(ForbiddenError);

        expect(() =>
            assertValidDimensionRequiredAttribute(
                {
                    ...COMPILED_DIMENSION,
                    requiredAttributes: {
                        is_admin: 'true',
                    },
                },
                [
                    {
                        uuid: '',
                        name: 'is_admin',
                        createdAt: new Date(),
                        organizationUuid: '',
                        attributeDefault: null,
                        users: [
                            {
                                userUuid: '',
                                email: '',
                                value: 'false',
                            },
                        ],
                    },
                ],
                '',
            ),
        ).toThrowError(ForbiddenError);
    });

    it('should not throw errors if required attributes are required and user attributes exist', async () => {
        const result = assertValidDimensionRequiredAttribute(
            {
                ...COMPILED_DIMENSION,
                requiredAttributes: {
                    is_admin: 'true',
                },
            },
            [
                {
                    uuid: '',
                    name: 'is_admin',
                    createdAt: new Date(),
                    organizationUuid: '',
                    attributeDefault: null,
                    users: [
                        {
                            userUuid: '',
                            email: '',
                            value: 'true',
                        },
                    ],
                },
            ],
            '',
        );

        expect(result).toBeUndefined();
    });
});
