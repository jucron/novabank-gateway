import Fastify from "fastify";

const app = Fastify({
    logger: true,
});

app.get("/health", async () => {
    return {
        service: "customer-service",
        status: "UP",
    };
});

app.get("/customers/:id", async (request) => {
    const { id } = request.params as { id: string };

    return {
        id,
        name: "John Smith",
        status: "ACTIVE",
    };
});

app.listen({ host: "0.0.0.0", port: 3001 });