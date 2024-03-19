import { Knex } from 'knex';
import { LightdashConfig } from '../config/parseConfig';
import { EncryptionService } from '../services/EncryptionService/EncryptionService';
import { AnalyticsModel } from './AnalyticsModel';
import { CommentModel } from './CommentModel/CommentModel';
import { DashboardModel } from './DashboardModel/DashboardModel';
import { PersonalAccessTokenModel } from './DashboardModel/PersonalAccessTokenModel';
import { DownloadFileModel } from './DownloadFileModel';
import { EmailModel } from './EmailModel';
import { GithubAppInstallationsModel } from './GithubAppInstallations/GithubAppInstallationsModel';
import { GroupsModel } from './GroupsModel';
import { InviteLinkModel } from './InviteLinkModel';
import { JobModel } from './JobModel/JobModel';
import { MigrationModel } from './MigrationModel/MigrationModel';
import { NotificationsModel } from './NotificationsModel/NotificationsModel';
import { OnboardingModel } from './OnboardingModel/OnboardingModel';
import { OpenIdIdentityModel } from './OpenIdIdentitiesModel';
import { OrganizationAllowedEmailDomainsModel } from './OrganizationAllowedEmailDomainsModel';
import { OrganizationMemberProfileModel } from './OrganizationMemberProfileModel';
import { OrganizationModel } from './OrganizationModel';
import { PasswordResetLinkModel } from './PasswordResetLinkModel';
import { PinnedListModel } from './PinnedListModel';
import { ProjectModel } from './ProjectModel/ProjectModel';
import { ResourceViewItemModel } from './ResourceViewItemModel';
import { SavedChartModel } from './SavedChartModel';
import { SchedulerModel } from './SchedulerModel';
import { SearchModel } from './SearchModel';
import { SessionModel } from './SessionModel';
import { ShareModel } from './ShareModel';
import { SlackAuthenticationModel } from './SlackAuthenticationModel';
import { SpaceModel } from './SpaceModel';
import { SshKeyPairModel } from './SshKeyPairModel';
import { UserAttributesModel } from './UserAttributesModel';
import { UserModel } from './UserModel';
import { UserWarehouseCredentialsModel } from './UserWarehouseCredentials/UserWarehouseCredentialsModel';
import { ValidationModel } from './ValidationModel/ValidationModel';

/**
 * Interface outlining all models. Add new models to
 * this list (in alphabetical order, please!).
 */

export type ModelManifest = {
    analyticsModel: AnalyticsModel;
    commentModel: CommentModel;
    dashboardModel: DashboardModel;
    downloadFileModel: DownloadFileModel;
    emailModel: EmailModel;
    githubAppInstallationsModel: GithubAppInstallationsModel;
    groupsModel: GroupsModel;
    inviteLinkModel: InviteLinkModel;
    jobModel: JobModel;
    migrationModel: MigrationModel;
    notificationsModel: NotificationsModel;
    onboardingModel: OnboardingModel;
    openIdIdentityModel: OpenIdIdentityModel;
    organizationAllowedEmailDomainsModel: OrganizationAllowedEmailDomainsModel;
    organizationMemberProfileModel: OrganizationMemberProfileModel;
    organizationModel: OrganizationModel;
    passwordResetLinkModel: PasswordResetLinkModel;
    personalAccessTokenModel: PersonalAccessTokenModel;
    pinnedListModel: PinnedListModel;
    projectModel: ProjectModel;
    resourceViewItemModel: ResourceViewItemModel;
    savedChartModel: SavedChartModel;
    schedulerModel: SchedulerModel;
    searchModel: SearchModel;
    sessionModel: SessionModel;
    shareModel: ShareModel;
    slackAuthenticationModel: SlackAuthenticationModel;
    spaceModel: SpaceModel;
    sshKeyPairModel: SshKeyPairModel;
    userAttributesModel: UserAttributesModel;
    userModel: UserModel;
    userWarehouseCredentialsModel: UserWarehouseCredentialsModel;
    validationModel: ValidationModel;
};

/**
 * Enforces the presence of getter methods for all models declared in the manifest.
 */
type ModelFactoryMethod<T extends ModelManifest> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type ModelProvider<T extends ModelManifest> = (providerArgs: {
    repository: ModelRepository;
}) => T[keyof T];

/**
 * Structure for describing model providers:
 *
 *   <modelName> -> providerMethod
 */
export type ModelProviderMap<T extends ModelManifest = ModelManifest> =
    Partial<{
        [K in keyof T]: ModelProvider<T>;
    }>;

/**
 * Intermediate abstract class used to enforce model factory methods via the `ModelFactoryMethod`
 * type. We need this extra thin layer to ensure we are statically aware of all members.
 */
