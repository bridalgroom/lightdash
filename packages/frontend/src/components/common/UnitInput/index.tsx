import { Button, InputGroupProps } from '@blueprintjs/core';
import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { StyledNumberInput } from './UnitInput.style';

export type UnitInputProps = Omit<
    InputGroupProps,
    'name' | 'value' | 'defaultValue' | 'onChange'
> & {
    name: string;
    units: string[];
    value: string;
    defaultValue: string;
    fallbackValue?: string;
    onChange: (value: string | undefined) => void;
};

export const getValueAndUnit = (
    valueWithUnit: string,
    units: string[],
): [string?, string?] => {
    if (!valueWithUnit || valueWithUnit === '') return [];

    const unit = units.find((u) => valueWithUnit.endsWith(u)) || units[0];
    const value = valueWithUnit.replace(unit, '');
    return [value, unit];
};

const UnitInput = forwardRef<HTMLInputElement, UnitInputProps>(
    (
        {
            name,
            units,
            value: valueWithUnit,
            defaultValue: defaultValueWithUnit,
            fallbackValue,
            onChange,
            ...rest
        },
        ref,
    ) => {
        const inputRef = useRef<HTMLInputElement | null>(null);

        const [value, unit] = useMemo(
            () => getValueAndUnit(valueWithUnit, units),
            [valueWithUnit, units],
        );

        const [defaultValue, defaultUnit] = useMemo(
            () => getValueAndUnit(defaultValueWithUnit, units),
            [defaultValueWithUnit, units],
        );

        const nextUnit = useMemo(() => {
            if (!unit) return;

            const currentIndex = units.indexOf(unit);
            return units.concat(units[0])[currentIndex + 1];
        }, [unit, units]);

        const handleChange = useCallback(
            (newValue?: string, newUnit?: string, trigger: boolean = false) => {
                onChange(
                    newValue && newValue !== '' && newUnit
                        ? `${newValue}${newUnit}`
                        : undefined,
                );
                if (trigger) {
                    inputRef.current?.focus();
                }
            },
            [onChange],
        );

        return (
            <StyledNumberInput
                inputRef={(input) => {
                    if (!input) return;

                    inputRef.current = input;

                    if (typeof ref === 'function') {
                        ref(input);
                    } else if (ref) {
                        ref.current = input;
                    }
                }}
                type="number"
                id={`${name}-input`}
                name={name}
                {...rest}
                placeholder={defaultValue}
                value={value || ''}
                onChange={(e) =>
                    handleChange(e.target.value, value ? unit : defaultUnit)
                }
                rightElement={
                    <Button
                        minimal
                        small
                        disabled={!value || value === defaultValue}
                        onClick={() =>
                            handleChange(
                                value,
                                value ? nextUnit : defaultUnit,
                                true,
                            )
                        }
                    >
                        {unit || defaultUnit}
                    </Button>
                }
            />
        );
    },
);

export default UnitInput;
