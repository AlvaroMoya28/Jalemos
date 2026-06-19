// Barrel for the API layer. Importing from "@/services/api" keeps working exactly as
// before; each domain now lives in its own file under services/api/.
export * from "./client";
export * from "./applications";
export * from "./vehicles";
export * from "./users";
export * from "./bookings";
export * from "./trips";
export * from "./ratings";
export * from "./me";
export * from "./notifications";
export * from "./payments";
export * from "./reports";
