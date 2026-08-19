import fs from "node:fs";
import YAML from "yaml";
import type {CatalogApi} from "./models/CatalogApi.js";

type Target = {
    url: string;
};


type TargetsConfig = {
    targets: Record<string, Target>;
};

type CatalogConfig = {
    apis: Record<string, CatalogApi>;
};

const targets = YAML.parse(
    fs.readFileSync("config/targets.yaml", "utf8"),
) as TargetsConfig;

const catalog = YAML.parse(
    fs.readFileSync("config/catalog.yaml", "utf8"),
) as CatalogConfig;

let nginx = `events {}

http {
    server {
        listen 80;
`;

const apis = Object.entries(catalog.apis);
const authService = targets.targets["auth-service"];
if (!authService) {
    throw new Error(
        `Missing auth-service in the targets.`,
    );
}
const authServicePath = authService.url;

for (const [name, api] of apis) {
    const target = targets.targets[api.target];

    if (!target) {
        throw new Error(
            `API "${name}" references unknown target "${api.target}"`,
        );
    }


    nginx += `
        location ${api.isPathDynamic ? "" : "="} /api${api.path} {
            ${api.auth.type !== "disabled" ? "auth_request /auth-verify;" : ""}
            proxy_pass ${target.url}${api.path};
        }
`;
}

nginx += `
        location = /auth-verify {
            internal;
        
            proxy_pass ${authServicePath}/auth/verify;
        
            proxy_pass_request_body off;
            proxy_set_header Content-Length "";
        
            proxy_set_header Authorization $http_authorization;
        }   
`;

nginx += `
    }
}
`;

fs.writeFileSync("gateway/nginx.conf", nginx);

console.log(`Generated gateway/nginx.conf with ${apis.length} apis`);