abstract class ModelRepositoryBase {
    /**
     * Container for model provider overrides. Providers can be defined when instancing
     * the model repository, and take precedence when instancing the given model.
     *
     * Providers receive an instance of the current OperationContext, and the parent
     * ModelRepository instance.
     *
     * new ModelRepository({
     *    modelProviders: {
     *      encryptionModel: ({ repository, context }) => {
     *          return new EncryptionModelOverride(...);
     *      }
     *    }
     * })
     *
     * NOTE: This exact implementation is temporary, and is likely to be adjusted soon
     * as part of the dependency injection rollout.
     */
    protected providers: ModelProviderMap;

    protected readonly lightdashConfig: LightdashConfig;

    /**
     * Knex database instance, used for all database operations.
     */
    protected readonly database: Knex;

    constructor({
        modelProviders,
        lightdashConfig,
        database,
    }: {
        modelProviders?: ModelProviderMap<ModelManifest>;
        lightdashConfig: LightdashConfig;
        database: Knex;
    }) {
        this.providers = modelProviders ?? {};
        this.lightdashConfig = lightdashConfig;
        this.database = database;
    }
}

/**
 * Bare model repository class, which acts as a container for all existing
 * models, and as a point to share instantiation and common logic.
 *
 * If you need to access a model, you should do it through an instance of this
 * repository - ideally one that you accessed through a controller, or otherwise
 * via dependency injection.
 *
 */
