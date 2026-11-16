# Checkout con una sola variable obligatoria

Esta guía reemplaza los requisitos de variables de las entregas anteriores. La única variable de aplicación obligatoria para crear sesiones y verificar pagos es **`STRIPE_SECRET_KEY`**. `STRIPE_WEBHOOK_SECRET` es opcional; `NUVOLA_SITE_URL`, `NUVOLA_APPROVED_PRODUCT_SLUGS` y `STRIPE_LIVE_CHECKOUT_ENABLED` ya no se leen.

- Producción usa `https://www.nuvola-home.com` para origen, éxito y cancelación. El modo test/live se deriva de la clave; las claves live se rechazan fuera de producción, también para consultar pagos o procesar webhooks.
- Los previews con claves test usan únicamente el dominio del deployment o de rama que Vercel proporciona automáticamente (`VERCEL_URL` / `VERCEL_BRANCH_URL`). El desarrollo con clave test admite HTTP en loopback. No hay que configurar una URL propia ni confiar en un Host arbitrario. Los previews necesitan tener disponibles las variables de sistema de Vercel.
- Se ofrecen **solo tarjetas**, haya o no webhook, mediante `allowed_payment_method_types: ["card"]` de la API instalada. Los métodos de confirmación diferida y BNPL quedan fuera.
- El endpoint del webhook se conserva. Sin signing secret responde 503, sin bloquear checkout. Si se configura, sigue exigiendo firma válida sobre el cuerpo original y consulta Stripe antes de registrar un pago confirmado.
- La confirmación del navegador consulta Stripe desde el servidor y exige sesión propia, modo correcto, `status=complete` y `payment_status=paid`. No confía en parámetros del cliente ni confirma pagos pendientes. Sin retorno del comprador, el equipo debe revisar pagos y atender pedidos en Stripe Dashboard: no se agrega fulfillment automático. [Referencia de Stripe](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).

## Productos

**No hay productos autorizados para comprar en esta entrega.** No se encontró confirmación comercial de stock y el usuario indicó conservar esa restricción.

Para habilitar después un producto, agregar una entrada a `authorizedProducts` en `src/config/commerce.ts`, con `slug` y `unitAmount` (precio aprobado en centavos USD, exclusivo de impuestos), tras confirmar disponibilidad, precio y variante exacta con Nuvola. No se habilita desde variables ni desde el navegador. Publicar ese cambio con el procedimiento habitual.

El precio debe coincidir con el catálogo del servidor; si cambia, el producto se bloquea hasta revisar su autorización. Las camas siguen bloqueadas aun si se agregan a la lista, porque no hay selector Queen/King. El checkout conserva validación de cantidades, duplicados, límites de cuerpo/importe, origen, precios calculados en servidor e idempotencia. La lista confirma autorización comercial; no implementa reserva ni actualización automática de inventario.

## Requisitos externos

1. Tomás debe integrar este PR y realizar el despliegue autorizado. La clave existente debe pertenecer a la cuenta correcta y tener permisos de Checkout/PaymentIntents y recursos asociados; las tarjetas deben estar habilitadas y la cuenta apta para cobrar.
2. **Stripe Tax permanece activo**, con `automatic_tax.enabled=true`, facturación requerida y precios exclusivos de impuestos. Revisar domicilio del negocio, clasificación de productos y registros fiscales en Dashboard. Si Stripe rechaza la configuración, el checkout falla; nunca reintenta sin impuestos. Los logs incluyen tipo/código/parámetro e identificador de solicitud, sin credenciales ni datos personales. Los errores asociados al parámetro de impuestos muestran un aviso específico. [Configuración oficial](https://docs.stripe.com/tax/checkout/page).
3. Nuvola debe autorizar productos. Hasta entonces, los CTA permanecen deshabilitados y un carrito válido no puede crear sesiones.
4. Completar una compra end-to-end en sandbox con una clave test, verificando importe, impuestos, retorno, carrito, rechazo y cancelación. Sin webhook, comprobar en Stripe Dashboard el pago aun cuando el comprador no vuelva al sitio. No se hicieron pagos reales ni se modificaron credenciales.

Verificación: `pnpm test:commerce` **45/45**, `pnpm typecheck`, `pnpm lint` y `pnpm build` aprobados; **11/11 comprobaciones HTTP** del build servido localmente con una clave ficticia y sin webhook. Las pruebas automatizadas usan respuestas simuladas de la API. Verifican la creación de sesiones en modo producción con solo la clave, usando aprobaciones de productos exclusivamente dentro del proceso de test. No equivalen a una compra alojada en Stripe ni prueban la configuración privada de Vercel/Stripe.
