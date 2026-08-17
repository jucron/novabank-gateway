import fs from "node:fs";
import YAML from "yaml";

type Target = {
    url: string;
};

type CatalogApi = {
    path: string;
    target: string;
    isOpenPath: boolean;
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

for (const [name, api] of apis) {
    const target = targets.targets[api.target];

    if (!target) {
        throw new Error(
            `API "${name}" references unknown target "${api.target}"`,
        );
    }

    nginx += `
        location ${api.isOpenPath ? "" : "="} /api${api.path} {
            proxy_pass ${target.url}${api.path};
        }
`;
}

nginx += `
    }
}
`;

fs.writeFileSync("gateway/nginx.conf", nginx);

console.log(`Generated gateway/nginx.conf with ${apis.length} apis`);