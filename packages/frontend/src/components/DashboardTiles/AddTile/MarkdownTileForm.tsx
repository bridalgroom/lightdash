import { DashboardChartTile } from 'common';
import React from 'react';
import { ActionModalProps } from '../../common/modal/ActionModal';
import Input from '../../ReactHookForm/Input';
import MarkdownInput from '../../ReactHookForm/MarkdownInput';

const ChartTileForm = ({
    isDisabled,
}: Pick<
    ActionModalProps<DashboardChartTile['properties']>,
    'useActionModalState' | 'isDisabled'
>) => (
    <>
        <Input
            name="title"
            label="Title"
            disabled={isDisabled}
            rules={{
                required: 'Required field',
            }}
            placeholder="Tile title"
        />
        <MarkdownInput
            name="content"
            label="Content"
            disabled={isDisabled}
            rules={{
                required: 'Required field',
            }}
        />
    </>
);

export default ChartTileForm;
