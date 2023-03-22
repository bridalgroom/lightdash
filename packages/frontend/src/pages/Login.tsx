import {
    ApiError,
    LightdashMode,
    LightdashUser,
    SEED_ORG_1_ADMIN_EMAIL,
    SEED_ORG_1_ADMIN_PASSWORD,
} from '@lightdash/common';
import { Anchor, Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import React, { FC, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useMutation } from 'react-query';
import { Redirect, useLocation } from 'react-router-dom';
import { lightdashApi } from '../api';
import {
    GoogleLoginButton,
    OktaLoginButton,
    OneLoginLoginButton,
} from '../components/common/GoogleLoginButton';
import Page from '../components/common/Page/Page';
import PageSpinner from '../components/PageSpinner';
import useToaster from '../hooks/toaster/useToaster';
import { useApp } from '../providers/AppProvider';
import { useTracking } from '../providers/TrackingProvider';
import LightdashLogo from '../svgs/lightdash-black.svg';
import {
    CardWrapper,
    Divider,
    DividerWrapper,
    FormWrapper,
    Logo,
    LogoWrapper,
    Title,
} from './SignUp.styles';

type LoginParams = { email: string; password: string };

const loginQuery = async (data: LoginParams) =>
    lightdashApi<LightdashUser>({
        url: `/login`,
        method: 'POST',
        body: JSON.stringify(data),
    });

const Login: FC = () => {
    const location = useLocation<{ from?: Location } | undefined>();
    const { health } = useApp();
    const { showToastError } = useToaster();
    const form = useForm<LoginParams>({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: isNotEmpty('Required field'),
            password: isNotEmpty('Required field'),
        },
    });

    const { identify } = useTracking();

    const { isIdle, isLoading, mutate } = useMutation<
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
            form.reset();
            showToastError({
                title: `Failed to login`,
                subtitle: error.error.message,
            });
        },
    });

    const allowPasswordAuthentication =
        !health.data?.auth.disablePasswordAuthentication;

    const isDemo = health.data?.mode === LightdashMode.DEMO;
    useEffect(() => {
        if (isDemo && isIdle) {
            mutate({
                email: SEED_ORG_1_ADMIN_EMAIL.email,
                password: SEED_ORG_1_ADMIN_PASSWORD.password,
            });
        }
    }, [isDemo, mutate, isIdle]);

    if (health.isLoading || isDemo) {
        return <PageSpinner />;
    }
    if (health.status === 'success' && health.data?.requiresOrgRegistration) {
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

    const ssoAvailable =
        !!health.data?.auth.google.oauth2ClientId ||
        health.data?.auth.okta.enabled ||
        health.data?.auth.oneLogin.enabled;
    const ssoLogins = ssoAvailable && (
        <>
            {health.data?.auth.google.oauth2ClientId && <GoogleLoginButton />}
            {health.data?.auth.okta.enabled && <OktaLoginButton />}
            {health.data?.auth.oneLogin.enabled && <OneLoginLoginButton />}
        </>
    );
    console.log(form.values);

    const passwordLogin = allowPasswordAuthentication && (
        <form
            name="login"
            onSubmit={form.onSubmit((values: LoginParams) => mutate(values))}
        >
            <Stack spacing="md">
                <TextInput
                    label="Email address"
                    name="email"
                    placeholder="Your email address"
                    withAsterisk
                    {...form.getInputProps('email')}
                    disabled={isLoading}
                />
                <PasswordInput
                    label="Password"
                    name="password"
                    placeholder="Your password"
                    withAsterisk
                    {...form.getInputProps('password')}
                    disabled={isLoading}
                />
                <Button type="submit" loading={isLoading}>
                    Sign in
                </Button>
                {health.data?.hasEmailClient && (
                    <Anchor href="/recover-password" mx="auto">
                        Forgot your password?
                    </Anchor>
                )}
            </Stack>
        </form>
    );

    const logins = (
        <>
            {ssoLogins}
            {ssoLogins && passwordLogin && (
                <DividerWrapper>
                    <Divider></Divider>
                    <b>OR</b>
                    <Divider></Divider>
                </DividerWrapper>
            )}
            {passwordLogin}
        </>
    );

    return (
        <Page isFullHeight>
            <Helmet>
                <title>Login - Lightdash</title>
            </Helmet>
            <FormWrapper>
                <LogoWrapper>
                    <Logo src={LightdashLogo} alt="lightdash logo" />
                </LogoWrapper>
                <CardWrapper elevation={2}>
                    <Title>Sign in</Title>
                    {logins}
                </CardWrapper>
            </FormWrapper>
        </Page>
    );
};

export default Login;
