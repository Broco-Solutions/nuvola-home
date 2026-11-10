# Stripe Checkout — entrega para Tomás

Estado de esta revisión (10 de noviembre de 2026): código listo para revisión y verificaciones locales completas; validación de extremo a extremo en sandbox pendiente. El PR se entrega como **draft** para señalar ese requisito antes de habilitar pagos reales. No se modificó Vercel/Stripe ni se crearon sesiones o cobros reales.

## Revalidación de entrega — 10 de noviembre de 2026

- `git fetch origin --prune` confirmó que `feature/stripe-checkout` contiene todo `origin/main`; no fue necesario incorporar cambios de otros desarrolladores. La rama ya estaba subida hasta `8c3e422` y el árbol de trabajo estaba limpio. La consulta autenticada de GitHub no encontró un PR anterior para esta rama y confirmó permiso de escritura del colaborador.
- `pnpm typecheck`, `pnpm lint` y las **37 pruebas** de `pnpm test:commerce` pasaron nuevamente. `pnpm build` pasó con la configuración local incompleta y también con datos ficticios test pasados solamente al proceso, sin editar `.env.local`.
- Sobre este último build, **40 rutas** respondieron HTTP 200 y una ruta inexistente respondió 404. Los endpoints de checkout y webhook respondieron 503 cuando faltaba su configuración; no se contactó a Stripe. La inspección de los **16 archivos JavaScript de cliente** generados no encontró claves privadas ni secretos de webhook, incluidos los valores ficticios de prueba.
- Edge sin ventana comprobó agregar/quitar productos, incrementar/decrementar cantidades, persistencia tras recarga, carrito vacío, recuperación tras error de checkout, bloqueo de camas y rechazo de una confirmación sin sesión verificable. Sin desborde horizontal ni contador recortado a 1440/390/360 px. También pasaron navegación, búsqueda global y del catálogo, filtros, orden por precio, galería, showroom, menú móvil y crédito del footer.
- La revisión del diff y del historial no detectó secretos ni archivos privados; `.env.example` es la única plantilla de entorno versionada. Se conservaron los recursos, el catálogo, las páginas informativas y los scripts/dependencias originales. Esta revalidación no requirió cambiar la lógica de pagos.
- Las lecturas HTTPS públicas devolvieron 200 para ambos dominios y terminaron en **`https://www.nuvola-home.com/`**. `/cart` devolvió **404** en ese dominio. Por lo tanto, la integración todavía no está visible en producción. Usar `NUVOLA_SITE_URL=https://www.nuvola-home.com` mientras esta sea la redirección canónica; no copiar el dominio sin `www` de la configuración de metadatos como origen de Checkout.

### Límites de acceso y publicación

Tomás ya cargó claves API en Vercel según el contexto recibido: **no se solicita volver a cargarlas**. No se dispone de una conexión autenticada a los proyectos privados de Vercel ni a Stripe, por lo que no se pudo confirmar la presencia, modo o alcance de esas variables, el signing secret, Stripe Tax, los métodos de pago ni el webhook registrado. La configuración **local** tiene una clave live pero carece de signing secret y productos autorizados; esto no describe ni demuestra la configuración de Vercel. La clave local no se usó para llamadas a Stripe.

Antes de quitar el draft: completar una compra test de esta aplicación y verificar su webhook en sandbox/preview, conforme a la lista de aceptación de este documento. Antes de habilitar live: Tomás debe verificar las cinco variables de servidor de la tabla siguiente, aprobar los productos y precios, y confirmar impuestos, atención manual de pedidos y destino del webhook. La fusión a `main` publicará automáticamente solo si el proyecto Vercel está conectado a este repositorio y tiene `main` como Production Branch; ese ajuste privado no pudo comprobarse. De lo contrario, Tomás deberá iniciar el deployment correspondiente desde Vercel. Después debe revisar el deployment, el dominio y el carrito público. No se hizo merge, push a `main` ni publicación de producción desde esta revisión.

## Variables exactas en Vercel

Configurar en Project → Settings → Environment Variables. Todos los valores son de servidor: **ninguno lleva `NEXT_PUBLIC_`**. `.env.example` contiene la plantilla sin secretos.

