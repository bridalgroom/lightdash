import { Sx } from '@mantine/core';
import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Control the Tooltip visibility manually to allow hovering on Label
 * @returns tooltipProps, tooltipLabelProps - props to pass to Tooltip component and 'label' prop component, respectively, to control their visibility
 */
export const useTooltipControlOpen = () => {
    // NOTE: Control the Tooltip visibility manually to allow hovering on Label.
    const [isOpen, setIsOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const closeTimeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const handleMouseEnter = useCallback(() => {
        clearTimeout(closeTimeoutId.current);
        setIsOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        // NOTE: Provide similar delay as Tooltip component
        closeTimeoutId.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    }, []);

    const handleLabelMouseEnter = useCallback(() => {
        setIsHovering(true);
        clearTimeout(closeTimeoutId.current);
    }, []);

    const handleLabelMouseLeave = useCallback(() => {
        setIsHovering(false);
        // NOTE: Provide similar delay as Tooltip component
        closeTimeoutId.current = setTimeout(() => {
            setIsOpen(false);
        }, 200);
    }, []);

    const tooltipProps = useMemo<{
        sx: Sx;
        isOpen: boolean;
        handleMouseEnter: () => void;
        handleMouseLeave: () => void;
    }>(
        () => ({
            sx: { pointerEvents: 'auto' },
            isOpen: isOpen || isHovering,
            handleMouseEnter,
            handleMouseLeave,
        }),
        [handleMouseEnter, handleMouseLeave, isHovering, isOpen],
    );

    const tooltipLabelProps = useMemo(
        () => ({
            handleLabelMouseEnter,
            handleLabelMouseLeave,
        }),
        [handleLabelMouseEnter, handleLabelMouseLeave],
    );

    return {
        tooltipProps,
        tooltipLabelProps,
    };
};
