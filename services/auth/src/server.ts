import Fastify from "fastify";
import jwt from "jsonwebtoken";

const app = Fastify({
    logger: true,
});

const JWT_SECRET = "novabank-dev-secret";

app.post("/auth/validate", async (request, reply) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
        return reply.code(401).send({
            error: "Missing Authorization header",
        });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return reply.code(401).send({
            error: "Invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        return {
            authenticated: true,
            subject: typeof payload === "object" ? payload.sub : undefined,
        };
    } catch {
        return reply.code(401).send({
            error: "Invalid or expired token",
        });
    }
});

app.post("/auth/token", async () => {
    const token = jwt.sign(
        {
            sub: "user-123",
            role: "customer",
        },
        JWT_SECRET,
        {
            expiresIn: "1h",
        },
    );

    return {
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
    };
});

app.get("/auth/verify", async (request, reply) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
        return reply.code(401).send();
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return reply.code(401).send();
    }

    try {
        jwt.verify(token, JWT_SECRET);

        return reply.code(204).send();
    } catch {
        return reply.code(401).send();
    }
});
app.get("/health", async () => {
    return {
        service: "auth-service",
        status: "UP",
    };
});

app.listen({
    host: "0.0.0.0",
    port: 3004,
});