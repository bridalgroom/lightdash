import { Button, Card, Colors, H2, Intent } from '@blueprintjs/core';
import {
    ApiError,
    LightdashMode,
    LightdashUser,
    SEED_EMAIL,
    SEED_PASSWORD,
} from 'common';
import React, { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Redirect, useLocation } from 'react-router-dom';
import { lightdashApi } from '../api';
import { GoogleLoginButton } from '../components/common/GoogleLoginButton';
import LinkButton from '../components/common/LinkButton';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import Form from '../components/ReactHookForm/Form';
import Input from '../components/ReactHookForm/Input';
import PasswordInput from '../components/ReactHookForm/PasswordInput';
import { useApp } from '../providers/AppProvider';
import { useTracking } from '../providers/TrackingProvider';

type LoginParams = { email: string; password: string };

const loginQuery = async (data: LoginParams) =>
    lightdashApi<LightdashUser>({
        url: `/login`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const Login: FC = () => {
    const location = useLocation<{ from?: Location } | undefined>();
    const { health, showToastError, showToastSuccess } = useApp();
    const methods = useForm<LoginParams>({
        mode: 'onSubmit',
    });
    const { identify } = useTracking();

    const { isLoading, mutate } = useMutation<
        LightdashUser,
        ApiError,
        LoginParams
    >(loginQuery, {
        mutationKey: ['login'],
        onSuccess: (data) => {
            identify({ id: data.userUuid });
            window.location.href = location.state?.from
                ? `${location.state.from.pathname}${location.state.from.search}`
                : '/';
        },
        onError: (error) => {
            showToastError({
                title: `Failed to login`,
                subtitle: error.error.message,
            });
        },
    });

    useEffect(() => {
        if (health.data?.mode === LightdashMode.DEMO) {
            methods.setValue('email', SEED_EMAIL.email);
            methods.setValue('password', SEED_PASSWORD.password);
        }
    }, [health, methods]);

    const handleLogin = (data: LoginParams) => {
        mutate(data);
    };

    if (health.isLoading) {
        return <PageSpinner />;
    }

    if (health.status === 'success' && health.data?.needsSetup) {
        return (
            <Redirect
                to={{
                    pathname: '/register',
                    state: { from: location.state?.from },
                }}
            />
        );
    }

    if (health.status === 'success' && health.data?.isAuthenticated) {
        return <Redirect to={{ pathname: '/' }} />;
    }

    return (
        <Page isFullHeight>
            <div
                style={{
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1,
                }}
            >
                <Card
                    style={{
                        padding: 25,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    elevation={2}
                >
                    <H2 style={{ marginBottom: 25 }}>Login</H2>
                    <Form name="login" methods={methods} onSubmit={handleLogin}>
                        <Input
                            label="Email"
                            name="email"
                            placeholder="Email"
                            disabled={isLoading}
                            rules={{
                                required: 'Required field',
                            }}
                        />
                        <PasswordInput
                            label="Password"
                            name="password"
                            placeholder="Enter your password..."
                            disabled={isLoading}
                            rules={{
                                required: 'Required field',
                            }}
                        />
                        <div
                            style={{
                                marginTop: 20,
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            {health.data?.hasEmailClient && (
                                <LinkButton
                                    href="/recover-password"
                                    minimal
                                    style={{
                                        marginRight: 10,
                                        color: Colors.GRAY1,
                                    }}
                                >
                                    Forgot password ?
                                </LinkButton>
                            )}
                            <Button
                                type="submit"
                                intent={Intent.PRIMARY}
                                text="Login"
                                loading={isLoading}
                                data-cy="login-button"
                            />
                        </div>
                    </Form>
                    {health.data?.auth.google.oauth2ClientId && (
                        <>
                            <span style={{ textAlign: 'center', margin: 15 }}>
                                <b>or</b>
                            </span>
                            <GoogleLoginButton />
                        </>
                    )}
                </Card>
            </div>
        </Page>
    );
};

export default Login;
