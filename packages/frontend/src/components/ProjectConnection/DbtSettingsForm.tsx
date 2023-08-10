import {
    assertUnreachable,
    DbtProjectType,
    DbtProjectTypeLabels,
    DefaultSupportedDbtVersion,
    SupportedDbtVersions,
    WarehouseTypes,
} from '@lightdash/common';
import { Accordion, Select, Stack, TextInput } from '@mantine/core';
import { FC, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useApp } from '../../providers/AppProvider';
import FormSection from '../ReactHookForm/FormSection';
import { MultiKeyValuePairsInput } from '../ReactHookForm/MultiKeyValuePairsInput';
import AzureDevOpsForm from './DbtForms/AzureDevOpsForm';
import BitBucketForm from './DbtForms/BitBucketForm';
import DbtCloudForm from './DbtForms/DbtCloudForm';
import DbtLocalForm from './DbtForms/DbtLocalForm';
import DbtNoneForm from './DbtForms/DbtNoneForm';
import GithubForm from './DbtForms/GithubForm';
import GitlabForm from './DbtForms/GitlabForm';
import { SelectedWarehouse } from './ProjectConnectFlow/SelectWarehouse';
import { BigQuerySchemaInput } from './WarehouseForms/BigQueryForm';
import { DatabricksSchemaInput } from './WarehouseForms/DatabricksForm';
import { PostgresSchemaInput } from './WarehouseForms/PostgresForm';
import { RedshiftSchemaInput } from './WarehouseForms/RedshiftForm';
import { SnowflakeSchemaInput } from './WarehouseForms/SnowflakeForm';
import { TrinoSchemaInput } from './WarehouseForms/TrinoForm';

interface DbtSettingsFormProps {
    disabled: boolean;
    defaultType?: DbtProjectType;
    selectedWarehouse?: SelectedWarehouse | undefined;
}

