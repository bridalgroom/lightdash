import { ForbiddenError, OnboardingStatus } from 'common';
import express from 'express';
import {
    isAuthenticated,
    unauthorisedInDemo,
} from '../controllers/authentication';
import {
    organizationService,
    projectService,
    userService,
} from '../services/services';

export const organizationRouter = express.Router();

organizationRouter.get('/', isAuthenticated, async (req, res, next) =>
    organizationService
        .get(req.user!)
        .then((results) => {
            res.json({
                status: 'ok',
                results,
            });
        })
        .catch(next),
);

organizationRouter.patch(
    '/',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) =>
        organizationService
            .updateOrg(req.user!, req.body)
            .then(() => {
                res.json({
                    status: 'ok',
                });
            })
            .catch(next),
);

organizationRouter.get('/projects', isAuthenticated, async (req, res, next) =>
    organizationService
        .getProjects(req.user!)
        .then((results) => {
            res.json({
                status: 'ok',
                results,
            });
        })
        .catch(next),
);

organizationRouter.post('/projects', isAuthenticated, async (req, res, next) =>
    projectService
        .create(req.user!, req.body)
        .then((results) => {
            res.json({
                status: 'ok',
                results,
            });
        })
        .catch(next),
);

organizationRouter.delete(
    '/projects/:projectUuid',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) =>
        projectService
            .delete(req.params.projectUuid, req.user!)
            .then((results) => {
                res.json({
                    status: 'ok',
                    results,
                });
            })
            .catch(next),
);

organizationRouter.get('/users', isAuthenticated, async (req, res, next) =>
    organizationService
        .getUsers(req.user!)
        .then((results) => {
            res.json({
                status: 'ok',
                results,
            });
        })
        .catch(next),
);

organizationRouter.patch(
    '/users/:userUuid',
    isAuthenticated,
    async (req, res, next) => {
        organizationService
            .updateMember(req.user!, req.params.userUuid, req.body)
            .then((results) => {
                res.json({
                    status: 'ok',
                    results,
                });
            })
            .catch(next);
    },
);

organizationRouter.delete(
    '/user/:userUuid',
    isAuthenticated,
    unauthorisedInDemo,
    async (req, res, next) => {
        if (req.user!.userUuid === req.params.userUuid) {
            throw new ForbiddenError('User can not delete themself');
        }

        await userService
            .delete(req.user!, req.params.userUuid)
            .then(() => {
                res.json({
                    status: 'ok',
                    results: undefined,
                });
            })
            .catch(next);
    },
);

organizationRouter.get(
    '/onboardingStatus',
    isAuthenticated,
    async (req, res, next) => {
        try {
            const onboarding = await organizationService.getOnboarding(
                req.user!,
            );
            const results: OnboardingStatus = {
                isComplete: !!onboarding.shownSuccessAt,
                ranQuery: !!onboarding.ranQueryAt,
            };
            res.json({
                status: 'ok',
                results,
            });
        } catch (e) {
            next(e);
        }
    },
);

organizationRouter.post(
    '/onboardingStatus/shownSuccess',
    isAuthenticated,
    async (req, res, next) => {
        try {
            await organizationService.setOnboardingSuccessDate(req.user!);
            res.json({
                status: 'ok',
                results: undefined,
            });
        } catch (e) {
            next(e);
        }
    },
);
