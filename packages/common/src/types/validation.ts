export type ValidationResponse = {
    validationId: number;
    createdAt: Date;
    name: string;
    chartUuid?: string;
    dashboardUuid?: string;
    projectUuid: string;
    spaceUuid?: string;
    error: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: Date;
};

export type CreateValidation = Pick<
    ValidationResponse,
    'name' | 'chartUuid' | 'dashboardUuid' | 'projectUuid' | 'error'
>;

export type ApiValidateResponse = {
    status: 'ok';
    results: ValidationResponse[];
};

export type ValidationSummary = {
    validationError?:
        | {
              error: ValidationResponse['error'];
              createdAt: ValidationResponse['createdAt'];
          }
        | undefined;
};
