import { Flex, Modal, ModalProps, Title } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { FC } from 'react';
import MantineIcon from '../../../../../../components/common/MantineIcon';
import { GsheetsIcon } from '../../../../../../components/SchedulerModals/SchedulerModalBase/SchedulerModalBase.styles';
import {
    SyncWithGoogleSheetsModalAction,
    useSyncWithGoogleSheetsModal,
} from '../../hooks/use-sync-with-google-sheets-modal-provider';
import { SyncModalDelete } from './sync-modal-delete';
import { SyncModalForm } from './sync-modal-form';
import { SyncModalView } from './sync-modal-view';

type Props = { chartUuid: string } & Pick<ModalProps, 'opened' | 'onClose'>;

export const SyncModal: FC<Props> = ({ chartUuid, opened, onClose }) => {
    const { action } = useSyncWithGoogleSheetsModal();

    let modalTitle = 'Sync with Google Sheets';
    let headerIcon: typeof GsheetsIcon | typeof IconTrash = GsheetsIcon;
    let headerIconColor = 'black';

    if (action === SyncWithGoogleSheetsModalAction.CREATE) {
        modalTitle = 'Create a new Sync';
    } else if (action === SyncWithGoogleSheetsModalAction.EDIT) {
        modalTitle = 'Edit Sync';
    } else if (action === SyncWithGoogleSheetsModalAction.DELETE) {
        headerIcon = IconTrash;
        modalTitle = 'Delete Sync';
        headerIconColor = 'red';
    }

    return (
        <Modal
            size="md"
            opened={opened}
            title={
                <Flex align="center" gap="xs">
                    <MantineIcon icon={headerIcon} color={headerIconColor} />
                    <Title order={5}>{modalTitle}</Title>
                </Flex>
            }
            onClose={onClose}
        >
            {action === SyncWithGoogleSheetsModalAction.VIEW && (
                <SyncModalView chartUuid={chartUuid} />
            )}
            {(action === SyncWithGoogleSheetsModalAction.CREATE ||
                action === SyncWithGoogleSheetsModalAction.EDIT) && (
                <SyncModalForm chartUuid={chartUuid} />
            )}
            {action === SyncWithGoogleSheetsModalAction.DELETE && (
                <SyncModalDelete />
            )}
        </Modal>
    );
};
