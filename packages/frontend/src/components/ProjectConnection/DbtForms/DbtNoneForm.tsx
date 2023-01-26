import { Callout } from '@blueprintjs/core';
import { WarehouseTypes } from '@lightdash/common';
import React, { FC } from 'react';
import BooleanSwitch from '../../ReactHookForm/BooleanSwitch';
import SelectField from '../../ReactHookForm/Select';

const DbtNoneForm: FC<{ disabled: boolean }> = ({ disabled }) => (
    <>
        <Callout intent="warning" style={{ marginBottom: 20 }}>
            This project was created from the CLI. If you want to keep Lightdash
            in sync with your dbt project, you need to either{' '}
            <a
                href={
                    'https://docs.lightdash.com/get-started/setup-lightdash/connect-project#2-import-a-dbt-project'
                }
                target="_blank"
                rel="noreferrer"
            >
                change your connection type
            </a>
            , setup a{' '}
            <a
                href={
                    'https://docs.lightdash.com/guides/cli/how-to-use-lightdash-deploy#automatically-deploy-your-changes-to-lightdash-using-a-github-action'
                }
                target="_blank"
                rel="noreferrer"
            >
                GitHub action
            </a>
            or, run{' '}
            <a
                href={
                    'https://docs.lightdash.com/guides/cli/how-to-use-lightdash-deploy#lightdash-deploy-syncs-the-changes-in-your-dbt-project-to-lightdash'
                }
                target="_blank"
                rel="noreferrer"
            >
                lightdash deploy
            </a>
            ) from your command line.
        </Callout>
        <BooleanSwitch
            name="dbt.hideRefreshButton"
            label="Hide refresh button"
            labelHelp={
                <p>
                    This is intended to hide the "refresh dbt" button from the
                    explore page
                </p>
            }
            disabled={disabled}
            defaultValue={false}
        />
    </>
);

export default DbtNoneForm;
