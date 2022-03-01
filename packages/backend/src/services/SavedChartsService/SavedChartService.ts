import {
    CreateSavedChart,
    CreateSavedChartVersion,
    SavedChart,
    SessionUser,
    UpdateSavedChart,
} from 'common';
import { analytics } from '../../analytics/client';
import { ForbiddenError, NotExistsError } from '../../errors';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';

type Dependencies = {
    projectModel: ProjectModel;
    savedChartModel: SavedChartModel;
};

export class SavedChartService {
    private readonly projectModel: ProjectModel;

    private readonly savedChartModel: SavedChartModel;

    constructor(dependencies: Dependencies) {
        this.projectModel = dependencies.projectModel;
        this.savedChartModel = dependencies.savedChartModel;
    }

    async createVersion(
        user: SessionUser,
        savedChartUuid: string,
        data: CreateSavedChartVersion,
    ): Promise<SavedChart> {
        if (user.ability.cannot('update', 'SavedChart')) {
            throw new ForbiddenError();
        }
        const savedChart = await this.savedChartModel.createVersion(
            savedChartUuid,
            data,
        );
        analytics.track({
            event: 'saved_chart_version.created',
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            properties: {
                savedQueryId: savedChart.uuid,
            },
        });
        return savedChart;
    }

    async update(
        user: SessionUser,
        savedChartUuid: string,
        data: UpdateSavedChart,
    ): Promise<SavedChart> {
        if (user.ability.cannot('update', 'SavedChart')) {
            throw new ForbiddenError();
        }
        const savedChart = await this.savedChartModel.update(
            savedChartUuid,
            data,
        );
        analytics.track({
            event: 'saved_chart.updated',
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            properties: {
                savedQueryId: savedChartUuid,
            },
        });
        return savedChart;
    }

    async delete(user: SessionUser, savedChartUuid: string): Promise<void> {
        if (user.ability.cannot('delete', 'SavedChart')) {
            throw new ForbiddenError();
        }
        await this.savedChartModel.delete(savedChartUuid);
        analytics.track({
            event: 'saved_chart.deleted',
            userId: user.userUuid,
            organizationId: user.organizationUuid,
            properties: {
                savedQueryId: savedChartUuid,
            },
        });
    }

    async get(savedChartUuid: string): Promise<SavedChart> {
        return this.savedChartModel.get(savedChartUuid);
    }

    async create(
        user: SessionUser,
        projectUuid: string,
        savedChart: CreateSavedChart,
    ): Promise<SavedChart> {
        if (user.ability.cannot('create', 'SavedChart')) {
            throw new ForbiddenError();
        }
        const newSavedChart = await this.savedChartModel.create(
            projectUuid,
            savedChart,
        );
        analytics.track({
            event: 'saved_chart.created',
            projectId: projectUuid,
            organizationId: user.organizationUuid,
            userId: user.userUuid,
            properties: {
                savedQueryId: newSavedChart.uuid,
            },
        });
        return newSavedChart;
    }

    async hasSavedCharts(user: SessionUser): Promise<boolean> {
        const { organizationUuid } = user;
        if (organizationUuid === undefined) {
            throw new NotExistsError('Organization not found');
        }
        const project = await this.projectModel.getDefaultProject(
            organizationUuid,
        );
        const spaces = await this.savedChartModel.getAllSpaces(
            project.projectUuid,
        );

        return spaces.some((space) => space.queries.length > 0);
    }
}
