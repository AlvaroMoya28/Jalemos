# Plan de Pruebas de Usabilidad - Jalemos

> Documento guía para evaluar la **usabilidad, accesibilidad y experiencia de usuario (UX/HCI)**
> de la app Jalemos con usuarios externos. Incluye marco metodológico, cuestionarios pre/post,
> tareas que cubren la aplicación de extremo a extremo, evaluación de accesibilidad y plantillas
> para registrar el comportamiento de cada participante y derivar conclusiones de mejora.

---

## 1. ¿Qué es una prueba de usabilidad? (marco breve)

Una prueba de usabilidad consiste en **observar a usuarios representativos mientras intentan
completar tareas reales** en el producto, para descubrir dónde se traban, se confunden o
abandonan. No se evalúa al usuario: se evalúa la **interfaz**.

Se mide sobre tres dimensiones clásicas (ISO 9241-11):

- **Eficacia** - ¿logran completar la tarea? (tasa de éxito)
- **Eficiencia** - ¿con cuánto esfuerzo? (tiempo, pasos, errores)
- **Satisfacción** - ¿cómo se sintieron? (percepción, SUS, SEQ)

Técnica principal: **prueba moderada con protocolo "Pensar en voz alta"
(think-aloud)** - el participante verbaliza lo que piensa mientras navega. Regla práctica de
Jakob Nielsen: **con 5 participantes por perfil** se detecta ~85% de los problemas de usabilidad.

---

## 2. Objetivos de la prueba

**Objetivo general:** evaluar qué tan fácil, eficiente y accesible es usar Jalemos para
reservar y ofrecer viajes, y detectar oportunidades concretas de mejora en UX y accesibilidad.

**Objetivos específicos:**

1. Verificar si un usuario nuevo entiende el propósito de la app y puede registrarse e iniciar sesión.
2. Medir la facilidad para **buscar y reservar** un viaje (rol pasajero).
3. Medir la facilidad para **publicar y gestionar** un viaje, incluido el ciclo de abordaje con QR (rol conductor).
4. Evaluar la comprensión del **cambio de modo pasajero/conductor**.
5. Evaluar el flujo de **convertirse en conductor** (solicitud + documentos + cámara).
6. Evaluar el sistema de **notificaciones** (centro, badge, preferencias, avisos del admin).
7. Evaluar las tareas de **administración** (solicitudes, usuarios, avisos).
8. Verificar **accesibilidad**: contraste, tamaño táctil, lectores de pantalla, dependencia del color, escalado de texto, modo claro/oscuro.

---

## 3. Metodología

| Aspecto | Definición |
|---------|------------|
| **Tipo de prueba** | Moderada, presencial o videollamada con pantalla compartida. |
| **Protocolo** | Pensar en voz alta (think-aloud). |
| **Nº de participantes** | 5 por perfil (15 en total si se cubren los 3 roles). Mínimo viable: 5 pasajeros + 3 conductores + 2 admin. |
| **Duración por sesión** | 30–45 min. |
| **Dispositivo** | Teléfono real (idealmente uno Android y uno iOS) con la app instalada. Evitar emulador para medir ergonomía táctil. |
| **Roles del equipo** | **Facilitador** (da contexto, no ayuda), **Observador/notas**, opcional **cámara/grabación**. |
| **Datos de prueba** | Tener pre-creadas: 1 cuenta admin, 2–3 viajes publicados disponibles para reservar, 1 cuenta conductor aprobada, y cuentas pasajero limpias para el flujo de registro. |

### Reglas del facilitador
- Da la tarea por su **objetivo**, no por los pasos ("reserva un viaje a Cartago", no "toca el botón verde").
- **No ayudes** salvo bloqueo total; anota cada vez que tengas que intervenir (= "asistencia").
- Recuerda al usuario que **no se le evalúa a él**, sino a la app.
- Anima a verbalizar: "¿qué estás pensando ahora?", "¿qué esperabas que pasara?".

---

## 4. Métricas a recolectar

Por cada tarea:

