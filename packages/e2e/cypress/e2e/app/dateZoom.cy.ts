import { SEED_PROJECT } from '@lightdash/common';

const apiUrl = '/api/v1';

const createChart = async (fieldX: string, fieldY: string) =>
    new Promise((resolve) => {
        cy.request({
            url: `${apiUrl}/projects/${SEED_PROJECT.project_uuid}/saved`,
            method: 'POST',
            body: {
                name: `Chart ${fieldX} x ${fieldY}`,
                description: ``,
                tableName: 'payments',
                metricQuery: {
                    dimensions: [fieldX],
                    metrics: [fieldY],
                    filters: {},
                    sorts: [
                        {
                            fieldId: fieldX,
                            descending: true,
                        },
                    ],
                    limit: 500,
                    tableCalculations: [],
                    additionalMetrics: [],
                    customDimensions: [],
                },
                chartConfig: {
                    type: 'cartesian',
                    config: {
                        layout: {
                            flipAxes: false,
                            xField: fieldX,
                            yField: [fieldY],
                        },
                        eChartsConfig: {
                            series: [
                                {
                                    encode: {
                                        xRef: { field: fieldX },
                                        yRef: {
                                            field: fieldY,
                                        },
                                    },
                                    type: 'bar',
                                    yAxisIndex: 0,
                                },
                            ],
                        },
                    },
                },
                tableConfig: {
                    columnOrder: [fieldX, fieldY],
                },
                pivotConfig: {
                    columns: [],
                },
            },
        }).then((r) => {
            expect(r.status).to.eq(200);
            resolve(r.body.results.uuid);
        });
    });

describe('Date zoom', () => {
    let dashboardUuid: string;
    beforeEach(() => {
        cy.login();
    });

    it('I can create a dashboard with date tiles', () => {
        createChart('orders_order_date_day', 'orders_total_order_amount').then(
            (chartUuid) => {
                cy.log('chartUuid', chartUuid);

                cy.request({
                    url: `${apiUrl}/projects/${SEED_PROJECT.project_uuid}/dashboards`,
                    method: 'POST',
                    body: {
                        name: 'zoom test',
                        description: '',
                        // spaceUuid: "e742b4be-163f-4db0-b4f9-584a0db50dbb",
                        tiles: [],
                    },
                }).then((r) => {
                    dashboardUuid = r.body.results.uuid;
                    cy.request({
                        url: `${apiUrl}/dashboards/${dashboardUuid}`,
                        method: 'PATCH',
                        body: {
                            tiles: [
                                {
                                    uuid: chartUuid,
                                    type: 'saved_chart',
                                    properties: {
                                        belongsToDashboard: false,
                                        savedChartUuid: chartUuid,
                                        chartName: 'test',
                                    },
                                    h: 9,
                                    w: 15,
                                    x: 0,
                                    y: 0,
                                },
                            ],
                            filters: {
                                dimensions: [],
                                metrics: [],
                                tableCalculations: [],
                            },
                            name: 'zoom test',
                        },
                    });
                });
            },
        );
    });

    it('I can use date zoom', () => {
        // This barSelector will select all the blue bars in the chart
        const barSelector = 'path[fill="#5470c6"]';
        cy.visit(
            `/projects/${SEED_PROJECT.project_uuid}/dashboards/${dashboardUuid}`,
        );

        cy.contains('Total order amount');
        // Wait until the chart appears
        // Count how many bars appear in the chart
        cy.get(barSelector).should('have.length', 69); // default chart time frame is day

        cy.contains('Date Zoom').click();
        cy.contains('Month').click();
        cy.get(barSelector).should('have.length', 4);

        cy.contains('Date Zoom').click();
        cy.contains('Day').click();
        cy.get(barSelector).should('have.length', 69);

        cy.contains('Date Zoom').click();
        cy.contains('Week').click();
        cy.get(barSelector).should('have.length', 15);

        cy.contains('Date Zoom').click();
        cy.contains('Quarter').click();
        cy.get(barSelector).should('have.length', 2);

        cy.contains('Date Zoom').click();
        cy.contains('Year').click();
        cy.get(barSelector).should('have.length', 1);

        cy.contains('Date Zoom').click();
        cy.contains('Default').click();
        cy.get(barSelector).should('have.length', 69); // back to default (day)
    });
});
