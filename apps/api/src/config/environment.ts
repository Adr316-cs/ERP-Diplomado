import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  API_HOST: z.string().min(1).default("localhost"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:8081"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MONGODB_URI: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().default(""),
  JWT_REFRESH_SECRET: z.string().default(""),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d")
});

export type Environment = z.infer<typeof environmentSchema>;

export const loadEnvironment = (source: NodeJS.ProcessEnv = process.env): Environment => {
  const environment = environmentSchema.parse(source);

  if (environment.NODE_ENV === "production" && environment.MONGODB_URI.length === 0) {
    throw new Error("MONGODB_URI es obligatoria en producción");
  }

  if (environment.NODE_ENV === "production" && (environment.JWT_ACCESS_SECRET.length < 32 || environment.JWT_REFRESH_SECRET.length < 32)) {
    throw new Error("Los secretos JWT deben tener al menos 32 caracteres en producción");
  }

  return environment;
};