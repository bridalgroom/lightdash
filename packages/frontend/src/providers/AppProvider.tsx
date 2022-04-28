import { Intent } from '@blueprintjs/core';
import { IToastProps } from '@blueprintjs/core/src/components/toast/toast';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import MDEditor from '@uiw/react-md-editor';
import Cohere from 'cohere-js';
import {
    ApiError,
    ApiHealthResults,
    defineAbilityForOrganizationMember,
    HealthState,
    Job,
    LightdashUser,
    OrganizationMemberAbility,
} from 'common';
import React, {
    createContext,
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useQuery } from 'react-query';
import { UseQueryResult } from 'react-query/types/react/types';
import { lightdashApi } from '../api';
import { AppToaster } from '../components/AppToaster';
import { ErrorLogs, useErrorLogs } from '../hooks/useErrorLogs';
import { useGetRefreshData } from '../hooks/useRefreshServer';

const getHealthState = async () =>
    lightdashApi<ApiHealthResults>({
        url: `/health`,
        method: 'GET',
        body: undefined,
    });

type User = LightdashUser & { ability: OrganizationMemberAbility };
const getUserState = async (): Promise<User> => {
    const user = await lightdashApi<LightdashUser>({
        url: `/user`,
        method: 'GET',
        body: undefined,
    });
    return { ...user, ability: defineAbilityForOrganizationMember(user) };
};

interface Message extends Omit<IToastProps, 'message'> {
    title: string;
    subtitle?: string;
    key?: string;
}

interface AppContext {
    health: UseQueryResult<HealthState, ApiError>;
    user: UseQueryResult<User, ApiError>;
    isRefreshStepsOpen: boolean;
    setIsRefreshStepsOpen: Dispatch<SetStateAction<boolean>>;
    jobId: string | undefined;
    setJobId: Dispatch<SetStateAction<any>>;
    statusInfo: Job | undefined;
    showToastSuccess: (props: Message) => void;
    showToastError: (props: Message) => void;
    showToastInfo: (props: Message) => void;
    errorLogs: ErrorLogs;
}

const Context = createContext<AppContext>(undefined as any);

export const AppProvider: FC = ({ children }) => {
    const [isSentryLoaded, setIsSentryLoaded] = useState(false);
    const [isCohereLoaded, setIsCohereLoaded] = useState(false);
    const [isChatwootLoaded, setIsChatwootLoaded] = useState(false);
    const [isRefreshStepsOpen, setIsRefreshStepsOpen] = useState(false);
    const [jobId, setJobId] = useState();

    const { data: statusInfo } = useGetRefreshData(jobId);

    const health = useQuery<HealthState, ApiError>({
        queryKey: 'health',
        queryFn: getHealthState,
    });
    const user = useQuery<User, ApiError>({
        queryKey: 'user',
        queryFn: getUserState,
        enabled: !!health.data?.isAuthenticated,
        retry: false,
    });
    const [isHeadwayLoaded, setIsHeadwayLoaded] = useState(false);

    useEffect(() => {
        if (health.data && !isSentryLoaded && health.data.sentry.dsn) {
            Sentry.init({
                dsn: health.data.sentry.dsn,
                release: health.data.sentry.release,
                environment: health.data.sentry.environment,
                integrations: [new Integrations.BrowserTracing()],
                tracesSampleRate: 1.0,
            });
            setIsSentryLoaded(true);
        }
    }, [isSentryLoaded, setIsSentryLoaded, health]);

    useEffect(() => {
        if (
            !isCohereLoaded &&
            health.data &&
            health.data.cohere.token.length > 0
        ) {
            Cohere.init(health.data.cohere.token);
            setIsCohereLoaded(true);
        }
        if (user.data) {
            Cohere.identify(user.data.userUuid, {
                displayName: `${user.data.firstName} ${user.data.lastName}`,
                email: user.data.email,
            });
        }
    }, [health, isCohereLoaded, user]);

    useEffect(() => {
        if (
            !isChatwootLoaded &&
            health.data &&
            health.data.chatwoot.websiteToken.length > 0 &&
            health.data.chatwoot.baseUrl.length > 0
        ) {
            (window as any).chatwootSettings = {
                hideMessageBubble: true,
                position: 'right',
                locale: 'en',
                type: 'standard',
            };
            const script = document.createElement('script');
            const ref = document.getElementsByTagName('script')[0];
            script.src = `${health.data.chatwoot.baseUrl}/packs/js/sdk.js`;
            script.defer = true;
            script.async = true;
            ref.parentNode?.insertBefore(script, ref);
            script.onload = () => {
                (window as any).chatwootSDK.run({
                    websiteToken: health.data.chatwoot.websiteToken,
                    baseUrl: health.data.chatwoot.baseUrl,
                });
            };
            setIsChatwootLoaded(true);
        }
    }, [isChatwootLoaded, health, user]);

    useEffect(() => {
        if (!isHeadwayLoaded) {
            const script = document.createElement('script');
            script.async = false;
            script.src = 'https://cdn.headwayapp.co/widget.js';
            document.head.appendChild(script);
            setIsHeadwayLoaded(true);
        }
    }, [isHeadwayLoaded, health]);

    const showToastSuccess = useCallback<AppContext['showToastSuccess']>(
        ({ title, subtitle, key, ...rest }) => {
            AppToaster.show(
                {
                    intent: Intent.SUCCESS,
                    icon: 'tick-circle',
                    timeout: 5000,
                    message: (
                        <div>
                            <p style={{ fontWeight: 'bold', marginBottom: 0 }}>
                                {title}
                            </p>
                            {subtitle && (
                                <MDEditor.Markdown
                                    source={subtitle}
                                    linkTarget="_blank"
                                />
                            )}
                        </div>
                    ),
                    ...rest,
                },
                key || title,
            );
        },
        [],
    );

    const showToastError = useCallback<AppContext['showToastError']>(
        (props) => {
            showToastSuccess({
                intent: Intent.DANGER,
                icon: 'error',
                ...props,
            });
        },
        [showToastSuccess],
    );

    const showToastInfo = useCallback<AppContext['showToastInfo']>(
        (props) => {
            showToastSuccess({
                intent: Intent.NONE,
                icon: 'info-sign',
                ...props,
            });
        },
        [showToastSuccess],
    );

    const errorLogs = useErrorLogs();

    const value = {
        health,
        user,
        showToastSuccess,
        showToastError,
        showToastInfo,
        isRefreshStepsOpen,
        setIsRefreshStepsOpen,
        jobId,
        setJobId,
        statusInfo,
        errorLogs,
    };

    useEffect(() => {
        if (health.error) {
            const [first, ...rest] = health.error.error.message.split('\n');
            AppToaster.show(
                {
                    intent: 'danger',
                    message: (
                        <div>
                            <b>{first}</b>
                            <p>{rest.join('\n')}</p>
                        </div>
                    ),
                    timeout: 0,
                    icon: 'error',
                },
                first,
            );
        }
    }, [health]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useApp(): AppContext {
    const context = useContext(Context);
    if (context === undefined) {
        throw new Error('useApp must be used within a AppProvider');
    }
    return context;
}
