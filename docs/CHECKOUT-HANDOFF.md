# Activación de NUVOLA HOME

Entrega: **24 productos habilitados técnicamente**, incluidas Queen y King para Baxter (USD 1.599), Oxford (USD 1.799) y Sable (USD 1.599). Ambos tamaños usan el mismo precio publicado de cada producto, por autorización expresa del usuario. El selector es obligatorio y cada tamaño tiene su propia línea de carrito. No se publica en Netlify.

## Tomás — GitHub y Vercel

1. Revisar el PR de variantes y métodos dinámicos. Usar un Preview con `STRIPE_SECRET_KEY` **test**, facilitada por el cliente. Mantener las variables de sistema de Vercel disponibles; el código usa automáticamente el dominio del Preview. Volver a desplegar al cambiar la clave.
2. Completar una compra sandbox desde el producto: agregar Queen y King de una cama al mismo carrito, cambiar cantidades y comprobar que son independientes. Pagar con una tarjeta test y con cada financiera que resulte elegible, siguiendo las instrucciones de prueba de Stripe. Verificar importes USD/impuestos, nombres/tamaños en Stripe, retorno `Payment received` y descuento de los tamaños comprados. Para un método diferido, comprobar `Payment processing` y carrito intacto mientras esté pendiente; volver a consultar tras el éxito y probar también el fallo. Probar rechazo y cancelación sin pérdida del carrito. Confirmar la misma sesión como pagada en Stripe con el cliente. Registrar Session ID test y commit; una prueba automatizada con mocks no sustituye esta compra.
3. Tras esa aceptación, integrar el PR y desplegar `main` en Vercel. Configurar `STRIPE_SECRET_KEY` **live solo en Production**, sin prefijo `NEXT_PUBLIC_`. Verificar que `https://www.nuvola-home.com` sirva el commit publicado y permita comprar los 24 productos; las camas requieren elegir tamaño. No ejecutar cargos reales como prueba.
4. `STRIPE_WEBHOOK_SECRET` es opcional para crear sesiones; no se necesitan otras variables de aplicación. Para observar cambios asíncronos aunque el comprador no regrese, configurar `/api/stripe/webhook` con el secreto del endpoint y modo correspondientes y los eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `checkout.session.expired`. El endpoint registra estados verificados y no automatiza entregas. Sin webhook, controlar los cambios desde Stripe Dashboard. No entregar pedidos pendientes.

## Cliente — Stripe y operación

1. Facilitar a Tomás las claves test/live de la cuenta correcta por un canal seguro. Comprobar cuenta apta para cobrar, métodos activos y recibos/notificaciones de pagos. En **Settings → Payment methods**, revisar Affirm, Klarna y Afterpay en la configuración predeterminada de esa misma cuenta y modo; habilitar un método no garantiza que sea elegible para cada comprador.
2. Completar/revisar Stripe Tax con datos reales del negocio, clasificación de productos y registros fiscales correspondientes. El código conserva impuestos automáticos y precios exclusivos de impuestos; no hay fallback que quite impuestos si Stripe rechaza la configuración.
3. Designar quién revisa pagos y atiende pedidos en Stripe Dashboard, y coordinar entrega/retiro. El checkout actual no cobra envío ni recoge una dirección de entrega.

La compra sandbox y los pagos de producción permanecen sin verificar: esta entrega no tiene acceso a Stripe ni al panel de Vercel, y no realiza pagos reales ni despliegues productivos.

## Si no aparece una financiera

El código anterior filtraba `allowed_payment_method_types: ["card"]`. El nuevo código omite filtros y deja la decisión a Stripe; abrir una **sesión nueva** después de integrar y desplegar la corrección. Una sesión creada con la versión anterior puede seguir restringida a tarjetas.

El cliente debe revisar en Stripe: cuenta/modo y configuración correctos, activación/aprobación de cada método, país del negocio y del comprador, moneda **USD**, importe final **con impuestos** y reglas de visibilidad. Stripe también considera la ubicación del comprador: si la prueba se hace desde un país no admitido, no se garantiza financiación aunque el comercio sea estadounidense. No falsear direcciones ni cambiar precios, moneda o impuestos para forzarla. Affirm limita las operaciones a países compatibles y transacciones domésticas; Klarna y Afterpay tienen su propia matriz de países, monedas e importes. Si la cuenta parece cumplir y el método sigue ausente, facilitar a soporte de Stripe el Session ID, modo, moneda, total y países, sin claves.

Referencias oficiales: [elegibilidad dinámica](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods), [Affirm](https://docs.stripe.com/payments/affirm), [Klarna](https://docs.stripe.com/payments/klarna), [Afterpay](https://docs.stripe.com/payments/afterpay-clearpay). La devolución del préstamo en cuotas no implica que el cobro del comercio esté pendiente: la aplicación siempre utiliza el estado real de Stripe.
