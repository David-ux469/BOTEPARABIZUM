# Publicar en Google Play Store

Guía para llevar **Bote para Bizum v1.0.0** a producción.

## Qué hace la app (texto para la ficha)

**Título:** Bote para Bizum  
**Descripción corta:** Organiza vacas y serruchos en grupo con Bizum.

**Descripción larga (sugerida):**

> Crea botes para cenas, viajes, regalos o cualquier plan en grupo.
> Invita con un código, controla quién ha pagado y envía Bizum al organizador desde tu app bancaria.
>
> · Crea y gestiona botes  
> · Invita participantes con código  
> · Copia datos del Bizum (importe, teléfono, concepto)  
> · Marca pagos y recordatorios  
>
> **Importante:** esta app no procesa pagos ni guarda dinero. Los Bizums los envías tú desde tu banco al teléfono del organizador del bote.

## Requisitos obligatorios de Play Store

| Requisito | Estado en el proyecto |
|-----------|------------------------|
| Política de privacidad (URL pública HTTPS) | `privacy.html` — súbela a tu hosting |
| App funcional sin engaños | Sin pagos simulados; flujo manual honesto |
| Icono 512×512 PNG | Tienes SVG — exporta PNG para Play Console |
| Capturas de pantalla | Haz 2–4 capturas del móvil |
| Clasificación de contenido | Finanzas / utilidad, sin pagos in-app |
| Email de contacto | Cambia `soporte@boteparabizum.app` en `privacy.html` y `js/config.js` |

## Paso 1 — Hosting HTTPS

La app debe estar en una URL HTTPS (obligatorio para PWA/TWA):

```bash
# Ejemplo local de prueba
cd BoteParaBizum_APP
python -m http.server 8080
```

Sube la carpeta completa a:
- **Netlify** (arrastra la carpeta)
- **Vercel**
- **Firebase Hosting**
- **GitHub Pages**

Tu URL será algo como: `https://tudominio.com`

## Paso 2 — Empaquetar para Android (TWA)

Google recomienda **Trusted Web Activity** (PWA dentro de Chrome):

1. Instala [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Inicializa el proyecto Android:
   ```bash
   bubblewrap init --manifest https://tudominio.com/manifest.json
   ```
3. Genera el APK/AAB:
   ```bash
   bubblewrap build
   ```
4. Sube el `.aab` en [Google Play Console](https://play.google.com/console).

Alternativa: wrapper WebView con Android Studio (menos recomendado que TWA).

## Paso 3 — Play Console

1. Crear app → categoría **Utilidades** o **Finanzas**
2. Política de privacidad → URL de `https://tudominio.com/privacy.html`
3. Declarar que **no** hay compras in-app ni procesamiento de pagos
4. Declarar recopilación de datos: **No** (todo es local en el dispositivo)
5. Subir icono 512 PNG y capturas
6. Prueba interna → producción

## Paso 4 — Antes de publicar (checklist)

- [ ] Cambiar email de soporte en `js/config.js` y `privacy.html`
- [ ] Probar registro → crear bote → invitar → unirse con código
- [ ] Probar «Enviar Bizum» → copiar datos → confirmar pago
- [ ] Probar en Android real (Chrome + «Añadir a pantalla de inicio»)
- [ ] Exportar iconos PNG 192 y 512 desde los SVG
- [ ] Verificar que la URL de invitación (`?join=CODIGO`) funciona en HTTPS

## Nota sobre la marca Bizum

«Bizum» es marca registrada. En la ficha de Play Store deja claro que la app **no está afiliada a Bizum** y solo ayuda a organizar pagos entre personas.

## Versión

Versión actual: **1.0.0** (`js/config.js` + badge en la app).
