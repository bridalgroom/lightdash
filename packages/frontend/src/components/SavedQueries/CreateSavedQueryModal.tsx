import { SpaceQuery } from 'common';
import React, { FC } from 'react';
import {
    CreateSavedQueryVersion,
    useCreateMutation,
} from '../../hooks/useSavedQuery';
import { ActionModalProps } from '../common/modal/ActionModal';
import CreateActionModal from '../common/modal/CreateActionModal';

interface CreateSavedQueryModalProps {
    isOpen: boolean;
    savedData: CreateSavedQueryVersion;
    ModalContent: (
        props: Pick<
            ActionModalProps<SpaceQuery>,
            'useActionModalState' | 'isDisabled'
        >,
    ) => JSX.Element;
    onClose?: () => void;
}

const CreateSavedQueryModal: FC<CreateSavedQueryModalProps> = (props) => {
    const useCreate = useCreateMutation();
    return <CreateActionModal useCreate={useCreate} {...props} />;
};

export default CreateSavedQueryModal;
