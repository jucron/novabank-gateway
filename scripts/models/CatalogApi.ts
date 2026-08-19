import type {AuthType} from "./AuthType.js";

export interface CatalogApi {
    path: string,
    isPathDynamic: boolean,
    target: string,
    auth: AuthType
}
