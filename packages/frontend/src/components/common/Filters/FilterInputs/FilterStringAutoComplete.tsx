import { FilterableItem } from '@lightdash/common';
import {
    Group,
    Highlight,
    Loader,
    MultiSelect,
    MultiSelectProps,
    Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import uniq from 'lodash-es/uniq';
import {
    FC,
    ReactNode,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    MAX_AUTOCOMPLETE_RESULTS,
    useFieldValues,
} from '../../../../hooks/useFieldValues';
import MantineIcon from '../../MantineIcon';
import { useFiltersContext } from '../FiltersProvider';

type Props = Omit<MultiSelectProps, 'data' | 'onChange'> & {
    filterId: string;
    field: FilterableItem;
    values: string[];
    suggestions: string[];
    onChange: (values: string[]) => void;
};

const FilterStringAutoComplete: FC<Props> = ({
    filterId,
    values,
    field,
    suggestions: initialSuggestionData,
    disabled,
    onChange,
    placeholder,
    ...rest
}) => {
    const { projectUuid, getAutocompleteFilterGroup } = useFiltersContext();
    if (!projectUuid) {
        throw new Error('projectUuid is required in FiltersProvider');
    }

    const [search, setSearch] = useState('');

    const [scrollHeight, setScrollHeight] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const autocompleteFilterGroup = useMemo(
        () => getAutocompleteFilterGroup(filterId, field),
        [field, filterId, getAutocompleteFilterGroup],
    );

    const { isLoading, results: resultsSet } = useFieldValues(
        search,
        initialSuggestionData,
        projectUuid,
        field,
        autocompleteFilterGroup,
        true,
        { refetchOnMount: 'always' },
    );

    const results = useMemo(() => [...resultsSet], [resultsSet]);

    const handleResetSearch = useCallback(() => {
        setTimeout(() => setSearch(() => ''), 0);
    }, [setSearch]);

    const handleChange = useCallback(
        (updatedValues: string[]) => {
            if (dropdownRef.current)
                setScrollHeight(dropdownRef.current.scrollTop);
            onChange(uniq(updatedValues));
        },
        [onChange],
    );

    const handleAdd = useCallback(
        (newValue: string) => {
            handleChange([...values, newValue]);
            return newValue;
        },
        [handleChange, values],
    );

    const handleAddMultiple = useCallback(
        (newValues: string[]) => {
            handleChange([...values, ...newValues]);
            return newValues;
        },
        [handleChange, values],
    );

    const handlePaste = useCallback(
        (event: React.ClipboardEvent<HTMLInputElement>) => {
            const clipboardData = event.clipboardData.getData('Text');
            const clipboardDataArray = clipboardData
                .split(/\,|\n/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            handleAddMultiple(clipboardDataArray);
            handleResetSearch();
        },
        [handleAddMultiple, handleResetSearch],
    );

    const data = useMemo(() => {
        // Mantine does not show value tag if value is not found in data
        // so we need to add it manually here
        // also we are merging status indicator as a first item
        return uniq([...results, ...values]).map((value) => ({
            value,
            label: value,
        }));
    }, [results, values]);

    useLayoutEffect(() => {
        //scroll restoration in dropdown
        if (dropdownRef.current) dropdownRef.current.scrollTop = scrollHeight;
    }, [onChange, scrollHeight]);

    return (
        <MultiSelect
            size="xs"
            w="100%"
            placeholder={
                values.length > 0 || disabled ? undefined : placeholder
            }
            disabled={disabled}
            creatable
            getCreateLabel={(query) => (
                <Group spacing="xxs">
                    <MantineIcon icon={IconPlus} color="blue" size="sm" />
                    <Text color="blue">Add "{query}"</Text>
                </Group>
            )}
            styles={{
                item: {
                    // makes add new item button sticky to bottom
                    '&:last-child:not([value])': {
                        position: 'sticky',
                        bottom: 4,
                        // casts shadow on the bottom of the list to avoid transparency
                        boxShadow: '0 4px 0 0 white',
                    },
                    '&:last-child:not([value]):not(:hover)': {
                        background: 'white',
                    },
                },
            }}
            disableSelectedItemFiltering
            searchable
            clearSearchOnChange
            {...rest}
            searchValue={search}
            onSearchChange={setSearch}
            limit={MAX_AUTOCOMPLETE_RESULTS}
            onPaste={handlePaste}
            nothingFound={isLoading ? 'Loading...' : 'No results found'}
            rightSection={isLoading ? <Loader size="xs" color="gray" /> : null}
            dropdownComponent={({
                children,
                ...others
            }: {
                children: ReactNode;
            }) => (
                <div {...others} ref={dropdownRef}>
                    {results.length === MAX_AUTOCOMPLETE_RESULTS ? (
                        <Text
                            color="dimmed"
                            size="xs"
                            px="sm"
                            pt="xs"
                            pb="xxs"
                            bg="white"
                        >
                            Showing first {MAX_AUTOCOMPLETE_RESULTS} results.{' '}
                            {search ? 'Continue' : 'Start'} typing...
                        </Text>
                    ) : null}

                    {children}
                </div>
            )}
            itemComponent={({ label, ...others }) =>
                others.disabled ? (
                    <Text color="dimmed" {...others}>
                        {label}
                    </Text>
                ) : (
                    <Highlight highlight={search} {...others}>
                        {label}
                    </Highlight>
                )
            }
            data={data}
            value={values}
            onDropdownClose={handleResetSearch}
            onChange={handleChange}
            onCreate={handleAdd}
        />
    );
};

export default FilterStringAutoComplete;