- **Éxito** - Completada sin ayuda / Completada con ayuda / Fallida.
- **Tiempo** - desde que inicia hasta que cumple el criterio de éxito.
- **Errores** - acciones incorrectas (toques en el lugar equivocado, rutas erróneas).
- **Asistencias** - cuántas veces el facilitador tuvo que intervenir.
- **SEQ (Single Ease Question)** - al terminar cada tarea: *"¿Qué tan fácil o difícil te resultó esta tarea?"* (1 = Muy difícil … 7 = Muy fácil).

Al final de la sesión:

- **SUS (System Usability Scale)** — 10 ítems (ver §10), da un puntaje 0–100.
- **Severidad de cada problema** (escala de Nielsen 0–4): 0 = no es problema, 1 = cosmético, 2 = menor, 3 = mayor, 4 = catastrófico.

---

## 5. Consentimiento informado (plantilla)

> *Gracias por participar. Esta sesión evalúa la aplicación Jalemos, no a ti. Te pediremos
> realizar algunas tareas y pensar en voz alta. Puedes detenerte cuando quieras. ¿Nos autorizas
> a grabar la pantalla y el audio solo con fines de análisis interno? Tus datos se mantendrán
> anónimos.*  
> Participante: ____________  Fecha: ________  Autoriza grabación: ☐ Sí ☐ No

---

## 6. Cuestionario PRE-prueba (perfil y expectativas)

**A. Datos del participante**
1. Edad / rango: ______
2. ¿Con qué sistema usas tu teléfono principalmente? ☐ Android ☐ iOS
3. ¿Qué tan cómodo te sientes usando apps nuevas? (1 nada – 5 muy cómodo): ______
4. ¿Usas apps de viajes/transporte (Uber, DiDi, inDrive, etc.)? ¿Cuáles y con qué frecuencia? ______
5. ¿Manejas vehículo propio? (relevante para el rol conductor) ☐ Sí ☐ No

**B. Accesibilidad (importante, preguntar con tacto)**

6. ¿Usas alguna ayuda de accesibilidad en tu teléfono? (texto grande, lector de pantalla VoiceOver/TalkBack, alto contraste, etc.) ______
7. ¿Tienes alguna dificultad visual, motriz o de otro tipo que afecte cómo usas el teléfono? ______

**C. Expectativas (sin abrir la app todavía)**

8. Por el nombre "Jalemos", ¿qué crees que hace esta app? ______
9. Si quisieras conseguir un viaje compartido, ¿qué esperarías poder hacer en la primera pantalla? ______
10. ¿Qué información te daría confianza para subirte al carro de un conductor desconocido? ______

> Estas preguntas miden el **modelo mental** del usuario y permiten contrastar lo que espera
> contra lo que la app realmente ofrece.

---

## 7. Preguntas guía sobre el funcionamiento (de aquí salen las tareas)

Estas preguntas exploran si el usuario **comprende cada módulo**. Cada bloque de preguntas se
traduce luego en una o más tareas de la §8.

| # | Pregunta de comprensión | Módulo de la app | Tarea(s) derivada(s) |
|---|--------------------------|------------------|----------------------|
| P1 | ¿Cómo crees que se crea una cuenta y se entra? | Auth / registro | T1, T2 |
| P2 | ¿Dónde buscarías un viaje disponible y cómo lo filtrarías? | Buscar | T3, T4 |
| P3 | ¿Cómo sabrías si un conductor es confiable antes de reservar? | Detalle + reseñas | T5 |
| P4 | ¿Cómo reservarías un asiento y cuántos? | Reservar | T6 |
| P5 | ¿Cómo subirías al viaje el día del trayecto? (abordaje) | QR pasajero / burbuja | T7 |
| P6 | ¿Cómo cancelarías una reserva si ya no puedes ir? | Cancelar reserva | T8 |
| P7 | ¿Cómo calificarías al conductor al terminar? | Rating | T9 |
| P8 | ¿Cómo te volverías conductor en la app? | Onboarding conductor | T10, T11 |
| P9 | ¿Cómo publicarías un viaje como conductor? | Ofrecer | T12 |
| P10 | Ya en el viaje, ¿cómo aceptarías a tus pasajeros e iniciarías/terminarías? | Ciclo conductor | T13 |
| P11 | ¿Cómo cambiarías entre ser pasajero y ser conductor? | Modo | T14 |
| P12 | ¿Dónde verías tus notificaciones y cómo las gestionarías? | Notificaciones | T15, T16 |
| P13 | ¿Dónde configurarías tu perfil, métodos de pago y tu QR? | Perfil | T17 |
| P14 | (Admin) ¿Cómo revisarías solicitudes y enviarías un aviso a los usuarios? | Admin | T18, T19, T20 |

