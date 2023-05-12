export type ValidationResponse = {
    createdAt: Date;
    name: string;
    chartUuid?: string;
    dashboardUuid?: string;
    projectUuid: string;
    error: string;
    lastUpdatedBy: string;
    lastUpdatedTime: Date;
};

export type ApiValidateResponse = {
    status: 'ok';
    results: ValidationResponse[];
};
