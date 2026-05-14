# Copilot Instructions

## Directrices del proyecto
- El proyecto usa una arquitectura de monolito modular basada en Clean Architecture. Simula microservicios dividiendo cada dominio (Rides, User, Notification, Booking, Ratings) en sus propias capas (BL y DA). Utiliza una única base de datos compartida, pero cada dominio utiliza tablas separadas y exclusivas.