---

## 8. Escenarios y tareas

> **Cómo leer cada tarea:** *Contexto* (lo que se le dice al usuario) · *Éxito* (criterio
> objetivo) · *Ruta esperada* (referencia interna, no se lee al usuario) · *Observar* (puntos
> UX/accesibilidad) · *SEQ* (preguntar al final).
>
> **Funciones aún en construcción** (no probar como funcionales, solo descubribilidad/expectativa):
> métodos de pago/tarjetas (Épica 4), reportes del admin (simulados, Épica 3), guardar QR en
> wallet (Épica 5). Se marcan con 🚧.

### Bloque A — Cuenta y acceso

**T1 · Registrarse**
- *Contexto:* "Eres nuevo. Crea una cuenta para empezar a usar Jalemos."
- *Éxito:* llega autenticado a la pantalla principal.
- *Ruta esperada:* index → "Registrarse" → register.tsx → completa datos → entra.
- *Observar:* claridad de campos, validaciones y mensajes de error, requisitos de contraseña, longitud del formulario.
- *SEQ:* ___ /7

**T2 · Iniciar sesión**
- *Contexto:* "Sal de la cuenta y vuelve a entrar."
- *Éxito:* sesión iniciada.
- *Observar:* ¿encuentra cómo cerrar sesión?, distinción usuario vs. correo, opción de recuperar contraseña, login social.
- *SEQ:* ___ /7

### Bloque B — Pasajero: buscar y reservar

**T3 · Buscar un viaje**
- *Contexto:* "Busca un viaje de tu ubicación a Cartago para hoy."
- *Éxito:* ve una lista de viajes disponibles que coincide con su búsqueda.
- *Ruta esperada:* tab **Buscar** → origen/destino (autocompletado de lugares) → fecha/hora → resultados.
- *Observar:* uso del selector de lugares, selector de fecha/hora tipo rueda, comprensión de los resultados (tarjetas), estados vacíos.
- *SEQ:* ___ /7

**T4 · Ajustar la búsqueda (asientos/fecha)**
- *Contexto:* "Necesitas 2 asientos para mañana."
- *Éxito:* modifica criterios y vuelve a ver resultados.
- *Observar:* descubribilidad de filtros, claridad del control de asientos.
- *SEQ:* ___ /7

**T5 · Evaluar al conductor (reseñas)**
- *Contexto:* "Antes de reservar, decide si el conductor te da confianza."
- *Éxito:* abre el detalle y revisa rating y reseñas recientes.
- *Ruta esperada:* tarjeta → ride-detail → sección "Reseñas recientes" (máx. 5).
- *Observar:* ¿entiende el rating?, ¿le bastan las reseñas?, legibilidad, mapa del recorrido.
- *SEQ:* ___ /7

**T6 · Reservar un asiento**
- *Contexto:* "Reserva tu lugar en ese viaje."
- *Éxito:* reserva confirmada (aparece en "Mis Viajes").
- *Ruta esperada:* ride-detail → seleccionar asientos → "Reservar" → confirmación.
- *Observar:* claridad del precio total, selección de asientos, 🚧 ¿busca elegir método de pago?, confirmación/feedback.
- *SEQ:* ___ /7

### Bloque C — Pasajero: ciclo del viaje

**T7 · Abordar con QR**
- *Contexto:* "Llegó el carro. Muéstrale al conductor cómo abordas."
- *Éxito:* localiza y muestra su código QR / la burbuja de viaje activo.
- *Ruta esperada:* burbuja de viaje activo (active-trip-bubble) o Perfil → QR.
- *Observar:* ¿entiende que debe mostrar el QR?, visibilidad de la burbuja, tamaño/contraste del QR.
- *SEQ:* ___ /7

