/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type NoteUpdateRequest = {
    id?: number;
    title?: string;
    content?: string;
    /**
     * 读到的版本号；和库里的对不上说明在别处改过了，返回 40900
     */
    version?: number;
};
