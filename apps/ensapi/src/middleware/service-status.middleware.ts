import di from "@/di";
import { factory, producing } from "@/lib/hono-factory";

export interface ServiceStatusUnhealthy {
  isHealthy: false;
  isReady: false;
}

export interface ServiceStatusNotReady {
  isHealthy: true;
  isReady: false;
}

export interface ServiceStatusReady {
  isHealthy: true;
  isReady: true;
}

export type ServiceStatus = ServiceStatusUnhealthy | ServiceStatusNotReady | ServiceStatusReady;

export interface ServiceStatusMiddlewareVariables {
  serviceStatus: ServiceStatus;
}

/**
 * Middleware that determines the status of ENSApi instance. It checks if the instance
 * is healthy and ready to serve API requests, and makes this information available
 * in the Hono context as `c.var.serviceStatus`
 *
 * All downstream middleware and handlers can use this information to determine if HTTP requests
 * can be served, or if a 503 Service Unavailable response should be returned instead.
 */
export const serviceStatusMiddleware = producing(
  ["serviceStatus"],
  factory.createMiddleware(async (c, next) => {
    const { ensDbClient } = di.context;
    const isEnsDbHealthy = await ensDbClient.isHealthy();

    if (!isEnsDbHealthy) {
      // ENSDb is unhealthy and not ready
      c.set("serviceStatus", {
        isHealthy: isEnsDbHealthy,
        isReady: false,
      });
    } else {
      // ENSDb is healthy, check if it is ready
      const isEnsDbReady = await ensDbClient.isReady();

      c.set("serviceStatus", {
        isHealthy: isEnsDbHealthy,
        isReady: isEnsDbReady,
      });
    }

    await next();
  }),
);
