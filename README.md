# NextFarma Mostrador

App independiente y ligera con una sola función: buscar un producto por CN o nombre y ver
al momento su Grupo Publicitario, sus alternativas ordenadas por margen y el semáforo de
colores (verde/amarillo/gris) — para dejar en una ventana pequeña junto a Farmatic, sin
pasar por el navegador ni abrir NextFarma Sync completo.

Es la misma funcionalidad de la pestaña "Mostrador" de `nextfarma-sync-agent`, extraída a
su propio ejecutable — pensada para quien solo necesita consultar en el mostrador, no
sincronizar. No incluye `mssql`, `electron-updater`, `better-sqlite3` ni `xlsx`: no
sincroniza nada ni escribe en Farmatic, solo consulta la API de NextFarma.

## Configuración

Al abrirla por primera vez pide una API Key — la misma que ya tiene configurada
NextFarma Sync en esa farmacia (Configuración → API Key, en esa app). Se guarda una sola
vez, en su propia configuración local (no comparte la de NextFarma Sync).

## Desarrollo

```
npm install
npm start
```

## Build

```
npm run build:win   # NSIS installer para Windows
npm run build:mac   # DMG para mac (desarrollo/pruebas)
```