export class ModelRepository
    extends ModelRepositoryBase
    implements ModelFactoryMethod<ModelManifest>
{
    /**
     * Holds memoized instances of models after their initial instantiation:
     */
    protected modelInstances: Partial<ModelManifest> = {};

    public getAnalyticsModel(): AnalyticsModel {
        return this.getModel(
            'analyticsModel',
            () => new AnalyticsModel({ database: this.database }),
        );
    }

    public getCommentModel(): CommentModel {
        return this.getModel(
            'commentModel',
            () => new CommentModel({ database: this.database }),
        );
    }

    public getDashboardModel(): DashboardModel {
        return this.getModel(
            'dashboardModel',
            () => new DashboardModel({ database: this.database }),
        );
    }

    public getDownloadFileModel(): DownloadFileModel {
        return this.getModel(
            'downloadFileModel',
            () => new DownloadFileModel({ database: this.database }),
        );
    }

    public getEmailModel(): EmailModel {
        return this.getModel(
            'emailModel',
            () => new EmailModel({ database: this.database }),
        );
    }

    public getGithubAppInstallationsModel(): GithubAppInstallationsModel {
        return this.getModel(
            'githubAppInstallationsModel',
            () =>
                new GithubAppInstallationsModel({
                    database: this.database,
                    encryptionService: new EncryptionService({
                        lightdashConfig: this.lightdashConfig,
                    }),
                }),
        );
    }

    public getGroupsModel(): GroupsModel {
        return this.getModel(
            'groupsModel',
            () => new GroupsModel({ database: this.database }),
        );
    }

    public getInviteLinkModel(): InviteLinkModel {
        return this.getModel(
            'inviteLinkModel',
            () =>
                new InviteLinkModel({
                    database: this.database,
                    lightdashConfig: this.lightdashConfig,
                }),
        );
    }

    public getJobModel(): JobModel {
        return this.getModel(
            'jobModel',
            () => new JobModel({ database: this.database }),
        );
    }

    public getMigrationModel(): MigrationModel {
        return this.getModel(
            'migrationModel',
            () => new MigrationModel({ database: this.database }),
        );
    }

    public getNotificationsModel(): NotificationsModel {
        return this.getModel(
            'notificationsModel',
            () => new NotificationsModel({ database: this.database }),
        );
    }

    public getOnboardingModel(): OnboardingModel {
        return this.getModel(
            'onboardingModel',
            () => new OnboardingModel({ database: this.database }),
        );
    }

    public getOpenIdIdentityModel(): OpenIdIdentityModel {
        return this.getModel(
            'openIdIdentityModel',
            () => new OpenIdIdentityModel({ database: this.database }),
        );
    }

    public getOrganizationAllowedEmailDomainsModel(): OrganizationAllowedEmailDomainsModel {
        return this.getModel(
            'organizationAllowedEmailDomainsModel',
            () =>
                new OrganizationAllowedEmailDomainsModel({
                    database: this.database,
                }),
        );
    }

    public getOrganizationMemberProfileModel(): OrganizationMemberProfileModel {
        return this.getModel(
            'organizationMemberProfileModel',
            () =>
                new OrganizationMemberProfileModel({
                    database: this.database,
                }),
        );
    }

    public getOrganizationModel(): OrganizationModel {
        return this.getModel(
            'organizationModel',
            () => new OrganizationModel(this.database),
        );
    }

    public getPasswordResetLinkModel(): PasswordResetLinkModel {
        return this.getModel(
            'passwordResetLinkModel',
            () =>
                new PasswordResetLinkModel({
                    database: this.database,
                    lightdashConfig: this.lightdashConfig,
                }),
        );
    }

    public getPersonalAccessTokenModel(): PersonalAccessTokenModel {
        return this.getModel(
            'personalAccessTokenModel',
            () => new PersonalAccessTokenModel({ database: this.database }),
        );
    }

    public getPinnedListModel(): PinnedListModel {
        return this.getModel(
            'pinnedListModel',
            () => new PinnedListModel({ database: this.database }),
        );
    }

    public getProjectModel(): ProjectModel {
        return this.getModel(
            'projectModel',
            () =>
                new ProjectModel({
                    database: this.database,
                    lightdashConfig: this.lightdashConfig,
                    encryptionService: new EncryptionService({
                        lightdashConfig: this.lightdashConfig,
                    }),
                }),
        );
    }

    public getResourceViewItemModel(): ResourceViewItemModel {
        return this.getModel(
            'resourceViewItemModel',
            () => new ResourceViewItemModel({ database: this.database }),
        );
    }

    public getSavedChartModel(): SavedChartModel {
        return this.getModel(
            'savedChartModel',
            () =>
                new SavedChartModel({
                    database: this.database,
                    lightdashConfig: this.lightdashConfig,
                }),
        );
    }

    public getSchedulerModel(): SchedulerModel {
        return this.getModel(
            'schedulerModel',
            () => new SchedulerModel({ database: this.database }),
        );
    }

    public getSearchModel(): SearchModel {
        return this.getModel(
            'searchModel',
            () => new SearchModel({ database: this.database }),
        );
    }

    public getSessionModel(): SessionModel {
        return this.getModel(
            'sessionModel',
            () => new SessionModel(this.database),
        );
    }

    public getShareModel(): ShareModel {
        return this.getModel(
            'shareModel',
            () => new ShareModel({ database: this.database }),
        );
    }

    public getSlackAuthenticationModel(): SlackAuthenticationModel {
        return this.getModel(
            'slackAuthenticationModel',
            () => new SlackAuthenticationModel({ database: this.database }),
        );
    }

    public getSpaceModel(): SpaceModel {
        return this.getModel(
            'spaceModel',
            () => new SpaceModel({ database: this.database }),
        );
    }

    public getSshKeyPairModel(): SshKeyPairModel {
        return this.getModel(
            'sshKeyPairModel',
            () =>
                new SshKeyPairModel({
                    database: this.database,
                    encryptionService: new EncryptionService({
                        lightdashConfig: this.lightdashConfig,
                    }),
                }),
        );
    }

    public getUserAttributesModel(): UserAttributesModel {
        return this.getModel(
            'userAttributesModel',
            () => new UserAttributesModel({ database: this.database }),
        );
    }

    public getUserModel(): UserModel {
        return this.getModel(
            'userModel',
            () =>
                new UserModel({
                    database: this.database,
                    lightdashConfig: this.lightdashConfig,
                }),
        );
    }

    public getUserWarehouseCredentialsModel(): UserWarehouseCredentialsModel {
        return this.getModel(
            'userWarehouseCredentialsModel',
            () =>
                new UserWarehouseCredentialsModel({
                    database: this.database,
                    encryptionService: new EncryptionService({
                        lightdashConfig: this.lightdashConfig,
                    }),
                }),
        );
    }

    public getValidationModel(): ValidationModel {
        return this.getModel(
            'validationModel',
            () => new ValidationModel({ database: this.database }),
        );
    }

    /**
     * Handles initializing a model, and taking into account model
     * providers + memoization.
     *
     * If a factory is not provided, and a model provider is not defined,
     * this method throws an error. This should not happen in normal operation.
     */
    private getModel<K extends keyof ModelManifest, T extends ModelManifest[K]>(
        modelName: K,
        factory?: () => T,
    ): T {
        if (this.modelInstances[modelName] == null) {
            let modelInstance: T;

            if (this.providers[modelName] != null) {
                modelInstance = this.providers[modelName]!({
                    repository: this,
                }) as T;
            } else if (factory != null) {
                modelInstance = factory();
            } else {
                throw new Error(
                    `Unable to initialize model '${modelName}' - no factory or provider.`,
                );
            }

            this.modelInstances[modelName] = modelInstance;
        }

        return this.modelInstances[modelName] as T;
    }
}