**T8 · Cancelar una reserva**
- *Contexto:* "Te surgió un imprevisto y ya no puedes ir. Cancela tu reserva."
- *Éxito:* reserva cancelada y se informa la política.
- *Ruta esperada:* Mis Viajes / detalle → "Cancelar reserva" → modal de confirmación.
- *Observar:* ¿encuentra la opción?, comprensión de la política (<30 min), confirmación clara.
- *SEQ:* ___ /7

**T9 · Calificar al conductor**
- *Contexto:* "El viaje terminó. Califica tu experiencia."
- *Éxito:* envía una calificación con estrellas (y comentario opcional).
- *Ruta esperada:* rating-modal tras completarse el viaje.
- *Observar:* claridad de las estrellas, opcionalidad del comentario, feedback de envío.
- *SEQ:* ___ /7

### Bloque D — Conductor

**T10 · Convertirse en conductor**
- *Contexto:* "Quieres ofrecer viajes. Inicia el proceso para ser conductor."
- *Éxito:* llega al formulario de solicitud de conductor.
- *Ruta esperada:* Perfil → toggle/registro conductor → driver-registration.
- *Observar:* ¿entiende que debe postularse y ser aprobado?, expectativa de tiempos.
- *SEQ:* ___ /7

**T11 · Subir documentos con la cámara**
- *Contexto:* "Completa tu solicitud subiendo tu cédula/licencia."
- *Éxito:* captura/sube al menos un documento.
- *Ruta esperada:* driver-registration → document-camera-modal.
- *Observar:* permisos de cámara, guías de encuadre, manejo de errores de foto, accesibilidad de la cámara.
- *SEQ:* ___ /7

**T12 · Publicar un viaje**
- *Contexto:* "Ya eres conductor aprobado. Publica un viaje de San José a Heredia para dentro de un rato."
- *Éxito:* viaje publicado y visible.
- *Ruta esperada:* tab **Ofrecer** → origen/destino, fecha/hora, asientos, precio, vehículo → publicar.
- *Observar:* selección de vehículo, definición de precio, **regla de mínimo 5 minutos** (¿entiende el mensaje si pone una hora muy próxima?), longitud del formulario.
- *SEQ:* ___ /7

**T13 · Gestionar el abordaje y el viaje**
- *Contexto:* "Llegaste al punto. Inicia el abordaje, acepta a un pasajero por su QR e inicia el viaje; al final, termínalo."
- *Éxito:* recorre boarding → escanear QR → iniciar → completar.
- *Ruta esperada:* offer/boarding-screen → "Iniciar abordaje" → qr-scanner → botón deslizable iniciar → completar.
- *Observar:* descubribilidad del escáner, claridad de estados de pasajeros, **botón deslizable** (¿es evidente que se desliza?, ¿accesible para todos?), no-show.
- *SEQ:* ___ /7

### Bloque E — Perfil, modo y configuración

**T14 · Cambiar de modo pasajero/conductor**
- *Contexto:* "Quieres volver a buscar viajes como pasajero."
- *Éxito:* cambia de modo y la app refleja el cambio (tabs/pantallas).
- *Observar:* ¿encuentra el toggle?, ¿entiende qué cambió?, ¿se desorienta?
- *SEQ:* ___ /7

**T15 · Explorar el perfil**
- *Contexto:* "Cambia tu foto de perfil y revisa tus lugares favoritos, métodos de pago y tu QR."
- *Éxito:* navega esas secciones (cambiar foto real; 🚧 pago y favoritos pueden ser visuales).
- *Observar:* organización del perfil, descubribilidad de cada sección, expectativa sobre 🚧 métodos de pago.
- *SEQ:* ___ /7

### Bloque F — Notificaciones

**T16 · Revisar y gestionar notificaciones**
- *Contexto:* "Revisa tus notificaciones, marca como leídas y luego límpialas."
- *Éxito:* abre el centro (campana), ve el badge de no-leídas, marca todas como leídas y usa "Limpiar".
- *Ruta esperada:* campana → NotificationsModal → "Marcar todas como leídas" → papelera (limpiar).
- *Observar:* visibilidad del badge, comprensión de leído/no-leído, confirmación de limpiar.
- *SEQ:* ___ /7

