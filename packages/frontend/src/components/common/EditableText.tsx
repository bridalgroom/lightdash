import {
    Button,
    EditableText as BluePrintEditableText,
    H3,
} from '@blueprintjs/core';
import React, { FC, useEffect, useState } from 'react';

type Props = {
    value: string;
    placeholder?: string;
    readonly?: boolean;
    isDisabled: boolean;
    onChange: (title: string) => void;
    onIsEditingChange?: (isEditing: boolean) => void;
};

const EditableText: FC<Props> = ({
    readonly,
    placeholder,
    value,
    isDisabled,
    onChange,
    onIsEditingChange,
}) => {
    const [isEditable, setIsEditable] = useState(false);
    const [title, setTitle] = useState(value);

    const onConfirm = () => {
        if (value !== title) {
            onChange(title);
        }
        setIsEditable(false);
    };

    const onCancel = () => {
        setTitle(value);
        setIsEditable(false);
    };

    useEffect(() => {
        onIsEditingChange?.(isEditable);
    }, [isEditable, onIsEditingChange]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <H3
                style={{
                    margin: '0',
                }}
            >
                <BluePrintEditableText
                    type="h3"
                    isEditing={isEditable}
                    multiline={false}
                    defaultValue={value}
                    placeholder={placeholder}
                    disabled={isDisabled || readonly}
                    onConfirm={onConfirm}
                    onChange={setTitle}
                    onCancel={onCancel}
                    onEdit={() => setIsEditable(true)}
                />
            </H3>
            {!isEditable && !readonly && (
                <Button
                    style={{
                        marginLeft: 5,
                    }}
                    icon="edit"
                    disabled={isDisabled}
                    onClick={() => setIsEditable(true)}
                    minimal
                />
            )}
        </div>
    );
};

EditableText.defaultProps = {
    readonly: false,
};

export default EditableText;
