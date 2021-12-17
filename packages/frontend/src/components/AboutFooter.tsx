import {
    AnchorButton,
    Button,
    Callout,
    Classes,
    Colors,
    Dialog,
    H5,
    Intent,
    Tag,
} from '@blueprintjs/core';
import React, { FC, useState } from 'react';
import { useApp } from '../providers/AppProvider';
import { TrackPage, TrackSection } from '../providers/TrackingProvider';
import { ReactComponent as Logo } from '../svgs/grey-icon-logo.svg';
import { PageName, PageType, SectionName } from '../types/Events';

const AboutFooter: FC<{ minimal?: boolean; maxWidth?: number }> = ({
    minimal,
    maxWidth,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { health: healthState } = useApp();
    const hasUpdate =
        healthState.data?.latest.version &&
        healthState.data.version !== healthState.data.latest.version;

    return (
        <TrackSection name={SectionName.PAGE_FOOTER}>
            <div
                style={{
                    width: '100%',
                    borderTop: `1px solid ${Colors.LIGHT_GRAY2}`,
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '20px',
                }}
            >
                <footer
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        maxWidth: maxWidth || 768,
                        height: 75,
                    }}
                >
                    <Button
                        minimal
                        icon={<Logo />}
                        onClick={() => setIsOpen(true)}
                        style={{
                            whiteSpace: 'nowrap',
                        }}
                        loading={healthState.isLoading}
                    >
                        {!minimal && 'Lightdash - '}
                        {healthState.data && `v${healthState.data.version}`}
                        {hasUpdate && (
                            <Tag
                                minimal
                                intent={Intent.PRIMARY}
                                style={{ marginLeft: 5 }}
                            >
                                New version available!
                            </Tag>
                        )}
                    </Button>
                    <div>
                        <AnchorButton
                            href="https://docs.lightdash.com/"
                            target="_blank"
                            minimal
                            icon="document-open"
                        >
                            {!minimal && 'Documentation'}
                        </AnchorButton>
                        <AnchorButton
                            href="https://docs.lightdash.com/"
                            target="_blank"
                            minimal
                            icon="lifesaver"
                        >
                            {!minimal && 'Help'}
                        </AnchorButton>
                    </div>
                </footer>
                <Dialog
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    icon="info-sign"
                    title="About Lightdash"
                >
                    <TrackPage
                        name={PageName.ABOUT_LIGHTDASH}
                        type={PageType.MODAL}
                    >
                        <div className={Classes.DIALOG_BODY}>
                            <H5>
                                <b>Version:</b>{' '}
                                {healthState.data
                                    ? `v${healthState.data.version}`
                                    : 'n/a'}
                            </H5>
                            {hasUpdate && (
                                <Callout
                                    title="New version available!"
                                    intent={Intent.PRIMARY}
                                >
                                    The version v
                                    {healthState.data?.latest.version} is now
                                    available. Please follow the instructions in
                                    the{' '}
                                    <a
                                        href="https://docs.lightdash.com/guides/how-to-update-docker-image"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        How to update version
                                    </a>{' '}
                                    documentation.
                                </Callout>
                            )}
                        </div>
                        <div className={Classes.DIALOG_FOOTER}>
                            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                                <AnchorButton
                                    href="https://docs.lightdash.com/"
                                    target="_blank"
                                    outlined
                                    rightIcon="share"
                                >
                                    Docs
                                </AnchorButton>
                                <AnchorButton
                                    href="https://github.com/lightdash/lightdash"
                                    target="_blank"
                                    outlined
                                    rightIcon="share"
                                >
                                    Github
                                </AnchorButton>
                            </div>
                        </div>
                    </TrackPage>
                </Dialog>
            </div>
        </TrackSection>
    );
};

export default AboutFooter;
