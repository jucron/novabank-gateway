import Fastify from "fastify";

const app = Fastify({
    logger: true,
});

// Must add all services health endpoints here!
const services = {
    "customer-service": "http://customer-service:3001/health",
    "account-service": "http://account-service:3002/health",
    "payment-service": "http://payment-service:3003/health",
    "auth-service": "http://auth-service:3004/health",
};

async function checkService(url: string): Promise<"UP" | "DOWN"> {
    try {
        const response = await fetch(url);

        return response.ok ? "UP" : "DOWN";
    } catch {
        return "DOWN";
    }
}

app.get("/health", async (_request, reply) => {
    const results = await Promise.all(
        Object.entries(services).map(async ([name, url]) => {
            return [name, await checkService(url)] as const;
        }),
    );

    const serviceStatuses = Object.fromEntries(results);

    const allUp = Object.values(serviceStatuses).every(
        (status) => status === "UP",
    );

    return reply.code(allUp ? 200 : 503).send({
        status: allUp ? "UP" : "DEGRADED",
        services: serviceStatuses,
    });
});

app.listen({
    host: "0.0.0.0",
    port: 3005,
});