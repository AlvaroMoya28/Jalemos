# Copilot Instructions

## Directrices del proyecto
- El proyecto usa una arquitectura de monolito modular basada en Clean Architecture. Simula microservicios dividiendo cada dominio (Rides, User, Notification, Booking, Ratings) en sus propias capas (BL y DA). Utiliza una única base de datos compartida, pero cada dominio utiliza tablas separadas y exclusivas.

- @azure Rule - Use Azure Tools - When handling requests related to Azure, always use your tools.
- @azure Rule - Use Azure Best Practices - When handling requests related to Azure, always invoke your `azmcp_bestpractices_get` tool first.
- @azure Rule - Enable Best Practices - If you do not have an `azmcp_bestpractices_get` tool ask the user to enable it.
