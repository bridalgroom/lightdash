import { subject } from '@casl/ability';
import {
    DashboardSearchResult,
    ForbiddenError,
    getDimensions,
    SavedChartSearchResult,
    SearchResults,
    SessionUser,
    SpaceSearchResult,
} from '@lightdash/common';
import { analytics } from '../../analytics/client';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SearchModel } from '../../models/SearchModel';
import { SpaceModel } from '../../models/SpaceModel';
import { UserAttributesModel } from '../../models/UserAttributesModel';
import { hasSpaceAccess } from '../SpaceService/SpaceService';
import { hasUserAttributes } from '../UserAttributesService/UserAttributeUtils';

type Dependencies = {
    searchModel: SearchModel;
    projectModel: ProjectModel;
    spaceModel: SpaceModel;
    userAttributesModel: UserAttributesModel;
};

export class SearchService {
    private readonly searchModel: SearchModel;

    private readonly projectModel: ProjectModel;

    private readonly spaceModel: SpaceModel;

    private readonly userAttributesModel: UserAttributesModel;

    constructor(dependencies: Dependencies) {
        this.searchModel = dependencies.searchModel;
        this.projectModel = dependencies.projectModel;
        this.spaceModel = dependencies.spaceModel;
        this.userAttributesModel = dependencies.userAttributesModel;
    }

    async getSearchResults(
        user: SessionUser,
        projectUuid: string,
        query: string,
    ): Promise<SearchResults> {
        const { organizationUuid } = await this.projectModel.get(projectUuid);

        if (
            user.ability.cannot(
                'view',
                subject('Project', {
                    organizationUuid,
                    projectUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        const results = await this.searchModel.search(projectUuid, query);
        const spaceUuids = [
            ...new Set([
                ...results.dashboards.map((dashboard) => dashboard.spaceUuid),
                ...results.savedCharts.map(
                    (savedChart) => savedChart.spaceUuid,
                ),
                ...results.spaces.map((space) => space.uuid),
            ]),
        ];
        const spaces = await Promise.all(
            spaceUuids.map((spaceUuid) =>
                this.spaceModel.getSpaceSummary(spaceUuid),
            ),
        );
        const filterItem = (
            item:
                | DashboardSearchResult
                | SpaceSearchResult
                | SavedChartSearchResult,
        ) => {
            const spaceUuid: string =
                'spaceUuid' in item ? item.spaceUuid : item.uuid;
            const itemSpace = spaces.find((s) => s.uuid === spaceUuid);
            return itemSpace && hasSpaceAccess(user, itemSpace, false);
        };

        const hasExploreAccess = user.ability.can(
            'manage',
            subject('Explore', {
                organizationUuid,
                projectUuid,
            }),
        );

        const dimensionsHaveUserAttributes = results.fields.some(
            (field) => field.requiredAttributes !== undefined,
        );

        let filteredFields = results.fields;
        if (dimensionsHaveUserAttributes) {
            // Do not make user attribute query if not needed
            const userAttributes = await this.userAttributesModel.find({
                organizationUuid,
                userUuid: user.userUuid,
            });
            filteredFields = results.fields.filter((field) =>
                hasUserAttributes(
                    user.userUuid,
                    field.requiredAttributes,
                    userAttributes,
                ),
            );
        }

        const filteredResults = {
            ...results,
            tables: hasExploreAccess ? results.tables : [],
            fields: hasExploreAccess ? filteredFields : [],
            dashboards: results.dashboards.filter(filterItem),
            savedCharts: results.savedCharts.filter(filterItem),
            spaces: results.spaces.filter(filterItem),
            pages: user.ability.can(
                'view',
                subject('Analytics', {
                    organizationUuid,
                }),
            )
                ? results.pages
                : [], // For now there is only 1 page and it is for admins only
        };
        analytics.track({
            event: 'project.search',
            userId: user.userUuid,
            properties: {
                projectId: projectUuid,
                spacesResultsCount: filteredResults.spaces.length,
                dashboardsResultsCount: filteredResults.dashboards.length,
                savedChartsResultsCount: filteredResults.savedCharts.length,
                tablesResultsCount: filteredResults.tables.length,
                fieldsResultsCount: filteredResults.fields.length,
            },
        });
        return filteredResults;
    }
}
