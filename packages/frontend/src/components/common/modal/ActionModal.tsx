import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    IconName,
    Intent,
} from '@blueprintjs/core';
import { Dispatch, FC, SetStateAction, useCallback, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import styled from 'styled-components';
import useToaster from '../../../hooks/toaster/useToaster';
import Form from '../../ReactHookForm/Form';

export const ErrorMessage = styled.div`
    color: red;
    width: 300px;
    margin-left: 0px;
    margin-right: auto;
`;

export enum ActionTypeModal {
    CLOSE,
    UPDATE,
    ADD_TO_DASHBOARD,
    DELETE,
    MOVE_TO_SPACE,
    CREATE_SPACE,
}

export type ActionModalProps<T> = {
    title: string;
    icon?: IconName;
    confirmButtonLabel: string;
    confirmButtonIntent?: Intent;
    useActionModalState: [
        { actionType: number; data?: T },
        Dispatch<SetStateAction<{ actionType: number; data?: T }>>,
    ];
    ModalContent: FC<
        Pick<ActionModalProps<T>, 'useActionModalState' | 'isDisabled'>
    >;
    isDisabled: boolean;
    onSubmitForm: (data: T) => void;
    completedMutation: boolean;
    setFormValues?: (data: any, methods: UseFormReturn<any, object>) => void;
    onClose?: () => void;
    errorMessage?: string;
};

type State = { [key: string]: string };

const ActionModal = <T extends State>(props: ActionModalProps<T>) => {
    const {
        title,
        icon,
        confirmButtonLabel,
        confirmButtonIntent,
        isDisabled,
        completedMutation,
        useActionModalState: [
            { data: currentData, actionType },
            setActionState,
        ],
        onClose: onCloseModal,
        onSubmitForm,
        ModalContent,
        errorMessage,
    } = props;
    const { showToastError } = useToaster();

    const form = useForm<State>({
        mode: 'onChange',
        defaultValues: currentData,
    });

    const onClose = useCallback(() => {
        if (!isDisabled) {
            setActionState({ actionType: ActionTypeModal.CLOSE });
            if (onCloseModal) {
                onCloseModal();
                // reset fields for new modal
                form.reset();
            }
        }
    }, [isDisabled, form, onCloseModal, setActionState]);

    useEffect(() => {
        if (actionType !== ActionTypeModal.CLOSE && completedMutation) {
            onClose();
        }
    }, [onClose, completedMutation, actionType]);

    const handleSubmit = (data?: any) => {
        try {
            onSubmitForm(data);
        } catch (e: any) {
            showToastError({
                title: 'Error saving',
                subtitle: e.message,
            });
        }
    };

    return (
        <Dialog
            title={title}
            isOpen={actionType !== ActionTypeModal.CLOSE}
            icon={icon}
            onClose={onClose}
        >
            <Form name={title} methods={form} onSubmit={handleSubmit}>
                <DialogBody>
                    <ModalContent {...props} />
                </DialogBody>

                <DialogFooter
                    actions={
                        <>
                            <ErrorMessage>{errorMessage}</ErrorMessage>

                            <Button
                                data-cy="submit-base-modal"
                                disabled={isDisabled || !form.formState.isValid}
                                intent={confirmButtonIntent || Intent.PRIMARY}
                                type="submit"
                                text={confirmButtonLabel}
                                loading={isDisabled}
                            />
                        </>
                    }
                />
            </Form>
        </Dialog>
    );
};

export default ActionModal;