| Variable | Development / Preview | Production | Requisito |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | Clave `sk_test_…` del sandbox elegido | Clave `sk_live_…` de la cuenta del negocio | Obligatoria. Se admiten claves restringidas `rk_test_…` / `rk_live_…` con permisos suficientes para crear/leer Checkout Sessions y leer PaymentIntents expandidos, y crear los objetos asociados (Customers, Products, Prices y Payments). Usar claves normales si esos permisos no están confirmados. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del endpoint del mismo sandbox; en local, el de `stripe listen` | `whsec_…` del endpoint live | Obligatoria, también para crear sesiones. El secreto del CLI no es el del endpoint de Dashboard. |
| `NUVOLA_SITE_URL` | Origen HTTPS **exacto** del preview; local: `http://localhost:3000` | Origen HTTPS canónico que realmente usa el navegador | Obligatoria, sin ruta, query, fragmento ni credenciales. Un `/` final se admite. No se deduce del header Host. |
| `NUVOLA_APPROVED_PRODUCT_SLUGS` | Slugs separados por comas para probar en sandbox | Solo slugs cuyos precios, disponibilidad y variantes confirmó Nuvola | Obligatoria para habilitar productos. Vacía bloquea la compra de forma intencional. No usar `*`; no copiar todos los productos sin revisarlos. Las camas no admiten compra aunque estén en la lista. |
| `STRIPE_LIVE_CHECKOUT_ENABLED` | `false` o ausente; una clave test funciona igualmente | `true` únicamente al habilitar pagos live | Interruptor de nuevas sesiones live. Con `false` siguen funcionando la consulta de pagos existentes y los webhooks. |

`NODE_ENV` y `VERCEL_ENV` los administra la plataforma. No sobrescribirlos: el código rechaza crear sesiones live desde `next dev` y desde Vercel Preview/Development, incluso con el interruptor activado. En otro hosting, una clave live exige `NODE_ENV=production`.

Eliminar variables antiguas: `NUVOLA_FULFILLMENT_MODE`, `NUVOLA_SHIPPING_RATE_ID`, `STRIPE_TAX_READY`. Ya no se leen. No hace falta clave publicable, Stripe Price IDs, tarifa de envío ni otra bandera de habilitación fiscal.

Después de modificar variables, **hacer un nuevo deployment** del entorno correspondiente: los botones de producto se prerenderizan con la configuración del build, mientras el endpoint vuelve a comprobar los controles en cada petición. Usar el mismo origen para el preview, su webhook y `NUVOLA_SITE_URL`; redirigir el dominio alternativo al canónico para evitar rechazos de origen. Un dominio de preview estable facilita la validación. El webhook debe ser accesible públicamente por Stripe: una protección de preview/login que intercepte esa ruta debe resolverse antes de probar, sin exponer secretos en la URL.

## Configuración de Stripe

Realizar primero todo en **sandbox**, sin reutilizar credenciales live.

1. En Settings → Payment methods, habilitar **Cards**, **Klarna** y **Afterpay/Clearpay**, y completar los requisitos de activación que indique Stripe. No habilitar Affirm para esta integración. El código usa `allowed_payment_method_types: ["card", "klarna", "afterpay_clearpay"]`: es un filtro de métodos **dinámicos** en la API instalada `2026-10-28.endive`, no una lista estática `payment_method_types`. Otros métodos, incluido Affirm, quedan fuera aunque se activen en Dashboard. Stripe decide la disponibilidad por cuenta, moneda, país, importe final y cliente; no se promete mostrar ambos BNPL en toda compra. La moneda del catálogo es USD.
2. Completar **Stripe Tax** con la dirección real del negocio, clasificación fiscal de los productos y registros fiscales reales que correspondan, tanto en sandbox como en live. Se mantiene `automatic_tax.enabled=true`; los precios se envían como **exclusivos de impuestos** (`tax_behavior=exclusive`). Confirmar que ese tratamiento coincide con los precios aprobados antes de habilitarlos. No se declara ninguna aprobación o registro fiscal desde una variable. Un cálculo de impuesto cero no prueba que la configuración fiscal sea correcta. La dirección de facturación se conserva; no se pide dirección de envío ni se envían `shipping_options`, Shipping Rates o un costo de envío. No inventar direcciones ni clasificar muebles como productos digitales para habilitar un método.
3. En Workbench → Webhooks / Event destinations, crear el destino HTTPS `https://<origen-del-entorno>/api/stripe/webhook` para la misma cuenta y modo de las claves. Seleccionar eventos de **esta cuenta**, con payload snapshot y API `2026-10-28.endive` para corresponder al SDK instalado. Suscribir:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Copiar su signing secret a `STRIPE_WEBHOOK_SECRET` en el entorno correcto y volver a desplegar. No mezclar secretos de sandbox, CLI y live. Validar la entrega con un Checkout **creado por esta aplicación**: un evento genérico sin metadata de Nuvola se ignora a propósito.
5. Activar los recibos de pagos exitosos al cliente en las opciones de correos de Stripe y las notificaciones de pagos del equipo que atenderá pedidos. Verificar el remitente, soporte, datos del negocio y políticas requeridas por Stripe y los proveedores BNPL. El sitio no implementa un servicio propio de correo ni una base de pedidos.

