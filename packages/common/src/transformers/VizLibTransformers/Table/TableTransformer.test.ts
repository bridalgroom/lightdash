import { ExplorerResultsTransformer } from '../../ResultTransformers';
import { VizConfigTransformerFactory } from '../../VizConfigTransformers';
import { results, TableVizConfig } from '../LibTransformer.mock';
import { VizLibTransformerFactory } from '../VizLibTransformerFactory';

describe('TableTransformer', () => {
    it('should return a valid table config', async () => {
        const resultsTransformer = new ExplorerResultsTransformer({
            data: results,
        });

        const vizConfigTransformer =
            VizConfigTransformerFactory.createVizConfigTransformer({
                vizConfig: TableVizConfig,
                resultsTransformer,
            });

        const vizLib = VizLibTransformerFactory.createVizLibTransformer({
            vizConfigTransformer,
        });

        expect(vizLib.getConfig()).toEqual({
            columns: [
                {
                    fieldId: 'orders_status',
                    frozen: false,
                    visible: true,
                    name: 'Orders Status',
                },
                {
                    fieldId: 'orders_order_date_week',
                    frozen: false,
                    visible: true,
                    name: 'Orders Order Date Week',
                },
                {
                    fieldId: 'orders_average_order_size',
                    frozen: false,
                    visible: true,
                    name: 'Orders Average Order Size',
                },
            ],
            rows: [
                {
                    orders_average_order_size: {
                        value: {
                            formatted: '5',
                            raw: 5,
                        },
                    },
                    orders_order_date_week: {
                        value: {
                            formatted: '1',
                            raw: 1,
                        },
                    },
                    orders_status: {
                        value: {
                            formatted: 'Completed',
                            raw: 'completed',
                        },
                    },
                },
                {
                    orders_average_order_size: {
                        value: {
                            formatted: '7',
                            raw: 7,
                        },
                    },
                    orders_order_date_week: {
                        value: {
                            formatted: '3',
                            raw: 3,
                        },
                    },
                    orders_status: {
                        value: {
                            formatted: 'Incomplete',
                            raw: 'incomplete',
                        },
                    },
                },
            ],
        });
    });
});