const DbtSettingsForm: FC<DbtSettingsFormProps> = ({
    disabled,
    defaultType,
    selectedWarehouse,
}) => {
    const { resetField, setValue } = useFormContext();
    const type: DbtProjectType = useWatch({
        name: 'dbt.type',
        defaultValue: defaultType || DbtProjectType.GITHUB,
    });
    const warehouseType: WarehouseTypes = useWatch({
        name: 'warehouse.type',
        defaultValue: WarehouseTypes.BIGQUERY,
    });
    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] =
        useState<boolean>(false);
    const toggleAdvancedSettingsOpen = () =>
        setIsAdvancedSettingsOpen((open) => !open);
    const { health } = useApp();
    const data = useMemo(() => {
        const enabledTypes = [
            DbtProjectType.GITHUB,
            DbtProjectType.GITLAB,
            DbtProjectType.BITBUCKET,
            DbtProjectType.AZURE_DEVOPS,
            DbtProjectType.NONE,
        ];
        if (health.data?.localDbtEnabled) {
            enabledTypes.push(DbtProjectType.DBT);
        }
        if (type === DbtProjectType.DBT_CLOUD_IDE) {
            enabledTypes.push(DbtProjectType.DBT_CLOUD_IDE);
        }

        return enabledTypes.map((value) => ({
            value,
            label: DbtProjectTypeLabels[value],
        }));
    }, [health, type]);

    const form = useMemo(() => {
        resetField('dbt.host_domain');

        switch (type) {
            case DbtProjectType.DBT:
                return <DbtLocalForm />;
            case DbtProjectType.DBT_CLOUD_IDE:
                return <DbtCloudForm disabled={disabled} />;
            case DbtProjectType.GITHUB:
                return <GithubForm disabled={disabled} />;
            case DbtProjectType.GITLAB:
                return <GitlabForm disabled={disabled} />;
            case DbtProjectType.BITBUCKET:
                return <BitBucketForm disabled={disabled} />;
            case DbtProjectType.AZURE_DEVOPS:
                return <AzureDevOpsForm disabled={disabled} />;
            case DbtProjectType.NONE:
                return <DbtNoneForm disabled={disabled} />;
            default: {
                return assertUnreachable(
                    type,
                    `Unknown dbt project type ${type}`,
                );
            }
        }
    }, [disabled, type, resetField]);

    const baseDocUrl =
        'https://docs.lightdash.com/get-started/setup-lightdash/connect-project#';
    const typeDocUrls = {
        [DbtProjectType.GITHUB]: {
            env: `environment-variables`,
        },
        [DbtProjectType.GITLAB]: {
            env: `environment-variables-1`,
        },
        [DbtProjectType.AZURE_DEVOPS]: {
            env: `environment-variables-2`,
        },
        [DbtProjectType.DBT]: {
            env: `environment-variables-3`,
        },
        [DbtProjectType.BITBUCKET]: {
            env: `environment-variables-3`,
        },
        [DbtProjectType.DBT_CLOUD_IDE]: {
            env: `environment-variables`,
        },
        [DbtProjectType.NONE]: {
            env: `environment-variables-3`,
        },
    };

    const warehouseSchemaInput = useMemo(() => {
        switch (selectedWarehouse || warehouseType) {
            case WarehouseTypes.BIGQUERY:
                return <BigQuerySchemaInput disabled={disabled} />;
            case WarehouseTypes.POSTGRES:
                return <PostgresSchemaInput disabled={disabled} />;
            case WarehouseTypes.TRINO:
                return <TrinoSchemaInput disabled={disabled} />;
            case WarehouseTypes.REDSHIFT:
                return <RedshiftSchemaInput disabled={disabled} />;
            case WarehouseTypes.SNOWFLAKE:
                return <SnowflakeSchemaInput disabled={disabled} />;
            case WarehouseTypes.DATABRICKS:
                return <DatabricksSchemaInput disabled={disabled} />;
            default: {
                return <></>;
            }
        }
    }, [disabled, warehouseType, selectedWarehouse]);
    const handleTypeChange = (selectedType: DbtProjectType) => {
        setValue('dbt.type', selectedType);
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Select
                name="dbt.type"
                label="Type"
                data={data}
                required
                disabled={disabled}
                defaultValue={DbtProjectType.GITHUB}
                onChange={handleTypeChange}
            />
            <Select
                name="dbtVersion"
                label="dbt version"
                data={Object.values(SupportedDbtVersions).map((version) => ({
                    value: version,
                    label: version,
                }))}
                disabled={disabled}
                defaultValue={DefaultSupportedDbtVersion}
                labelProps={{ style: { marginTop: '8px' } }}
            />
            <SelectField
                name="dbtVersion"
                label="dbt version"
                options={Object.values(SupportedDbtVersions).map((version) => ({
                    value: version,
                    label: version,
                }))}
                disabled={disabled}
                defaultValue={DefaultSupportedDbtVersion}
            />
            {form}
            {type !== DbtProjectType.NONE && (
                <>
                    <FormSection name="target">
                        <Stack style={{ marginTop: '8px' }}>
                            <TextInput
                                name="dbt.target"
                                label="Target name"
                                description={
                                    <p>
                                        <b>target</b> is the dataset/schema in
                                        your data warehouse that Lightdash will
                                        look for your dbt models. By default, we
                                        set this to be the same value as you
                                        have as the default in your profiles.yml
                                        file.
                                    </p>
                                }
                                disabled={disabled}
                                placeholder="prod"
                            />
                            {warehouseSchemaInput}
                        </Stack>
                    </FormSection>
                    <FormSection
                        name={'Advanced'}
                        isOpen={isAdvancedSettingsOpen}
                    >
                        <Stack style={{ marginTop: '15px' }}>
                            <MultiKeyValuePairsInput
                                name="dbt.environment"
                                label="Environment variables"
                                documentationUrl={`${baseDocUrl}${typeDocUrls[type].env}`}
                                disabled={disabled}
                            />
                            <></>
                        </Stack>
                    </FormSection>
                    <Accordion
                        chevronPosition="left"
                        variant="filled"
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Accordion.Item value="advanced configuration options">
                            <Accordion.Control
                                onClick={toggleAdvancedSettingsOpen}
                                style={{
                                    fontSize: '14px',
                                    paddingRight: '2px',
                                }}
                            >
                                Advanced configuration options
                            </Accordion.Control>
                        </Accordion.Item>
                    </Accordion>
                </>
            )}
        </div>
    );
};

export default DbtSettingsForm;
