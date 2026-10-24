# NextFarma Mostrador

App independiente y ligera con una sola función: buscar un producto por CN o nombre y ver
al momento su grupo de Receta o Publicitarios, sus alternativas y los colores y datos básicos
de cada CN — para dejar en una ventana pequeña junto a Farmatic, sin
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

## Actualizaciones

Las versiones instaladas en Windows comprueban al arrancar si hay una nueva versión
publicada en el release de GitHub y la descargan automáticamente. Cuando termina la
descarga, la app ofrece reiniciar para instalarla; si se elige «Más tarde», la instala al
cerrarse. La comprobación no se ejecuta en modo desarrollo. El workflow de GitHub genera
el instalador y el manifiesto de actualización al publicar un tag `v*`.
La versión 1.0.1 y anteriores no incluyen el actualizador: hay que instalar manualmente
una versión posterior una vez; a partir de entonces, las actualizaciones son automáticas.

El Mostrador no ejecuta la sincronización de Farmatic: busca y consulta grupos y datos
directamente en la API con la API Key configurada. Los grupos y colores disponibles se
actualizan cuando el agente XestFarma Sync envía cambios a la API.
