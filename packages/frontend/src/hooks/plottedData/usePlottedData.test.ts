import { getPivotedData } from './usePlottedData';
import {
    EXPECTED_PIVOT_ON_ITSELF_RESULTS,
    EXPECTED_PIVOT_RESULTS_WITH_ALL_DIMENSIONS,
    EXPECTED_PIVOT_RESULTS_WITH_SAME_FIELD_PIVOTED_AND_NON_PIVOTED,
    EXPECTED_PIVOT_RESULTS_WITH_SOME_DIMENSIONS,
    EXPECTED_SIMPLE_PIVOT_RESULTS,
    RESULTS_FOR_PIVOT_ON_ITSELF,
    RESULTS_FOR_PIVOT_WITH_MULTIPLE_DIMENSIONS,
    RESULTS_FOR_SIMPLE_PIVOT,
} from './usePlottedData.mock';

describe('usePlottedData', () => {
    it('should pivot data with 1 dimension and 1 metric', () => {
        expect(
            getPivotedData(
                RESULTS_FOR_SIMPLE_PIVOT,
                'dim2',
                ['metric1'],
                ['dim1'],
            ).rows,
        ).toEqual(EXPECTED_SIMPLE_PIVOT_RESULTS);
    });
    it('should pivot data with all dimension and 1 metric', () => {
        expect(
            getPivotedData(
                RESULTS_FOR_PIVOT_WITH_MULTIPLE_DIMENSIONS,
                'dim3',
                ['metric1'],
                ['dim1', 'dim2'],
            ).rows,
        ).toEqual(EXPECTED_PIVOT_RESULTS_WITH_ALL_DIMENSIONS);
    });
    it('should pivot data with some dimension and 1 metric', () => {
        expect(
            getPivotedData(
                RESULTS_FOR_PIVOT_WITH_MULTIPLE_DIMENSIONS,
                'dim3',
                ['metric1'],
                ['dim1'],
            ).rows,
        ).toEqual(EXPECTED_PIVOT_RESULTS_WITH_SOME_DIMENSIONS);
    });
    it('should pivot data on itself', () => {
        expect(
            getPivotedData(
                RESULTS_FOR_PIVOT_ON_ITSELF,
                'dim1',
                ['metric1', 'metric2'],
                ['dim1'],
            ).rows,
        ).toEqual(EXPECTED_PIVOT_ON_ITSELF_RESULTS);
    });
    it('should pivot data with same field pivoted and non pivoted', () => {
        expect(
            getPivotedData(
                RESULTS_FOR_SIMPLE_PIVOT,
                'dim1',
                ['metric1'],
                ['metric1'],
            ).rows,
        ).toEqual(
            EXPECTED_PIVOT_RESULTS_WITH_SAME_FIELD_PIVOTED_AND_NON_PIVOTED,
        );
    });
});
