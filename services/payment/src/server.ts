import Fastify from "fastify";

const app = Fastify({
    logger: true,
});

app.get("/health", async () => {
    return {
        service: "payment-service",
        status: "UP",
    };
});

app.post("/payments", async (request) => {
    const body = request.body as {
        fromAccount: string;
        toAccount: string;
        amount: number;
    };

    return {
        paymentId: "P-" + Date.now(),
        status: "PROCESSING",
        ...body,
    };
});

app.get("/payments/:id", async (request) => {
    const { id } = request.params as { id: string };

    return {
        paymentId: id,
        status: "PROCESSING",
    };
});

app.listen({
    host: "0.0.0.0",
    port: 3003,
});