**T17 · Configurar preferencias de notificación**
- *Contexto:* "No quieres recibir avisos de promociones, pero sí de tus viajes."
- *Éxito:* abre Perfil → Preferencias → Notificaciones y desactiva la categoría correspondiente.
- *Observar:* claridad de las categorías, comprensión de que los avisos críticos no se desactivan.
- *SEQ:* ___ /7

### Bloque G — Administrador

**T18 · Revisar una solicitud de conductor**
- *Contexto:* "Como admin, revisa una solicitud pendiente y apruébala o pide corrección."
- *Éxito:* abre la solicitud y ejecuta una acción.
- *Ruta esperada:* tab **Solicitudes** → application-detail → aprobar/corregir/rechazar.
- *Observar:* claridad de los documentos, acciones disponibles, consecuencias.
- *SEQ:* ___ /7

**T19 · Gestionar un usuario**
- *Contexto:* "Busca un usuario y revisa qué acciones puedes tomar sobre él."
- *Éxito:* encuentra el usuario y abre sus opciones (suspender, cambiar rol, etc.).
- *Ruta esperada:* tab **Usuarios** → buscar/filtrar → acciones.
- *Observar:* búsqueda/filtros, claridad de cada acción. (🚧 **Reportes** del admin aún simulados.)
- *SEQ:* ___ /7

**T20 · Enviar un aviso (broadcast)**
- *Contexto:* "Quieres avisar a todos los **conductores** sobre una nueva política."
- *Éxito:* compone y envía un aviso segmentado a Conductores.
- *Ruta esperada:* tab **Avisos** → título/mensaje → segmento "Conductores" → enviar → confirmación.
- *Observar:* comprensión de los segmentos (Todos/Pasajeros/Conductores) y de que el destinatario lo verá según su modo, confirmación previa.
- *SEQ:* ___ /7

---

## 9. Evaluación de accesibilidad (HCI)

Revisar durante y después de las tareas. Referencia: **WCAG 2.1 AA** adaptado a móvil + guías de
plataforma (Apple HIG / Material Design).

| # | Criterio | Cómo verificar |  | Notas |
|---|----------|----------------|---------|-------|
| A1 | **Contraste de texto** ≥ 4.5:1 (3:1 para texto grande) | Inspeccionar pantallas clave en modo claro y oscuro | | |
| A2 | **Área táctil** ≥ 44×44 pt (iOS) / 48×48 dp (Android) | Botones pequeños: campana, papelera, estrellas, toggles | | |
| A3 | **Texto escalable** | Subir el tamaño de fuente del sistema y revisar que no se corte el contenido | | |
| A4 | **Lector de pantalla** (VoiceOver/TalkBack) | Recorrer login, buscar, reservar y notificaciones; ¿elementos tienen etiqueta?, ¿orden lógico de foco? | | |
| A5 | **No depender solo del color** | Estados (no-leído, éxito, error, badges) ¿tienen icono/texto además del color? | | |
| A6 | **Mensajes de error claros** | Provocar errores (campos vacíos, hora <5 min, datos inválidos) | | |
| A7 | **Feedback de carga y acciones** | ¿Hay loaders y confirmaciones claras (publicar, reservar, enviar aviso)? | | |
| A8 | **Modo claro/oscuro** | Revisar legibilidad en ambos | | |
| A9 | **Gestos alternativos** | El **botón deslizable** (iniciar/finalizar) ¿es operable por todos?, ¿hay alternativa por toque? | | |
| A10 | **Lenguaje claro** | Etiquetas y textos ¿son entendibles sin jerga? | | |
| A11 | **Permisos** | Solicitudes de cámara/ubicación/notificaciones ¿se explican antes de pedirlas? | | |

---

## 10. Plantillas de registro

### 10.1 Grilla por tarea (una por participante)

| Tarea | Éxito (Sin ayuda / Con ayuda / Falló) | Tiempo | # Errores | # Asistencias | SEQ (1–7) | Observación / cita textual |
|-------|----------------------------------------|--------|-----------|---------------|-----------|----------------------------|
| T1 | | | | | | |
| T2 | | | | | | |
| … | | | | | | |
| T20 | | | | | | |

