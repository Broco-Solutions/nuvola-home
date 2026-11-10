# Descripción del Pull Request

[PR #1](https://github.com/Broco-Solutions/nuvola-home/pull/1): **feat: add secure Stripe Checkout and persistent shopping bag**. La descripción del PR comienza en «Resumen». Mantener como draft hasta completar la aceptación de sandbox.

## Resumen

Nuvola Home incorpora una bolsa de compras persistente y Stripe Checkout alojado. Los compradores pueden agregar productos aprobados, modificar cantidades y pagar; el servidor reconstruye los precios en USD desde el catálogo y confirma el pago consultando Stripe. La visita a la página de éxito no acredita una compra por sí sola.

Se entrega como **draft** porque falta completar y registrar una compra de extremo a extremo en sandbox/preview y la entrega de su webhook. El código y las verificaciones locales están completos; no se afirma que los pagos live estén habilitados o validados.

## Cambios principales

- Carrito `/cart`, contador en cabecera y CTA de producto, persistencia local y sincronización entre pestañas. El retorno pagado consume una sola vez las cantidades de la compra y conserva adiciones posteriores.
- `POST /api/checkout`: cantidades enteras y acotadas, productos autorizados, rechazo de duplicados/camas sin variante seleccionable, origen validado, límites de cuerpo/importe y clave de idempotencia en Stripe. Los importes, nombres y moneda aportados por el cliente no sustituyen al catálogo.
- Checkout en USD con facturación, teléfono, Stripe Tax y filtro dinámico de tarjetas, Klarna y Afterpay/Clearpay según elegibilidad de Stripe. Sin dirección ni cargo de envío. Los precios del catálogo se tratan como exclusivos de impuestos; no se habilitan cupones de cliente.
- `POST /api/stripe/webhook`: firma sobre el cuerpo original, separación test/live, consulta del estado actual y HTTP 500 ante un fallo de verificación para permitir reintentos. Maneja finalización, éxito/fallo asíncrono y vencimiento. No hay efectos de fulfillment que puedan duplicarse ante eventos repetidos.
- `/checkout/success`: confirmación server-side y estados pendiente/fallido/no verificable; conserva el carrito mientras el pago no está confirmado.
- `src/lib/{cart,commerce-config,stripe-payment}.ts`, pruebas de comercio y guía de despliegue. Se preservan el catálogo, recursos, navegación, búsqueda, filtros y atribuciones originales.

Las correcciones de la rama eliminan las banderas artificiales de envío/aprobación fiscal, mantienen los controles de habilitación live, reconstruyen el carrito desde el catálogo y evitan borrar una bolsa nueva al visitar una confirmación anterior. La revalidación del 10/11 no detectó un fallo adicional que exigiera cambiar la lógica de pagos; actualiza el informe de entrega.

## Validación ejecutada el 10 de noviembre de 2026

| Comprobación | Resultado |
| --- | --- |
| `pnpm typecheck` | OK |
| `pnpm lint` | OK, sin advertencias |
| `pnpm build` | OK con configuración incompleta y con datos ficticios test pasados solo al proceso |
| `pnpm test:commerce` | 37/37 OK; rutas reales, SDK instalado y firmas HMAC; API de Stripe simulada |
| Build servido localmente | 40 rutas HTTP 200; ruta inexistente HTTP 404; endpoints sin configuración HTTP 503 |
| Edge contra el build | Agregar/quitar, cantidades, recarga, carrito vacío, errores de checkout, camas bloqueadas y confirmación no verificable: OK |
| Regresión de interfaz | Navegación, búsquedas, filtros, orden por precio, galería, showroom, menú móvil y footer: OK |
| Móvil/escritorio | Sin desborde horizontal ni contador recortado a 1440/390/360 px |
| Secretos | Sin secretos en el diff/historial ni en los 16 archivos JavaScript de cliente; solo `.env.example` versionado |
| Estado Git | `main` no tiene commits pendientes de incorporar; rama `feature/stripe-checkout` subida y verificada en GitHub |
| Vercel observado desde GitHub | Preview de la rama y último deployment de `main` con estado exitoso |

No se usó la clave live local para llamadas a Stripe, no se crearon sesiones ni cargos reales y no se modificó producción. Las pruebas locales con mocks **no reemplazan** una compra en sandbox ni verifican la elegibilidad/configuración de la cuenta de Stripe.

## Producción: configuración y límites comprobados

**Tomás ya cargó claves API en Vercel; no se solicita cargarlas nuevamente.** Este entorno no tiene conexión autenticada a los paneles privados de Vercel o Stripe. Su presencia, modo, alcance, configuración fiscal y webhook registrado no pudieron confirmarse allí.

El código utiliza exclusivamente estas variables de servidor:

- `STRIPE_SECRET_KEY`: test en Preview/Development y live en Production.
- `STRIPE_WEBHOOK_SECRET`: signing secret del endpoint de la misma cuenta y modo; no es la API key ni el secreto de `stripe listen` de otro entorno.
- `NUVOLA_SITE_URL`: origen exacto. La comprobación HTTPS pública redirige ambos dominios a **`https://www.nuvola-home.com`**; ese es el valor de producción mientras se conserve esa redirección.
- `NUVOLA_APPROVED_PRODUCT_SLUGS`: lista de productos cuyos precios, disponibilidad y opciones haya confirmado Nuvola. Sin lista no se habilita la compra; las camas permanecen excluidas.
- `STRIPE_LIVE_CHECKOUT_ENABLED=true`: habilita nuevas sesiones live únicamente en producción. No activarlo antes de terminar la validación.

No se necesitan `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, Stripe Price IDs ni variables de envío. Una modificación de variables requiere un nuevo deployment: los botones de producto se prerenderizan en el build.

La web pública respondió HTTP 200 y **`/cart` respondió HTTP 404**. GitHub registra producción desde `main` (`a67de01`) y un [preview exitoso de la rama Stripe](https://nuvola-home-quyjyzdvh-broco-solutions.vercel.app/) (`961159c`). La integración todavía no está en `main`: falta revisar/fusionar este PR y comprobar el deployment de producción resultante. Estos estados prueban que la integración de Vercel con GitHub está activa, pero no permiten inspeccionar variables privadas ni confirmar el flujo de pago real del preview.

## Pasos para Tomás

1. Revisar el código y [la guía completa de Stripe](https://github.com/Broco-Solutions/nuvola-home/blob/feature/stripe-checkout/docs/STRIPE-DEPLOYMENT.md). La guía incluye la lista de aceptación test y los requisitos de cuenta/operación.
2. Comprobar las variables existentes en Vercel y completar solo lo que falte. Configurar un preview/sandbox del mismo origen y modo con un producto de prueba aprobado, sin credenciales live.
3. Completar allí una compra de prueba y comprobar importes/impuestos, confirmación, cancelación/rechazo, preservación del carrito y entrega/reenvío del webhook. Validar los métodos BNPL solo cuando sean elegibles para la cuenta y transacción.
4. Verificar Stripe Tax, precios/inventario/opciones, recibos y atención manual de pedidos en Stripe Dashboard. El webhook es observacional: no hay base de pedidos, servicio propio de correo ni fulfillment/inventario automático.
5. Comprobar el destino live **`https://www.nuvola-home.com/api/stripe/webhook`** y su signing secret. Suscribir `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `checkout.session.expired`, con payload snapshot y versión compatible con el SDK (`2026-10-28.endive`).
6. Con la aceptación registrada, marcar el PR listo para revisión, aprobarlo y fusionarlo a `main`. No hubo merge ni push directo a `main` desde este trabajo.
7. Verificar que Vercel use este repositorio y `main` como Production Branch. Si el deploy automático está configurado, la fusión lo iniciará; si no, iniciar el deployment de ese commit. Confirmar estado Ready, dominio y aparición del carrito. La habilitación live y cualquier comprobación que genere un cargo real quedan a cargo del responsable del negocio.

Pendientes externos: acceso/configuración privada de Vercel y Stripe, aprobación comercial de productos, aceptación sandbox y despliegue/activación live. No se declara esta integración habilitada para cobrar en producción hasta resolverlos.
