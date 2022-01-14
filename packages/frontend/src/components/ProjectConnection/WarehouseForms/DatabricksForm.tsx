import React, { FC } from 'react';
import { hasWhiteSpaces } from '../../../utils/fieldValidators';
import Input from '../../ReactHookForm/Input';
import NumericInput from '../../ReactHookForm/NumericInput';
import PasswordInput from '../../ReactHookForm/PasswordInput';

const DatabricksForm: FC<{
    disabled: boolean;
}> = ({ disabled }) => (
    <>
        <Input
            name="warehouse.serverHostName"
            label="Server host name"
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#server-host-name"
            rules={{
                required: 'Required field',
                validate: {
                    hasWhiteSpaces: hasWhiteSpaces('Server host name'),
                },
            }}
            disabled={disabled}
            placeholder="xxxx.gcp.databricks.com"
        />
        <Input
            name="warehouse.httpPath"
            label="HTTP Path"
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#http-path"
            rules={{
                required: 'Required field',
                validate: {
                    hasWhiteSpaces: hasWhiteSpaces('HTTP Path'),
                },
            }}
            disabled={disabled}
            placeholder="sql/protocolv1/o/xxxx/xxxx"
        />
        <PasswordInput
            name="warehouse.personalAccessToken"
            label="Personal access token"
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#personal-access-token"
            rules={{
                required: 'Required field',
            }}
            placeholder={disabled ? '*******' : undefined}
            disabled={disabled}
        />
        <Input
            name="warehouse.database"
            label="Database"
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#database-1"
            rules={{
                required: 'Required field',
                validate: {
                    hasWhiteSpaces: hasWhiteSpaces('Database'),
                },
            }}
            disabled={disabled}
        />
        <NumericInput
            name="warehouse.port"
            label="Port"
            documentationUrl="https://docs.lightdash.com/get-started/setup-lightdash/connect-project#port-2"
            rules={{
                required: 'Required field',
                validate: {
                    hasWhiteSpaces: hasWhiteSpaces('Port'),
                },
            }}
            disabled={disabled}
            defaultValue={443}
        />
    </>
);

export default DatabricksForm;