### Confirmaciones y operación

La página de éxito consulta la sesión en Stripe desde el servidor: solo muestra confirmación y consume el carrito correspondiente si `status=complete` y `payment_status=paid`, con metadata de Nuvola y modo correctos. Los pagos pendientes conservan el carrito y permiten volver a consultar; sesiones vencidas o intentos fallidos no se anuncian como pagados. No se muestran datos personales en esa página.

El webhook verifica la firma sobre el cuerpo sin transformar y consulta la sesión actual. Un fallo temporal de consulta devuelve HTTP 500 para que Stripe reintente. Los eventos repetidos o desordenados no disparan envíos, correos o cambios de inventario: su efecto local es registrar estado e identificadores, sin datos de facturación. Puede haber logs repetidos para un mismo evento; **no usarlos como una cola de pedidos**. Los pagos y líneas de compra permanecen en Stripe, que es el registro durable para esta integración; el equipo confirma y atiende cada pedido manualmente en Dashboard. Si más adelante se automatiza la atención o el inventario, hará falta persistencia con unicidad por Session ID y procesamiento idempotente antes de agregar esos efectos.

## Validación antes de quitar el draft

Comandos locales (Node 24 LTS o superior para el runner; pnpm según `packageManager`):

```sh
pnpm install --frozen-lockfile
pnpm test:commerce
pnpm typecheck
pnpm lint
pnpm build
```

Las pruebas automatizadas usan el SDK instalado, las rutas reales y firmas HMAC generadas por Stripe, con respuestas de API simuladas. No consumen `.env.local` ni llaman a Stripe. Cubren precios manipulados, productos no autorizados, camas ambiguas, cantidades, origen, tamaño de payload, idempotencia, separación test/live, firmas inválidas/vencidas, estados asíncronos, reintentos, eventos desordenados y conservación del carrito tras visitas repetidas a éxito. **No reemplazan una compra completa en sandbox ni prueban la elegibilidad de la cuenta.**

Para desarrollo local, obtener una clave **test**, copiar `.env.example` a `.env.local` conservando fuera de Git los secretos y usar:

```sh
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to localhost:3000/api/stripe/webhook
pnpm dev
```

Copiar el secreto que imprime `stripe listen` antes de arrancar Next.js. El interruptor live permanece `false`. Autorizar un producto de prueba existente (por ejemplo, `nido-lounge-chair-white`) solo para sandbox; esto no aprueba su venta live.

Lista de aceptación en sandbox o preview configurado:

