import Fastify from "fastify";

const app = Fastify({
    logger: true,
});

app.get("/health", async () => {
    return {
        service: "account-service",
        status: "UP",
    };
});

app.get("/accounts/:id", async (request) => {
    const { id } = request.params as { id: string };

    return {
        id,
        customerId: "123",
        currency: "EUR",
        balance: 2500.00,
    };
});

app.listen({
    host: "0.0.0.0",
    port: 3002,
});