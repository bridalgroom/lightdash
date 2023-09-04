import { Spinner } from '@blueprintjs/core';
import { MenuItem2 } from '@blueprintjs/popover2';
import {
    ApiDownloadCsv,
    ApiError,
    ApiScheduledDownloadCsv,
    SchedulerJobStatus,
} from '@lightdash/common';
import { Button } from '@mantine/core';
import { FC, memo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { getCsvFileUrl } from '../../../api/csv';
import { useGdriveAccessToken } from '../../../hooks/gdrive/useGdrive';
import useHealth from '../../../hooks/health/useHealth';
import useToaster from '../../../hooks/toaster/useToaster';
import { AppToaster } from '../../AppToaster';
import MantineIcon from '../../common/MantineIcon';
import { GsheetsIcon } from '../../SchedulerModals/SchedulerModalBase/SchedulerModalBase.styles';

export type ExportGsheetProps = {
    getGsheetLink: () => Promise<ApiScheduledDownloadCsv>;
    asMenuItem?: boolean;
    disabled?: boolean;
};

const ExportGsheets: FC<ExportGsheetProps> = memo(
    ({ getGsheetLink, asMenuItem, disabled }) => {
        const health = useHealth();
        const hasGoogleDrive =
            health.data?.auth.google.oauth2ClientId !== undefined &&
            health.data?.auth.google.googleDriveApiKey !== undefined;
        const [isGoogleAuthQueryEnabled, setIsGoogleAuthQueryEnabled] =
            useState(false);
        const { showToastError, showToast } = useToaster();

        // TODO: move to own hook
        const {
            mutateAsync: startGoogleSheetExport,
            data: startGoogleSheetExportData,
            reset: resetStartGoogleSheetExport,
        } = useMutation(['google-sheets-start'], getGsheetLink, {
            onMutate: () => {
                showToast({
                    title: 'Exporting Google Sheets',
                    subtitle: 'This may take a few minutes...',
                    icon: (
                        <Spinner
                            className="bp4-icon bp4-icon-error"
                            size={16}
                        />
                    ),
                    key: 'exporting-gsheets',
                    timeout: 0,
                });
            },
            onError: (error: { error: Error }) => {
                AppToaster.dismiss('exporting-gsheets');
                showToastError({
                    title: `Unable to upload to Google Sheets`,
                    subtitle: error?.error?.message,
                });
            },
        });

        // TODO: move to own hook
        const { data: exportGoogleSheetData } = useQuery<
            ApiDownloadCsv | undefined,
            ApiError
        >({
            queryKey: [`google-sheets`],
            queryFn: () =>
                startGoogleSheetExportData
                    ? getCsvFileUrl(startGoogleSheetExportData)
                    : Promise.reject({
                          error: new Error(
                              "Couldn't create scheduler job for google sheets export",
                          ),
                      }),
            retry: (failureCount) => {
                if (failureCount === 5) {
                    resetStartGoogleSheetExport();
                    showToastError({
                        title: 'Unable to export to Google Sheets',
                    });
                    return false;
                }
                return true;
            },
            refetchInterval: (data) => {
                if (data?.url) return false;
                return 2000;
            },
            onSuccess: (data) => {
                if (data?.url && data.status === SchedulerJobStatus.COMPLETED) {
                    window.open(data.url, '_blank');
                    AppToaster.dismiss('exporting-gsheets');
                }
            },
            onError: () => {
                AppToaster.dismiss('exporting-gsheets');
            },
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            enabled: !!startGoogleSheetExportData,
        });

        useGdriveAccessToken({
            enabled: isGoogleAuthQueryEnabled,
            onSuccess: () => {
                startGoogleSheetExport();
                setIsGoogleAuthQueryEnabled(false);
            },
        });

        const isExportingGoogleSheets =
            !!startGoogleSheetExportData && !exportGoogleSheetData?.url;

        if (!hasGoogleDrive) {
            // We should not load this component on `ExporSelector` if google keys are not available
            console.warn('Using ExportGsheets without Google Drive API keys');
            return null;
        }

        if (asMenuItem) {
            return (
                <MenuItem2
                    icon={
                        isExportingGoogleSheets ? (
                            <Spinner size={16} />
                        ) : (
                            'export'
                        )
                    }
                    text="Export Google Sheets"
                    disabled={isExportingGoogleSheets || disabled}
                    shouldDismissPopover={false}
                    onClick={() => setIsGoogleAuthQueryEnabled(true)}
                />
            );
        }
        return (
            <Button
                size="xs"
                variant="default"
                loading={isExportingGoogleSheets}
                leftIcon={<MantineIcon icon={GsheetsIcon} />}
                onClick={() => setIsGoogleAuthQueryEnabled(true)}
                disabled={disabled}
            >
                Google Sheets
            </Button>
        );
    },
);

export default ExportGsheets;
