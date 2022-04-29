import {
    Button,
    Classes,
    Dialog,
    FormGroup,
    InputGroup,
    PopoverPosition,
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { Explore, Source } from 'common';
import React, { FC, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TableTree from './TableTree';

type ExploreTreeProps = {
    explore: Explore;
    onSelectedFieldChange: (fieldId: string, isDimension: boolean) => void;
    selectedNodes: Set<string>;
};

const SourceDialog: FC<{ source: Source; onClose: () => void }> = ({
    source,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);
    return (
        <Dialog
            isOpen
            icon="console"
            onClose={onClose}
            lazy
            title="Source"
            style={{ width: '800px' }}
        >
            <div className={Classes.DIALOG_BODY}>
                <Tooltip2
                    isOpen={copied}
                    content="Copied path!"
                    intent="success"
                    position={PopoverPosition.RIGHT}
                >
                    <FormGroup
                        label="Path to schema file:"
                        labelFor="source-path"
                        inline
                    >
                        <InputGroup
                            readOnly
                            id="source-path"
                            type="text"
                            defaultValue={source.path}
                            rightElement={
                                <CopyToClipboard
                                    text={source.path}
                                    options={{ message: 'Copied!' }}
                                    onCopy={() => setCopied(true)}
                                >
                                    <Button minimal icon="clipboard" />
                                </CopyToClipboard>
                            }
                        />
                    </FormGroup>
                </Tooltip2>
                <SyntaxHighlighter
                    language="yml"
                    showLineNumbers
                    startingLineNumber={source.range.start.line}
                    style={a11yDark}
                    wrapLines
                    lineProps={(lineNumber) =>
                        source.highlight &&
                        lineNumber >= source.highlight?.start.line &&
                        lineNumber <= source.highlight?.end.line
                            ? {
                                  style: {
                                      background: 'rgba(252, 254, 120, 0.3)',
                                      display: 'block',
                                      width: '100%',
                                  },
                              }
                            : {}
                    }
                >
                    {source.content}
                </SyntaxHighlighter>
            </div>
        </Dialog>
    );
};

const ExploreTree: FC<ExploreTreeProps> = ({
    explore,
    selectedNodes,
    onSelectedFieldChange,
}) => {
    const [search, setSearch] = useState<string>('');
    const [source, setSource] = useState<Source>();

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div style={{ padding: '10px 15px 15px 10px' }}>
                <InputGroup
                    leftIcon="search"
                    rightElement={
                        <Button
                            minimal
                            icon="cross"
                            onClick={() => setSearch('')}
                        />
                    }
                    placeholder="Search metrics + dimensions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div style={{ overflowY: 'auto' }}>
                {Object.values(explore.tables)
                    .sort((tableA) =>
                        tableA.name === explore.baseTable ? -1 : 1,
                    )
                    .map((table) => (
                        <TableTree
                            key={table.name}
                            search={search}
                            table={table}
                            joinSql={
                                explore.joinedTables.find(
                                    (joinTable) =>
                                        joinTable.table === table.name,
                                )?.compiledSqlOn
                            }
                            selectedNodes={selectedNodes}
                            onSelectedNodeChange={onSelectedFieldChange}
                            onOpenSourceDialog={setSource}
                            hasMultipleTables={
                                Object.keys(explore.tables).length > 1
                            }
                        />
                    ))}
            </div>
            {source && (
                <SourceDialog
                    source={source}
                    onClose={() => setSource(undefined)}
                />
            )}
        </div>
    );
};

export default ExploreTree;
