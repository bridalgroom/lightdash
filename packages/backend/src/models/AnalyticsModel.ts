import { OrganizationMemberRole } from '@lightdash/common';
import { Knex } from 'knex';
import {
    AnalyticsChartViewsTableName,
    AnalyticsDashboardViewsTableName,
} from '../database/entities/analytics';
import { OrganizationMembershipsTableName } from '../database/entities/organizationMemberships';
import { OrganizationTableName } from '../database/entities/organizations';
import { UserTableName } from '../database/entities/users';

type Dependencies = {
    database: Knex;
};
export class AnalyticsModel {
    private database: Knex;

    constructor(dependencies: Dependencies) {
        this.database = dependencies.database;
    }

    async countChartViews(chartUuid: string): Promise<number> {
        const [{ count }] = await this.database(AnalyticsChartViewsTableName)
            .count('chart_uuid')
            .where('chart_uuid', chartUuid);

        return Number(count);
    }

    async addChartViewEvent(
        chartUuid: string,
        userUuid: string,
    ): Promise<void> {
        await this.database(AnalyticsChartViewsTableName).insert({
            chart_uuid: chartUuid,
            user_uuid: userUuid,
        });
    }

    async countDashboardViews(dashboardUuid: string): Promise<number> {
        const [{ count }] = await this.database(
            AnalyticsDashboardViewsTableName,
        )
            .count('dashboard_uuid')
            .where('dashboard_uuid', dashboardUuid);

        return Number(count);
    }

    async addDashboardViewEvent(
        dashboardUuid: string,
        userUuid: string,
    ): Promise<void> {
        await this.database(AnalyticsDashboardViewsTableName).insert({
            dashboard_uuid: dashboardUuid,
            user_uuid: userUuid,
        });
    }

    async getUserActivity(
        projectUuid: string,
        organizationUuid: string,
    ): Promise<{}> {
        const orgUsers = await this.database(OrganizationTableName)
            .leftJoin(
                OrganizationMembershipsTableName,
                `${OrganizationMembershipsTableName}.organization_id`,
                `${OrganizationTableName}.organization_id`,
            )
            .leftJoin(
                UserTableName,
                `${UserTableName}.user_id`,
                `${OrganizationMembershipsTableName}.user_id`,
            )
            .where(
                `${OrganizationTableName}.organization_uuid`,
                organizationUuid,
            )
            .andWhereNot('role', 'member')
            .select(
                `${UserTableName}.user_uuid`,
                `${UserTableName}.first_name`,
                `${OrganizationMembershipsTableName}.role`,
            );

        const projectMemberships = await this.database('project_memberships')
            .leftJoin('users', 'project_memberships.user_id', 'users.user_id')
            .leftJoin('emails', 'emails.user_id', 'users.user_id')
            .leftJoin(
                'projects',
                'project_memberships.project_id',
                'projects.project_id',
            )
            .select(
                `${UserTableName}.user_uuid`,
                `${UserTableName}.first_name`,
                `project_memberships.role`,
            )
            .where('project_uuid', projectUuid)
            .andWhere('is_primary', true);

        const orgMembersInProject = projectMemberships.filter(
            (user) =>
                orgUsers.find(
                    (orgUser) => orgUser.user_uuid === user.user_uuid,
                ) === undefined,
        );

        const usersInProject = [...orgUsers, ...orgMembersInProject];

        const weeklyQueryingUsers = await this.database.raw(`
               select 
               100 * ROUND(COUNT(DISTINCT(user_uuid))) / ${usersInProject.length} AS percent_weekly_active_users
               from analytics_chart_views
               WHERE timestamp between NOW() - interval '7 days' and NOW()

        `);

        const usersWithMostQueries = await this.database.raw(`
            select 
            users.user_uuid, users.first_name, users.last_name, COUNT(analytics_chart_views.user_uuid)
            from analytics_chart_views
            LEFT JOIN users ON users.user_uuid = analytics_chart_views.user_uuid
            WHERE timestamp between NOW() - interval '7 days' and NOW()
            GROUP BY users.user_uuid, users.first_name, users.last_name
            ORDER BY COUNT(analytics_chart_views.user_uuid) DESC
            limit 10

    `);

        const usersCreatedMostCharts = await this.database.raw(`
        select 
        users.user_uuid, users.first_name, users.last_name, COUNT(saved_queries_versions.updated_by_user_uuid)
        from saved_queries_versions
        LEFT JOIN users ON users.user_uuid = saved_queries_versions.updated_by_user_uuid
        WHERE saved_queries_versions.created_at between NOW() - interval '7 days' and NOW()
        GROUP BY users.user_uuid, users.first_name, users.last_name
        ORDER BY COUNT(saved_queries_versions.updated_by_user_uuid) DESC
        limit 10

    `);

        const usersNotLoggedIn = await this.database.raw(`
        select 
        users.user_uuid, users.first_name, users.last_name, expired       
        from sessions
        LEFT JOIN users ON users.user_uuid::text = sessions.sess->'passport'->>'user'
        WHERE sessions.expired < NOW() - interval '90 days'
        ORDER BY expired ASC
        limit 10

    `);
        return {
            numberOfUsers: usersInProject.length,
            numberOfViewers: usersInProject.filter(
                (user) => user.role === OrganizationMemberRole.VIEWER,
            ).length,
            numberOfEditors: usersInProject.filter(
                (user) => user.role === OrganizationMemberRole.EDITOR,
            ).length,
            numberOfAdmins: usersInProject.filter(
                (user) => user.role === OrganizationMemberRole.ADMIN,
            ).length,
            weeklyQueryingUsers: `${weeklyQueryingUsers.rows[0].percent_weekly_active_users.toFixed(
                2,
            )}`,
            usersWithMostQueries: usersWithMostQueries.rows,
            usersCreatedMostCharts: usersCreatedMostCharts.rows,
            usersNotLoggedIn: usersNotLoggedIn.rows,
        };
    }
}
