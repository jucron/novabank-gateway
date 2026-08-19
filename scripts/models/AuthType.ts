export interface AuthType{
    type: "jwt" | "basic" | "api-key" | "disabled";
}

export interface JwtAuth extends AuthType{
    type: "jwt";
    secret: string
}

export interface  BasicAuth extends AuthType {
    type: "basic";
    credentials: Record<string, string>;
}

export interface  ApiKeyAuth extends AuthType {
    type: "api-key";
    header: string;
    keys: Record<string, string>;
}

export interface  DisabledAuth extends AuthType {
    type: "disabled";
}