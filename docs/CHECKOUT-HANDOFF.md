# Activación de NUVOLA HOME

Entrega: **24 productos habilitados técnicamente**, incluidas Queen y King para Baxter (USD 1.599), Oxford (USD 1.799) y Sable (USD 1.599). Ambos tamaños usan el mismo precio publicado de cada producto, por autorización expresa del usuario. El selector es obligatorio y cada tamaño tiene su propia línea de carrito. No se publica en Netlify.

## Tomás — GitHub y Vercel

1. Revisar el PR de variantes y usar su Preview con `STRIPE_SECRET_KEY` **test**, facilitada por el cliente. Mantener las variables de sistema de Vercel disponibles; el código usa automáticamente el dominio del Preview. Volver a desplegar al cambiar la clave.
2. Completar una compra sandbox desde el producto: agregar Queen y King de una cama al mismo carrito, cambiar cantidades y comprobar que son independientes. Pagar con una tarjeta test y verificar importes USD/impuestos, nombres/tamaños en Stripe, retorno `Payment received` y descuento de los tamaños comprados. Probar rechazo y cancelación sin pérdida del carrito. Confirmar la misma sesión como pagada en Stripe con el cliente. Registrar Session ID test y commit; una prueba automatizada con mocks no sustituye esta compra.
3. Tras esa aceptación, integrar el PR y desplegar `main` en Vercel. Configurar `STRIPE_SECRET_KEY` **live solo en Production**, sin prefijo `NEXT_PUBLIC_`. Verificar que `https://www.nuvola-home.com` sirva el commit publicado y permita comprar los 24 productos; las camas requieren elegir tamaño. No ejecutar cargos reales como prueba.
4. `STRIPE_WEBHOOK_SECRET` es opcional; no se necesitan otras variables de aplicación. Si se configura, usar el secreto del endpoint y modo correspondientes en `/api/stripe/webhook`. Sin webhook, los pedidos se atienden manualmente desde Stripe Dashboard.

## Cliente — Stripe y operación

1. Facilitar a Tomás las claves test/live de la cuenta correcta por un canal seguro. Comprobar cuenta apta para cobrar, tarjetas habilitadas y recibos/notificaciones de pagos.
2. Completar/revisar Stripe Tax con datos reales del negocio, clasificación de productos y registros fiscales correspondientes. El código conserva impuestos automáticos y precios exclusivos de impuestos; no hay fallback que quite impuestos si Stripe rechaza la configuración.
3. Designar quién revisa pagos y atiende pedidos en Stripe Dashboard, y coordinar entrega/retiro. El checkout actual no cobra envío ni recoge una dirección de entrega.

La compra sandbox y los pagos de producción permanecen sin verificar: esta entrega no tiene acceso a Stripe ni al panel de Vercel, y no realiza pagos reales ni despliegues productivos.
