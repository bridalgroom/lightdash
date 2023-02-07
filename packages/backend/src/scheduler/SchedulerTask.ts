import { ScheduledSlackNotification } from '@lightdash/common';
import { nanoid } from 'nanoid';
import { slackClient } from '../clients/clients';
import { unfurlChartAndDashboard } from '../clients/Slack/SlackUnfurl';
import { lightdashConfig } from '../config/lightdashConfig';
import Logger from '../logger';
import { schedulerService, unfurlService } from '../services/services';
import { LightdashPage, Unfurl } from '../services/UnfurlService/UnfurlService';

const getChartOrDashboard = async (
    chartUuid: string | null,
    dashboardUuid: string | null,
) => {
    if (chartUuid) {
        const chart = await schedulerService.savedChartModel.get(chartUuid);
        return {
            url: `${lightdashConfig.siteUrl}/projects/${chart.projectUuid}/saved/${chartUuid}`,
            details: {
                name: chart.name,
                description: chart.description,
            },
            pageType: LightdashPage.CHART,
            organizationUuid: chart.organizationUuid,
        };
    }

    if (dashboardUuid) {
        const dashboard = await schedulerService.dashboardModel.getById(
            dashboardUuid,
        );
        return {
            url: `${lightdashConfig.siteUrl}/projects/${dashboard.projectUuid}/dashboards/${dashboardUuid}/view`,
            details: {
                name: dashboard.name,
                description: dashboard.description,
            },
            pageType: LightdashPage.DASHBOARD,
            organizationUuid: dashboard.organizationUuid,
        };
    }

    throw new Error("Chart or dashboard can't be both undefined");
};

export const sendSlackNotification = async (
    notification: ScheduledSlackNotification,
) => {
    if (!slackClient.isEnabled) {
        throw new Error('Slack app is not configured');
    }
    try {
        const {
            createdBy: userUuid,
            savedChartUuid,
            dashboardUuid,
            channel,
        } = notification;

        const { url, details, pageType, organizationUuid } =
            await getChartOrDashboard(savedChartUuid, dashboardUuid);

        const imageUrl = await unfurlService.unfurlImage(
            url,
            pageType,
            `slack-notification-image-${nanoid()}`,
            userUuid,
        );
        if (imageUrl === undefined) {
            throw new Error('Unable to unfurl image');
        }

        const unfurl: Unfurl = {
            title: details.name,
            description: details.description,
            imageUrl,
            pageType,
        };
        const blocks = unfurlChartAndDashboard(url, unfurl, true);

        slackClient.postMessage({
            organizationUuid,
            text: details.name,
            channel,
            blocks,
        });
    } catch (e) {
        Logger.error(
            `Unable to sendNotification on slack : ${JSON.stringify(e)}`,
        );
        throw e; // Cascade error to it can be retried by graphile
    }
};
