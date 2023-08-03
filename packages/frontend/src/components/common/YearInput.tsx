import { YearPickerInput, YearPickerInputProps } from '@mantine/dates';
import moment from 'moment';
import React, { FC } from 'react';

type Props = {
    value: Date | null;
    onChange: (value: Date) => void;
} & Pick<YearPickerInputProps, 'disabled' | 'placeholder'>;

const YearInput: FC<Props> = ({ value, onChange, disabled, placeholder }) => {
    const yearValue = value ? moment(value).toDate() : null;

    return (
        <YearPickerInput
            popoverProps={{
                withinPortal: false,
                withArrow: true,
                shadow: 'md',
            }}
            size="xs"
            disabled={disabled}
            placeholder={placeholder}
            minDate={moment().year(1000).toDate()}
            maxDate={moment().year(9999).toDate()}
            value={yearValue}
            onChange={(year) => {
                if (!year) return;
                onChange(year);
            }}
        />
    );
};

export default YearInput;
