export type ShareUrl = {
    nanoid: string;
    path: string;
    params: string;
    createByUserUuid?: string;
    organizationUuid?: string;
    shareUrl?: string;
    url?: string;
    host?: string;
};

export type CreateShareUrl = Pick<ShareUrl, 'path' | 'params'>;
