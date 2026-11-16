# Checkout: entrega del 16 de noviembre de 2026

**Los pagos reales siguen bloqueados. Falta una compra end-to-end en sandbox.**

## Corregido y verificado

- Stripe: timeout de 10 segundos por intento y un reintento de red, conservando la idempotencia. Antes usaba el timeout predeterminado de 80 segundos.
- Carrito: corta una espera de 35 segundos, conserva el carrito y permite reintentar con el mismo identificador mientras se mantiene la página y el mismo carrito. Valida la respuesta y el destino HTTPS de Stripe.
- Checkout, webhook y confirmación declaran `maxDuration=60`; comprobado en el manifiesto del build.
- Pasaron `pnpm test:commerce` (40/40), `pnpm typecheck`, `pnpm lint` y `pnpm build`.
- Pasaron 12 comprobaciones HTTP contra el build servido localmente, con credenciales ficticias test: carrito, confirmación sin sesión/modo incorrecto, métodos HTTP, origen, cuerpos inválidos y firmas del webhook. Ninguna llamó a Stripe ni procesó pagos.
- Las pruebas de comercio simulan la API de Stripe; **no prueban el Checkout alojado ni la entrega real del webhook**.
- Se conservaron sin incluir en el commit los tres documentos que ya tenían cambios al iniciar el trabajo. No se modificó `.env.local` ni ninguna credencial.

## Producción comprobada

- [PR #1](https://github.com/Broco-Solutions/nuvola-home/pull/1): fusionado el 10/11; `main` remoto sigue en `3de46326a6ec37c03b383c723f2e2b9e2f095668`.
- El HTML servido por `https://www.nuvola-home.com/cart` identifica `dpl_AczFMaCHZeGi1P8xJxLp7yJ1t9EW`. Coincide con el [deployment Vercel exitoso del 13/11](https://vercel.com/broco-solutions/nuvola-home/AczFMaCHZeGi1P8xJxLp7yJ1t9EW), asociado a `ed8dd1696f4638c1ad5848920e53de01f83d6488`. Su árbol Git es idéntico al de `main`: incluye el checkout del PR #1, pero no estas correcciones nuevas.
- `nuvola-home.com/cart` redirige con 308 a `https://www.nuvola-home.com/cart`.
- `/cart` y `/checkout/success` responden 200; sin sesión no se confirma un pago. Las dos API responden 405 ante GET.
- POST con carrito vacío a `/api/checkout` y POST sin firma a `/api/stripe/webhook`: **503**. El webhook indica configuración ausente/inválida de la clave Stripe o del signing secret; no permite identificar cuál desde fuera. El producto `nido-lounge-chair-white` no muestra “Add to Bag”. Las variables privadas de Vercel no se pudieron inspeccionar.

## Tomás: pasos exactos, en orden

1. Revisar e integrar el PR nuevo cuando corresponda. No repetir el merge del PR #1. Estas correcciones no se fusionaron ni se desplegaron a producción durante esta entrega.
2. Configurar un Preview con `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_WEBHOOK_SECRET=whsec_…` del mismo sandbox, `NUVOLA_SITE_URL=https://<origen-exacto-del-preview>`, `NUVOLA_APPROVED_PRODUCT_SLUGS=nido-lounge-chair-white` para la prueba y `STRIPE_LIVE_CHECKOUT_ENABLED=false`. No usar claves live. Redeploy del Preview tras configurar: los botones se generan durante el build.
3. Crear el endpoint público `<origen-del-preview>/api/stripe/webhook`, sin bloqueo de login, con payload snapshot compatible con API `2026-10-28.endive`. Suscribir `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `checkout.session.expired`; usar su signing secret en Preview.
4. Desde el producto, agregar al carrito y pagar con una [tarjeta test de Stripe](https://docs.stripe.com/testing). Comprobar importe/impuestos, retorno “Payment received”, carrito descontado y entrega HTTP 200 del evento de esa sesión. Probar rechazo, cancelación y reenvío del evento. Registrar deployment, Session ID y Event ID test. Klarna/Afterpay requieren además su prueba cuando sean elegibles.
5. Con sandbox aprobado y autorización de publicación, revisar Production: clave live de la cuenta correcta, signing secret del endpoint live `https://www.nuvola-home.com/api/stripe/webhook`, `NUVOLA_SITE_URL=https://www.nuvola-home.com`, slugs comerciales aprobados y `STRIPE_LIVE_CHECKOUT_ENABLED=true`. Revisar Stripe Tax, recibos/notificaciones y responsable de pedidos; redeploy autorizado y comprobar el dominio/commit. No cambiar ni rotar credenciales que ya sean correctas.

## Responsable comercial / usuario

Confirmar con Nuvola productos, precios exclusivos de impuestos, disponibilidad y quién atiende cada pedido manualmente en Stripe Dashboard. Las camas siguen excluidas por falta de selección de tamaño. El checkout no cobra ni recoge datos de envío; acordar entrega/retiro con el cliente. Entregar esta nota y el PR a Tomás y solicitar la evidencia de sandbox antes de habilitar live. No compartir claves por chat ni realizar cobros reales como prueba.
