# Jalemos

Aplicación móvil de carpooling para Costa Rica. Conecta conductores y pasajeros que comparten rutas, reduciendo costos de transporte y la cantidad de vehículos en circulación.

Proyecto desarrollado como parte del curso de Ingeniería de Software, Universidad de Costa Rica.

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Funcionalidades](#funcionalidades)
- [Requisitos previos](#requisitos-previos)
- [Configuración del entorno](#configuración-del-entorno)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Pruebas y cobertura](#pruebas-y-cobertura)
- [Integrantes](#integrantes)

---

## Descripción

Jalemos permite a los usuarios de Costa Rica publicar o unirse a viajes compartidos. El sistema diferencia dos roles: **pasajero** y **conductor**. Los conductores deben registrar su vehículo y documentos (licencia de conducir y revisión técnica Dekra) antes de poder publicar viajes. Los pasajeros buscan viajes disponibles por ruta, fecha y número de plazas.

El nombre es un costarriquismo: *"jalemos"* significa *"vámonos"*.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 55 |
| Lenguaje | TypeScript |
| Navegación | [expo-router](https://expo.github.io/router) v4 (file-based routing) |
| UI | React Native 0.83, componentes propios |
| Cámara / documentos | expo-camera, expo-image-manipulator |
| Autocomplete de lugares | Google Places API (solo nativo) |
| Iconos | @expo/vector-icons (Ionicons) |
| Animaciones | react-native-reanimated 4 |
| Modo oscuro | Sistema de temas propio (`useAppTheme`) |

---

## Funcionalidades

### Pasajero
- Búsqueda de viajes por origen, destino, fecha y número de plazas
- Autocompletado de lugares de Costa Rica (Google Places)
- Filtros rápidos: cerca de mí, hoy, más baratos
- Visualización de viajes disponibles con calificación del conductor

### Conductor
- Registro como conductor con foto de perfil obligatoria
- Captura guiada de licencia de conducir (anverso y reverso)
- Captura de la revisión técnica Dekra
- Publicación de viajes con ruta, fecha/hora, asientos y precio
- Selección de vehículo registrado
- Configuración de viajes recurrentes

### General
- Alternancia entre modo pasajero y conductor desde el perfil
- Soporte para modo claro y oscuro
- Notificaciones (pendiente de integración con backend)
- Navbar con liquid glass en iOS 26 (NativeTabs)

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- [Expo Go](https://expo.dev/go) instalado en el dispositivo móvil, o un simulador de iOS/Android configurado
- Cuenta en [Google Cloud Console](https://console.cloud.google.com) con la **Places API** habilitada (para el autocompletado de lugares)

---

## Configuración del entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp FrontEnd/.env.example FrontEnd/.env
```

Editar `FrontEnd/.env`:

```env
EXPO_PUBLIC_GOOGLE_PLACES_KEY=tu_api_key_aqui
```

La clave de Google Places solo aplica para dispositivos nativos (iOS/Android). En el navegador web la API está bloqueada por CORS.

---

## Instalación

```bash
cd FrontEnd
npm install
```

---

## Ejecución

```bash
cd FrontEnd
npx expo start --clear
```

Opciones disponibles en la terminal:

| Tecla | Acción |
|---|---|
| `i` | Abrir en simulador iOS |
| `a` | Abrir en emulador Android |
| `w` | Abrir en navegador web |
| Escanear QR | Abrir en Expo Go (dispositivo físico) |

> **Nota:** el `--clear` es necesario la primera vez o cuando se modifican variables de entorno, para que Metro recargue la caché.

---

## Estructura del proyecto

```
FrontEnd/
├── app/
│   ├── _layout.tsx          # Layout raíz con providers
│   ├── index.tsx            # Pantalla de login
│   ├── register.tsx         # Registro de usuario
│   ├── driver-registration.tsx  # Registro de conductor
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar (NativeTabs en iOS, Tabs en Android)
│       ├── search.tsx        # Búsqueda de viajes (modo pasajero)
│       ├── offer.tsx         # Publicar viaje (modo conductor)
│       ├── my-rides.tsx      # Mis viajes
│       └── profile.tsx       # Perfil y configuración
├── components/
│   ├── glass-card.tsx        # Tarjeta con efecto glass morphism
│   ├── document-camera-modal.tsx  # Cámara con guía para documentos
│   ├── place-search-input.tsx     # Input con autocompletado de Places API
│   ├── RideCard.tsx          # Tarjeta de viaje disponible
│   └── NotificationsModal.tsx
├── contexts/
│   └── user-mode.tsx         # Contexto global pasajero/conductor
├── constants/
│   └── theme.ts              # Colores, tipografía, espaciado
├── hooks/
│   └── use-app-theme.ts      # Hook para colores por modo (claro/oscuro)
└── assets/
    └── images/               # Fondos y recursos gráficos
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `EXPO_PUBLIC_GOOGLE_PLACES_KEY` | API key de Google Places para autocompletado de lugares | Sí (solo nativo) |

Las variables prefijadas con `EXPO_PUBLIC_` quedan embebidas en el bundle y son accesibles desde el cliente. No almacenar claves privadas con este prefijo.

---

## Pruebas y cobertura

Se agregó una carpeta raíz `tests/` con pruebas iniciales para frontend y backend.

### Frontend (Jest + ts-jest)

```bash
cd FrontEnd
bun run test
bun run test:coverage
```

La cobertura se guarda en `tests/frontend/coverage`.

### Backend (.NET + xUnit)

```bash
cd tests/backend/JalemosBackend.Tests
dotnet test --collect:"XPlat Code Coverage"
```

El archivo de cobertura se genera en `tests/backend/JalemosBackend.Tests/TestResults/**/coverage.cobertura.xml`.

---

## Integrantes

- Álvaro Moya
- Sebastián Blanco
- Emanuel García
- Gabriel Zúñiga
