# Checkout con una sola variable obligatoria

Esta guía reemplaza los requisitos de variables de las entregas anteriores. La única variable de aplicación obligatoria para crear sesiones y verificar pagos es **`STRIPE_SECRET_KEY`**. `STRIPE_WEBHOOK_SECRET` es opcional; `NUVOLA_SITE_URL`, `NUVOLA_APPROVED_PRODUCT_SLUGS` y `STRIPE_LIVE_CHECKOUT_ENABLED` ya no se leen.

- Producción usa `https://www.nuvola-home.com` para origen, éxito y cancelación. El modo test/live se deriva de la clave; las claves live se rechazan fuera de producción, también para consultar pagos o procesar webhooks.
- Los previews con claves test usan únicamente el dominio del deployment o de rama que Vercel proporciona automáticamente (`VERCEL_URL` / `VERCEL_BRANCH_URL`). El desarrollo con clave test admite HTTP en loopback. No hay que configurar una URL propia ni confiar en un Host arbitrario. Los previews necesitan tener disponibles las variables de sistema de Vercel.
- Se ofrecen **solo tarjetas**, haya o no webhook, mediante `allowed_payment_method_types: ["card"]` de la API instalada. Los métodos de confirmación diferida y BNPL quedan fuera.
- El endpoint del webhook se conserva. Sin signing secret responde 503, sin bloquear checkout. Si se configura, sigue exigiendo firma válida sobre el cuerpo original y consulta Stripe antes de registrar un pago confirmado.
- La confirmación del navegador consulta Stripe desde el servidor y exige sesión propia, modo correcto, `status=complete` y `payment_status=paid`. No confía en parámetros del cliente ni confirma pagos pendientes. Sin retorno del comprador, el equipo debe revisar pagos y atender pedidos en Stripe Dashboard: no se agrega fulfillment automático. [Referencia de Stripe](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).

## Productos

**Actualización del 18/11/2026:** los **24 productos** están autorizados en `src/config/commerce.ts`. El usuario autorizó Queen y King al mismo precio publicado de cada cama: Baxter USD 1.599, Oxford USD 1.799 y Sable USD 1.599, exclusivos de impuestos. Sus autorizaciones declaran `sizes: ["Queen", "King"]`; el comprador debe elegir un tamaño. Los otros 21 precios permanecen intactos y no se inventan cantidades de inventario.

Cada autorización declara `slug` y `unitAmount` (precio aprobado en centavos USD, exclusivo de impuestos). Los tamaños listados comparten ese importe, por autorización expresa; no se aceptan precios del navegador ni tamaños fuera de esa lista. Los cambios de precio requieren revisar el catálogo y la autorización.

El carrito identifica cada línea por producto y tamaño: Queen y King tienen cantidades, eliminación, persistencia y limpieza tras el pago independientes. Las camas almacenadas sin tamaño se descartan para evitar una selección implícita. La API exige `size` válido para camas, rechaza tamaños en SKU fijos y variantes no soportadas, y permite ambas tallas del mismo producto sin duplicar una misma selección. Stripe recibe el precio del servidor, el tamaño en el nombre y la metadata de la línea. El snapshot de pago y el cuerpo usado para idempotencia conservan el tamaño. Se mantienen límites, origen, impuestos y validación de pagos; no se implementa reserva ni actualización automática de inventario.

## Requisitos externos

Las acciones exactas de Tomás y del cliente están separadas en [CHECKOUT-HANDOFF.md](CHECKOUT-HANDOFF.md). **Stripe Tax permanece activo**, con `automatic_tax.enabled=true`, facturación requerida y precios exclusivos de impuestos. Si Stripe rechaza la configuración, el checkout falla; nunca reintenta sin impuestos. [Configuración oficial](https://docs.stripe.com/tax/checkout/page).

Verificación del 18/11: `pnpm test:commerce` **62/62**, `pnpm typecheck`, `pnpm lint` y `pnpm build` aprobados. Cubren los 24 productos con 27 selecciones distintas, los seis precios de cama contra manipulación, tamaños inválidos, duplicados, cantidades independientes, recarga y consumo del snapshot por tamaño. Las pruebas usan claves ficticias y respuestas simuladas de Stripe y no equivalen a una compra alojada. Sin credenciales test ni acceso a Stripe/Vercel, la compra sandbox sigue pendiente. El PR #4 ya está fusionado; las variantes se entregan en un PR nuevo, sin merge, Netlify ni modificaciones directas de producción.
