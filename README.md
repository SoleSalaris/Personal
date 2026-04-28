# Legajo de Personal - Consorcio

Aplicación para la actualización de legajos del personal del consorcio con firma digital y descarga de PDF.

## Cómo publicar en GitHub Pages

Esta aplicación está configurada para desplegarse automáticamente en GitHub Pages usando GitHub Actions.

### Pasos:

1. **Sube el código a GitHub**: Crea un repositorio en GitHub y sube todos los archivos.
2. **Configura GitHub Pages**:
   - Ve a la pestaña **Settings** de tu repositorio.
   - En el menú lateral, selecciona **Pages**.
   - En la sección **Build and deployment**, cambia el **Source** a `GitHub Actions`.
3. **Ejecuta el despliegue**:
   - Cada vez que hagas un `push` a la rama `main`, la aplicación se compilará y publicará automáticamente.
   - Puedes ver el progreso en la pestaña **Actions** de tu repositorio.

### Configuración de Vite

Se ha añadido `base: './'` en `vite.config.ts` para asegurar que los archivos se carguen correctamente sin importar el nombre del repositorio.
