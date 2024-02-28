import { PropsWithChildren } from 'react';
import { FocusedItemIndex, SearchItem } from '../types/searchItem';

interface Props {
    groupedItems: [string, SearchItem[]][];
    onEnterPressed: (item: SearchItem) => void;
    onFocusedItemChange: (index?: FocusedItemIndex) => void;
    currentFocusedItemIndex?: FocusedItemIndex;
}

export const OmnibarKeyboardNav = ({
    children,
    groupedItems,
    currentFocusedItemIndex,
    onEnterPressed,
    onFocusedItemChange,
}: PropsWithChildren<Props>) => {
    function handleArrowDown(
        maxGroupIndex: number,
        maxCurrentGroupItemIndex: number,
    ) {
        if (!currentFocusedItemIndex) {
            return {
                groupIndex: 0,
                itemIndex: 0,
            };
        }

        if (currentFocusedItemIndex.itemIndex < maxCurrentGroupItemIndex) {
            // move to next item in the same group
            return {
                groupIndex: currentFocusedItemIndex.groupIndex,
                itemIndex: currentFocusedItemIndex.itemIndex + 1,
            };
        }

        if (
            currentFocusedItemIndex.groupIndex < maxGroupIndex &&
            currentFocusedItemIndex.itemIndex === maxCurrentGroupItemIndex
        ) {
            // move to the first item in the next group
            return {
                groupIndex: currentFocusedItemIndex.groupIndex + 1,
                itemIndex: 0,
            };
        }

        return {
            groupIndex: 0,
            itemIndex: 0,
        };
    }

    function handleArrowUp(maxGroupIndex: number, lastItemIndex: number) {
        if (!currentFocusedItemIndex) {
            return {
                groupIndex: maxGroupIndex,
                itemIndex: lastItemIndex,
            };
        }

        if (currentFocusedItemIndex.itemIndex > 0) {
            // move to previous item in the same group
            return {
                groupIndex: currentFocusedItemIndex.groupIndex,
                itemIndex: currentFocusedItemIndex.itemIndex - 1,
            };
        }

        if (
            currentFocusedItemIndex.groupIndex > 0 &&
            currentFocusedItemIndex.itemIndex === 0
        ) {
            // move to the last item in the previous group
            const prevGroupIndex = currentFocusedItemIndex.groupIndex - 1;
            return {
                groupIndex: prevGroupIndex,
                itemIndex: groupedItems[prevGroupIndex][1].length - 1,
            };
        }

        return {
            groupIndex: maxGroupIndex,
            itemIndex: lastItemIndex,
        };
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (groupedItems.length < 1) {
            return;
        }

        const maxGroupIndex = groupedItems.length - 1;
        const lastItemIndex = groupedItems[maxGroupIndex][1].length - 1;
        const maxCurrentGroupItemIndex = currentFocusedItemIndex
            ? groupedItems[currentFocusedItemIndex.groupIndex][1].length - 1
            : -1;

        switch (event.key) {
            case 'ArrowDown':
                onFocusedItemChange(
                    handleArrowDown(maxGroupIndex, maxCurrentGroupItemIndex),
                );

                break;
            case 'ArrowUp':
                onFocusedItemChange(
                    handleArrowUp(maxGroupIndex, lastItemIndex),
                );

                break;
            case 'Enter':
                if (currentFocusedItemIndex) {
                    const item =
                        groupedItems[currentFocusedItemIndex.groupIndex][1][
                            currentFocusedItemIndex.itemIndex
                        ];
                    onEnterPressed(item);
                }
                break;
        }
    }

    return <div onKeyDown={onKeyDown}>{children}</div>;
};
