import { Colors } from '@blueprintjs/core';
import { DateInput2 } from '@blueprintjs/datetime2';
import { Popover2Props } from '@blueprintjs/popover2';
import { formatDate, hexToRGB, parseDate } from '@lightdash/common';
import moment from 'moment';
import React, { FC, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

const SelectedWeekStyles = createGlobalStyle`
  .WeekPicker .DayPicker-Month {
    border-collapse: separate;
  }

  .WeekPicker .DayPicker-WeekNumber {
    outline: none;
  }

  .WeekPicker .DayPicker-Day {
    outline: none;
    border: 1px solid transparent;
  }

  .WeekPicker .DayPicker-Day--hoverRange {
    border-radius: 0 !important;
    background-color: ${hexToRGB(Colors.BLUE3, 0.3)} !important;
  }

  .WeekPicker .DayPicker-Day--selectedRange {
    border-radius: 0 !important;
    background-color: ${hexToRGB(Colors.BLUE3, 0.5)} !important;
    border-top-color: ${Colors.BLUE3};
    border-bottom-color: ${Colors.BLUE3};
    color: ${Colors.WHITE};
    &:hover {
      color: ${Colors.WHITE};
    }
  }

  .WeekPicker .DayPicker-Day--selectedRangeStart {
    background-color: ${Colors.BLUE3} !important;
    border-left: 1px solid ${Colors.BLUE3};
    border-radius: 3px 0 0 3px!important;
  }

  .WeekPicker .DayPicker-Day--selectedRangeEnd {
    background-color: ${Colors.BLUE3} !important;
    border-right: 1px solid ${Colors.BLUE3};
    border-radius: 0 3px 3px 0 !important;
  }
`;

function getWeekDays(weekStart: Date): Date[] {
    const days = [weekStart];
    for (let i = 1; i < 7; i += 1) {
        days.push(moment(weekStart).add(i, 'days').toDate());
    }
    return days;
}

type WeekRange = { from: Date; to: Date };

function getWeekRange(date: Date): WeekRange {
    return {
        from: moment(date).startOf('week').toDate(),
        to: moment(date).endOf('week').toDate(),
    };
}

type Props = {
    value: Date;
    onChange: (value: Date) => void;
    popoverProps?: Popover2Props;
    disabled?: boolean;
};

const WeekPicker: FC<Props> = ({ value, onChange, popoverProps, disabled }) => {
    const [hoverRange, setHoverRange] = useState<WeekRange>();
    const selectedDays = getWeekDays(getWeekRange(value).from);
    const daysAreSelected = selectedDays.length > 0;
    const modifiers = {
        hoverRange,
        selectedRange: daysAreSelected && {
            from: selectedDays[0],
            to: selectedDays[6],
        },
        hoverRangeStart: hoverRange && hoverRange.from,
        hoverRangeEnd: hoverRange && hoverRange.to,
        selectedRangeStart: daysAreSelected && selectedDays[0],
        selectedRangeEnd: daysAreSelected && selectedDays[6],
    };
    const onDayMouseEnter = (date: Date) => {
        setHoverRange(getWeekRange(date));
    };
    const onDayMouseLeave = () => {
        setHoverRange(undefined);
    };
    return (
        <>
            <SelectedWeekStyles />
            <DateInput2
                fill
                className={disabled ? 'disabled-filter' : ''}
                disabled={disabled}
                defaultTimezone="UTC"
                showTimezoneSelect={false}
                value={value.toUTCString()}
                formatDate={formatDate}
                parseDate={parseDate}
                defaultValue={getWeekRange(new Date()).from.toString()}
                onChange={(pickedDate: string | null) => {
                    onChange(getWeekRange(new Date(pickedDate || value)).from);
                }}
                dayPickerProps={{
                    selectedDays,
                    showOutsideDays: true,
                    modifiers: modifiers as any,
                    onDayMouseEnter,
                    onDayMouseLeave,
                }}
                popoverProps={{
                    popoverClassName: 'WeekPicker',
                    placement: 'bottom',
                    ...popoverProps,
                }}
            />
        </>
    );
};

export default WeekPicker;
