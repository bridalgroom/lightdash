import {
    Anchor,
    FileInput,
    NumberInput,
    Select,
    Stack,
    TextInput,
} from '@mantine/core';
import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useToggle } from 'react-use';
import { hasNoWhiteSpaces } from '../../../utils/fieldValidators';
import FormSection from '../../ReactHookForm/FormSection';
import Input from '../../ReactHookForm/Input';
import {
    AdvancedButton,
    AdvancedButtonWrapper,
} from '../ProjectConnection.styles';
import StartOfWeekSelect from './Inputs/StartOfWeekSelect';

export const BigQuerySchemaInput: FC<{
    disabled: boolean;
}> = ({ disabled }) => {
    return (
        <Input
            name="warehouse.dataset"
            label="Data set"
            labelHelp={
                <p>
                    This is the name of your dbt dataset: the dataset in your
                    warehouse where the output of your dbt models is written to.
                    If you're not sure what this is, check out the
                    <b> dataset </b>
                    value{' '}
                    <Anchor
                        target="_blank"
                        href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#:~:text=This%20connection%20method%20requires%20local%20OAuth%20via%20gcloud."
                        rel="noreferrer"
                    >
                        you've set in your dbt <b>profiles.yml</b> file
                    </Anchor>
                    .
                </p>
            }
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#data-set"
            rules={{
                required: 'Required field',
                validate: {
                    hasNoWhiteSpaces: hasNoWhiteSpaces('Data set'),
                },
            }}
            disabled={disabled}
        />
    );
};
const BigQueryForm: FC<{
    disabled: boolean;
}> = ({ disabled }) => {
    const [isOpen, toggleOpen] = useToggle(false);
    const { register } = useFormContext();

    return (
        <>
            <Stack style={{ marginTop: '8px' }}>
                <TextInput
                    label="Project"
                    description="This is the GCP project ID."
                    required
                    {...register('warehouse.project', {
                        validate: {
                            hasNoWhiteSpaces: hasNoWhiteSpaces('Project'),
                        },
                    })}
                    disabled={disabled}
                    labelProps={{ style: { marginTop: '8px' } }}
                />

                <TextInput
                    label="Location"
                    description={
                        <p>
                            The location of BigQuery datasets. You can see more
                            details in{' '}
                            <Anchor
                                target="_blank"
                                href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#dataset-locations"
                                rel="noreferrer"
                            >
                                dbt documentation
                            </Anchor>
                            .
                        </p>
                    }
                    required
                    {...register('warehouse.location', {
                        validate: {
                            hasNoWhiteSpaces: hasNoWhiteSpaces('Location'),
                        },
                    })}
                    disabled={disabled}
                />

                <Controller
                    name="warehouse.keyfileContents"
                    render={({ field }) => (
                        <FileInput
                            {...field}
                            label="Key File"
                            placeholder="Choose file..."
                            description={
                                <p>
                                    This is the JSON key file. You can see{' '}
                                    <Anchor
                                        target="_blank"
                                        href="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#key-file"
                                        rel="noreferrer"
                                    >
                                        how to create a key here
                                    </Anchor>
                                    .
                                </p>
                            }
                            {...register('warehouse.keyfileContents')}
                            required
                            accept="application/json"
                            value={field.value}
                            onChange={field.onChange}
                            disabled={disabled}
                        />
                    )}
                />

                <FormSection isOpen={isOpen} name="advanced">
                    <Stack style={{ marginTop: '8px' }}>
                        <Controller
                            name="warehouse.timeoutSeconds"
                            defaultValue={300}
                            render={({ field }) => (
                                <NumberInput
                                    {...field}
                                    label="Timeout in seconds"
                                    description={
                                        <p>
                                            If a dbt model takes longer than
                                            this timeout to complete, then
                                            BigQuery may cancel the query. You
                                            can see more details in{' '}
                                            <Anchor
                                                target="_blank"
                                                href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#timeouts"
                                                rel="noreferrer"
                                            >
                                                dbt documentation
                                            </Anchor>
                                            .
                                        </p>
                                    }
                                    required
                                    disabled={disabled}
                                />
                            )}
                        />
                        <Controller
                            name="warehouse.priority"
                            defaultValue="interactive"
                            render={({ field }) => (
                                <Select
                                    label="Priority"
                                    description={
                                        <p>
                                            The priority for the BigQuery jobs
                                            that dbt executes. You can see more
                                            details in{' '}
                                            <Anchor
                                                target="_blank"
                                                href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#priority"
                                                rel="noreferrer"
                                            >
                                                dbt documentation
                                            </Anchor>
                                            .
                                        </p>
                                    }
                                    data={[
                                        {
                                            value: 'interactive',
                                            label: 'interactive',
                                        },
                                        {
                                            value: 'batch',
                                            label: 'batch',
                                        },
                                    ]}
                                    required
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={disabled}
                                />
                            )}
                        />
                        <Controller
                            name="warehouse.retries"
                            defaultValue={3}
                            render={({ field }) => (
                                <NumberInput
                                    {...field}
                                    label="Retries"
                                    description={
                                        <p>
                                            The number of times dbt should retry
                                            queries that result in unhandled
                                            server errors You can see more
                                            details in{' '}
                                            <Anchor
                                                target="_blank"
                                                href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#retries"
                                                rel="noreferrer"
                                            >
                                                dbt documentation
                                            </Anchor>
                                            .
                                        </p>
                                    }
                                    required
                                />
                            )}
                        />
                        <Controller
                            name="warehouse.maximumBytesBilled"
                            defaultValue={1000000000}
                            render={({ field }) => (
                                <NumberInput
                                    {...field}
                                    label="Maximum bytes billed"
                                    description={
                                        <p>
                                            When a value is configured, queries
                                            executed by dbt will fail if they
                                            exceed the configured maximum bytes
                                            threshold. You can see more details
                                            in{' '}
                                            <Anchor
                                                target="_blank"
                                                href="https://docs.getdbt.com/reference/warehouse-profiles/bigquery-profile#maximum-bytes-billed"
                                                rel="noreferrer"
                                            >
                                                dbt documentation
                                            </Anchor>
                                            .
                                        </p>
                                    }
                                    required
                                    disabled={disabled}
                                />
                            )}
                        />
                        <StartOfWeekSelect disabled={disabled} />
                    </Stack>
                </FormSection>

                <AdvancedButtonWrapper>
                    <AdvancedButton
                        icon={isOpen ? 'chevron-up' : 'chevron-down'}
                        text={`Advanced configuration options`}
                        onClick={toggleOpen}
                    />
                </AdvancedButtonWrapper>
            </Stack>
        </>
    );
};

export default BigQueryForm;
