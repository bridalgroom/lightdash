import { NumericInput, NumericInputProps } from '@blueprintjs/core';
import moment from 'moment';
import { FC } from 'react';

type Props = {
    value: Date;
    onChange: (value: Date) => void;
} & Pick<NumericInputProps, 'disabled' | 'placeholder'>;

const YearInput: FC<Props> = ({ value, onChange, disabled, placeholder }) => {
    const utcYearValue = moment(value).year();

    return (
        <NumericInput
            className={disabled ? 'disabled-filter' : ''}
            disabled={disabled}
            fill
            max={9999}
            min={1000}
            minLength={4}
            maxLength={4}
            placeholder={placeholder}
            defaultValue={utcYearValue}
            onValueChange={(year) => {
                if (year > 1000 && year < 9999) {
                    onChange(moment(value).year(year).toDate());
                }
            }}
            onBlur={(e) => {
                let year = parseInt(e.currentTarget.value, 10);
                if (year < 1000) {
                    year = 1000;
                } else if (year > 9999) {
                    year = 9999;
                }
                onChange(moment(value).year(year).toDate());
            }}
        />
    );
};

export default YearInput;