- [ ] Abrir un producto autorizado, agregar/quitar unidades, recargar y verificar el carrito en móvil y escritorio. Confirmar que se mantiene el diseño existente.
- [ ] Abrir Stripe Checkout desde el carrito: comprobar importes del catálogo, impuestos acordes a la configuración y datos de facturación, sin sección ni cargo de envío.
- [ ] Completar una tarjeta de prueba aprobada y una que requiera autenticación; comprobar el recibo, la confirmación verificada y la entrega del webhook con HTTP 200. Usar solo datos de [prueba de Stripe](https://docs.stripe.com/testing).
- [ ] Probar rechazos, cancelación/retorno al carrito y reintento; comprobar que no se pierde el carrito ni se confirma un pago fallido.
- [ ] Probar Klarna y Afterpay/Clearpay cuando el Dashboard y la transacción sean elegibles: aprobar y cancelar/rechazar en sus simuladores. Verificar que Affirm no aparece. Si un proveedor exige información adicional para esta cuenta/compra, documentar el requisito y resolverlo con Stripe sin agregar un domicilio de envío ficticio; no afirmar que está validado mientras no lo esté.
- [ ] Reenviar desde Stripe el evento real de una sesión de Nuvola; confirmar estado actual, ausencia de efectos duplicados y comportamiento correcto si el comprador no vuelve a la página de éxito.
- [ ] Recargar una confirmación anterior después de agregar productos nuevos: el carrito nuevo debe conservarse.
- [ ] Confirmar que el origen alternativo, el login/protección de Vercel y las variables por entorno no bloquean el flujo ni el webhook.

Con la validación registrada, Tomás puede revisar/aprobar el PR y quitar el draft. Cualquier habilitación live y despliegue de producción queda a su cargo después de revisar claves, impuestos, lista de productos y atención de pedidos. Este trabajo no hace merge ni despliega producción.

## Resultado de la auditoría

Comparada toda la rama `feature/stripe-checkout` contra `origin/main`: carrito, CTA de producto y cabecera, persistencia, endpoint, webhook, éxito, CSS de comercio y dependencias. Se conserva la estructura visual; los ajustes adicionales se limitan al texto de envío, estados/controles de compra y la posición del contador de la bolsa para evitar que se recorte en móvil.

- Quitados los requisitos de fulfillment/envíos y la bandera artificial `STRIPE_TAX_READY`; se conserva Stripe Tax real y la facturación.
- Admitidos test y live por entorno con los controles de seguridad live conservados. La autorización explícita de productos y la exclusión de camas siguen activas porque el catálogo se capturó de una fuente externa y sus variantes no están resueltas.
- Precios y moneda calculados exclusivamente en servidor; validación de carrito/origen/cuerpo, tope de importe y clave de idempotencia en Stripe. Los datos persistidos del carrito se reconstruyen desde el catálogo para evitar precios/imágenes alterados o desactualizados.
- Webhooks y éxito consultan estados reales de Stripe, incluidos pagos pendientes/fallidos, sin depender del retorno del navegador. El carrito consume una sola vez la compra correspondiente y conserva unidades agregadas después.

Verificaciones realizadas:

| Verificación | Resultado / alcance |
| --- | --- |
| `pnpm test:commerce` | 37 pruebas aprobadas; rutas y SDK con respuestas simuladas, sin tráfico a Stripe. |
| `pnpm typecheck` | Aprobado. |
| `pnpm lint` | Aprobado, sin advertencias. |
| `pnpm build` | Build de producción aprobado, tanto con configuración incompleta que bloquea compras como con configuración test de prueba. |
| Rutas del build local | 39 rutas verificadas con HTTP 200, incluidos los 24 productos; una ruta inexistente devuelve HTTP 404. |
| Edge local sobre el build de producción | Agregar/quitar, incrementar/decrementar, persistencia tras recarga, carrito vacío, camas bloqueadas, error de checkout con carrito conservado y éxito no verificable. Sin desborde horizontal a 1440/390/360 px. También navegación original, búsqueda global y del catálogo, filtros por ambiente, orden por precio, galería, enlace al showroom, menú móvil y crédito del footer. El endpoint local se bloqueó antes de llamar a Stripe. |

Las credenciales ficticias usadas para las comprobaciones solo se pasaron al proceso local; `.env.local` no se editó. Las capturas de UI son artefactos locales ignorados por Git.

La revisión final del último commit y del diff completo no encontró archivos eliminados. Se conservaron los scripts y dependencias originales; el catálogo, recursos visuales, páginas informativas, búsqueda, filtros y atribuciones no se modificaron. El código retirado de pagos corresponde a los requisitos de envío solicitados o a lógica trasladada a funciones compartidas y cubierta por pruebas. Se revisaron ambos commits de la rama para detectar secretos y archivos privados: solo se agregó `.env.example`, una plantilla sin credenciales. Las instrucciones preexistentes del repositorio se conservaron.

Pendiente al entregar: credenciales de sandbox y signing secret, activación/elegibilidad de métodos, configuración fiscal real, aprobación de precios/productos y prueba de Checkout alojado + webhook en un entorno configurado. El entorno local disponible tenía una clave live, sin signing secret ni productos autorizados; sus valores no se modificaron ni se publicaron.

Fuentes oficiales consultadas: [filtro dinámico de Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create), [métodos dinámicos](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods), [Klarna](https://docs.stripe.com/payments/klarna/accept-a-payment?payment-ui=checkout), [Afterpay/Clearpay](https://docs.stripe.com/payments/afterpay-clearpay), [impuestos con facturación](https://docs.stripe.com/tax/checkout/page), [confirmación y atención de pedidos](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).
