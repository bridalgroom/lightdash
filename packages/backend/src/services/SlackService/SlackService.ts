import { AuthorizationError } from '@lightdash/common';
import fetch from 'node-fetch';
import { analytics } from '../../analytics/client';
import { getUserUuid } from '../../clients/Slack/SlackStorage';
import { LightdashConfig } from '../../config/parseConfig';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { ShareModel } from '../../models/ShareModel';
import { SpaceModel } from '../../models/SpaceModel';
import { getAuthenticationToken } from '../../routers/headlessBrowser';
import { EncryptionService } from '../EncryptionService/EncryptionService';

const puppeteer = require('puppeteer');

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const uuidRegex = new RegExp(uuid, 'g');
const nanoid = '[\\w-]{21}';
const nanoidRegex = new RegExp(nanoid);

type SlackServiceDependencies = {
    lightdashConfig: LightdashConfig;
    dashboardModel: DashboardModel;
    savedChartModel: SavedChartModel;
    spaceModel: SpaceModel;
    shareModel: ShareModel;
    encryptionService: EncryptionService;
};

const notifySlackError = async (
    error: unknown,
    url: string,
    client: any,
    event: any,
): Promise<void> => {
    console.error(`Unable to unfurl url ${JSON.stringify(error)}`);

    const unfurls = {
        [url]: {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Unable to unfurl URL ${url}: ${error} `,
                    },
                },
            ],
        },
    };
    await client.chat
        .unfurl({
            ts: event.message_ts,
            channel: event.channel,
            unfurls,
        })
        .catch((er: any) =>
            console.error(`Unable to unfurl url ${JSON.stringify(er)}`),
        );
};

const uploadImage = async (
    screenshot: Buffer,
    client: any,
    event: any,
    context: any,
): Promise<string> => {
    // https://github.com/slackapi/node-slack-sdk/issues/1561
    const imageId = event.message_ts;

    const fileUpload = await client.files.upload({
        channels: event.channel,
        file: screenshot,
        filename: `dashboard-screenshot-${imageId}.png`,
        thread_ts: event.message_ts, // Upload on thread
    });

    const publicImage = await client.files.sharedPublicURL({
        file: fileUpload.file.id,
        token: context.userToken,
    });

    const permalink = publicImage?.file?.permalink_public;
    const permalinkParts = permalink.split('-');
    const pubSecret = permalinkParts[permalinkParts.length - 1];
    const imageUrl = `${publicImage?.file.url_private}?pub_secret=${pubSecret}`;
    return imageUrl;
};

const fetchDashboardScreenshot = async (
    url: string,
    cookie: string,
): Promise<Buffer> => {
    let browser;

    try {
        const browserWSEndpoint = `ws://${process.env.HEADLESS_BROWSER_HOST}:${process.env.HEADLESS_BROWSER_PORT}`;
        browser = await puppeteer.connect({
            browserWSEndpoint,
        });

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({ cookie });

        await page.setViewport({
            width: 1024,
            height: 768, // hardcoded
        });

        const blockedUrls = [
            'headwayapp.co',
            'rudderlabs.com',
            'analytics.lightdash.com',
            'cohere.so',
            'intercom.io',
        ];
        await page.setRequestInterception(true);
        page.on('request', (request: any) => {
            const requestUrl = request.url();
            if (blockedUrls.includes(requestUrl)) {
                request.abort();
                return;
            }

            request.continue();
        });
        console.debug('chrome url', url);
        await page.goto(url, {
            timeout: 100000,
            waitUntil: 'networkidle0',
        });
        const path = `/tmp/${encodeURIComponent(url)}.png`;
        const imageBuffer = await page.screenshot({
            path,
            clip: { x: 0, y: 0, width: 1024, height: 768 },
        });

        return imageBuffer;
        // return path
    } catch (e) {
        console.error(`Unable to fetch screenshots from headless chromeo ${e}`);
        return e;
    } finally {
        if (browser) await browser.close();
    }
};

const getUserCookie = async (userUuid: string): Promise<string> => {
    const token = getAuthenticationToken(userUuid);

    const hostname =
        process.env.NODE_ENV === 'development'
            ? 'lightdash-dev'
            : process.env.RENDER_SERVICE_NAME;

    const response = await fetch(
        `http://${hostname}:3000/api/v1/headless-browser/login/${userUuid}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        },
    );
    if (response.status !== 200) {
        throw new Error(
            `Unable to get cookie for user ${userUuid}: ${await response.text()}`,
        );
    }
    const header = response.headers.get('set-cookie');
    if (header === null) {
        const loginBody = await response.json();
        throw new AuthorizationError(
            `Cannot sign in:\n${JSON.stringify(loginBody)}`,
        );
    }
    return header;
};

export class SlackService {
    lightdashConfig: LightdashConfig;

    dashboardModel: DashboardModel;

    savedChartModel: SavedChartModel;

    spaceModel: SpaceModel;

    shareModel: ShareModel;

    encryptionService: EncryptionService;

    constructor({
        lightdashConfig,
        dashboardModel,
        savedChartModel,
        spaceModel,
        shareModel,
        encryptionService,
    }: SlackServiceDependencies) {
        this.lightdashConfig = lightdashConfig;
        this.dashboardModel = dashboardModel;
        this.savedChartModel = savedChartModel;
        this.spaceModel = spaceModel;
        this.shareModel = shareModel;
        this.encryptionService = encryptionService;
    }

    private async unfurlChart(url: string, imageUrl: string): Promise<any> {
        const [projectUuid, chartUuid] = (await url.match(uuidRegex)) || [];

        const chart = this.savedChartModel.get(chartUuid);
        return {
            [url]: {
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: 'Chart unfurls not implemented',
                        },
                    },
                ],
            },
        };
    }

    private async unfurlDashboard(url: string, imageUrl: string): Promise<any> {
        const [projectUuid, dashboardUuid] = (await url.match(uuidRegex)) || [];

        const dashboard = await this.dashboardModel.getById(dashboardUuid);

        // https://api.slack.com/reference/block-kit/blocks
        // https://app.slack.com/block-kit-builder/T0163M87MB9#%7B%22blocks%22:%5B%5D%7D
        const unfurls = {
            [url]: {
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: dashboard.name,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `${dashboard.description || '-'}`,
                        },
                        accessory: {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Open in Lightdash',
                                emoji: true,
                            },
                            value: 'click_me_123',
                            url,
                            action_id: 'button-action',
                        },
                    },
                    {
                        type: 'image',
                        image_url: imageUrl,
                        alt_text: dashboard.name,
                    },
                ],
            },
        };
        return unfurls;
    }

    private async getSharedUrl(linkUrl: string): Promise<string> {
        return linkUrl;
        // We currently don't support charts or dashboards with shared URL, so we don't need this right now
        const [shareId] = linkUrl.match(nanoidRegex) || [];
        const shareUrl = await this.shareModel.getSharedUrl(shareId);
        return shareUrl.url || '';
    }

    private async parseUrl(
        linkUrl: string,
    ): Promise<{ isValid: boolean; isDashboard?: boolean; url: string }> {
        if (
            process.env.NODE_ENV === 'development' ||
            !linkUrl.startsWith(this.lightdashConfig.siteUrl)
        ) {
            console.warn(
                `URL to unfurl ${linkUrl} does not belong to this siteUrl ${this.lightdashConfig.siteUrl}, ignoring.`,
            );
            return {
                isValid: false,
                url: linkUrl,
            };
        }

        const shareUrl = new RegExp(`/share/${nanoid}`);
        const url = linkUrl.match(shareUrl)
            ? await this.getSharedUrl(linkUrl)
            : linkUrl;

        const dashboardUrl = new RegExp(`/projects/${uuid}/dashboards/${uuid}`);
        const chartUrl = new RegExp(`/projects/${uuid}/saved/${uuid}`);

        const isDashboard = url.match(dashboardUrl) !== null;
        const isChart = url.match(chartUrl) !== null;
        if (isDashboard || isChart) {
            return {
                isValid: true,
                isDashboard,
                url: linkUrl,
            };
        }
        console.warn(`URL to unfurl ${url} is not valid`);
        return {
            isValid: false,
            url,
        };
    }

    async unfurl(event: any, client: any, context: any): Promise<void> {
        event.links.map(async (l: any) => {
            const { isValid, isDashboard, url } = await this.parseUrl(l.url);

            if (!isValid || isDashboard === undefined || url === undefined) {
                return;
            }

            const userUuid = await getUserUuid(context);
            const cookie = await getUserCookie(userUuid);
            console.debug(`got cookie for user ${userUuid} : ${cookie}`);
            analytics.track({
                event: 'share_slack.unfurl',
                userId: event.user,
                properties: {
                    isDashboard,
                },
            });

            try {
                const screenshot = await fetchDashboardScreenshot(url, cookie);

                const imageUrl = await uploadImage(
                    screenshot,
                    client,
                    event,
                    context,
                );

                const unfurls = await (isDashboard
                    ? this.unfurlDashboard(url, imageUrl)
                    : this.unfurlChart(url, imageUrl));
                client.chat
                    .unfurl({
                        ts: event.message_ts,
                        channel: event.channel,
                        unfurls,
                    })
                    .catch((e: any) => {
                        analytics.track({
                            event: 'share_slack.unfurl_error',
                            userId: event.user,
                            properties: {
                                error: `${e}`,
                            },
                        });
                        console.error(
                            `Unable to unfurl url ${url}: ${JSON.stringify(e)}`,
                        );
                    });
            } catch (e) {
                analytics.track({
                    event: 'share_slack.unfurl_error',
                    userId: event.user,

                    properties: {
                        error: `${e}`,
                    },
                });

                notifySlackError(e, url, client, event);
            }
        });
    }
}