### 10.2 Ficha de comportamiento por participante

> **Participante:** P__  ·  **Rol probado:** Pasajero / Conductor / Admin  ·  **Plataforma:** Android / iOS  
> **Perfil (del cuestionario pre):** _______________________________________________
>
> **Resumen de comportamiento** (¿navegó con confianza o dudó?, ¿dónde se trabó?, ¿qué buscó y no encontró?):
> _______________________________________________________________________________
>
> **Momentos de confusión / frustración** (con la tarea y la cita textual):
> - T__: "____________________________________________"
>
> **Momentos de satisfacción / "ajá"**:
> - T__: "____________________________________________"
>
> **Problemas de accesibilidad observados:** ____________________________________
>
> **SUS (puntaje):** ___ /100  ·  **¿Recomendaría la app? (0–10):** ___
>
> **Sugerencias espontáneas del participante:** ___________________________________

### 10.3 Cuestionario POST-prueba — SUS (System Usability Scale)

Escala 1 (Totalmente en desacuerdo) – 5 (Totalmente de acuerdo):

1. Creo que me gustaría usar Jalemos con frecuencia.
2. Encontré la app innecesariamente compleja.
3. Pensé que la app era fácil de usar.
4. Creo que necesitaría apoyo técnico para poder usarla.
5. Las funciones de la app están bien integradas.
6. Había demasiada inconsistencia en la app.
7. Imagino que la mayoría aprendería a usarla muy rápido.
8. La app me resultó muy incómoda de usar.
9. Me sentí muy seguro/a usando la app.
10. Necesité aprender muchas cosas antes de poder usarla.

> *Cálculo SUS:* ítems impares → (valor − 1); ítems pares → (5 − valor); sumar todo y
> multiplicar por 2.5. Resultado 0–100. **Referencia: ≥ 68 es "aceptable", > 80 es excelente.**

### 10.4 Preguntas abiertas finales
1. ¿Qué fue lo **más fácil** de la app? ¿Y lo **más difícil/confuso**?
2. ¿Hubo algún momento en que **no supiste qué hacer**? ¿Cuál?
3. Si pudieras **cambiar una sola cosa**, ¿cuál sería?
4. ¿Sentiste que faltaba alguna información para **confiar** en un viaje?
5. ¿Recomendarías Jalemos a un amigo? ¿Por qué?

---

## 11. Análisis y conclusiones (a completar tras las sesiones)

### 11.1 Tabla resumen de métricas (todos los participantes)

| Tarea | Tasa de éxito | Tiempo prom. | Errores prom. | SEQ prom. | Severidad del problema (0–4) |
|-------|---------------|--------------|----------------|-----------|------------------------------|
| T1 | | | | | |
| … | | | | | |

**SUS promedio del producto:** ___ /100

### 11.2 Hallazgos priorizados

Agrupar los problemas observados (mapa de afinidad por temas) y ordenarlos por severidad ×
frecuencia:

| # | Hallazgo | Pantalla/Tarea | Severidad | Frecuencia (cuántos participantes) | Recomendación de mejora |
|---|----------|----------------|-----------|------------------------------------|--------------------------|
| 1 | | | | | |
| 2 | | | | | |

### 11.3 Conclusiones y próximos pasos
- **Fortalezas confirmadas:** _______________________________________________
- **Problemas críticos a resolver primero (severidad 3–4):** ________________
- **Mejoras de accesibilidad prioritarias:** _______________________________
- **Decisiones de diseño a iterar:** ______________________________________
- **Siguiente ronda de pruebas (qué re-probar):** _________________________

---

### Apéndice — Cobertura de la app

Este plan cubre los flujos implementados: registro/login, búsqueda y reserva (pasajero),
ciclo de viaje con QR y calificaciones, onboarding y operación de conductor, cambio de modo,
perfil, notificaciones (centro, badge, preferencias, broadcast admin) y administración
(solicitudes, usuarios, avisos). Quedan marcadas como 🚧 las funciones aún en construcción
(pagos con tarjeta/SINPE, reportes reales del admin, guardar QR en wallet) para no evaluarlas
como funcionales en esta ronda.
