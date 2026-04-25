# Guía de Ejecución Local - Kipi Safe (Esqueleto PWA)

Este documento explica cómo levantar el entorno de desarrollo del monorepo actual.

## Requisitos Previos
- **Node.js** (versión 20.12.0 o superior)
- **pnpm** (versión 9.x)

## Comandos Principales

Desde la raíz del proyecto (`Kipi Safe/HCKMX26-1776486277`), puedes ejecutar el siguiente comando para iniciar todo el entorno de desarrollo:

```bash
pnpm dev
```

### ¿Qué hace `pnpm dev` internamente?
1. **Compila el Dominio**: Ejecuta `pnpm run build:domain` para asegurarse de que las reglas de negocio compartidas (`packages/domain`) estén compiladas y listas para usarse.
2. **Inicia la API (Hono)**: Levanta el servidor backend en modo desarrollo.
3. **Inicia la PWA (Vite + React)**: Levanta el servidor frontend en modo desarrollo.

## Puertos por Defecto (revisar salida de consola)
- **PWA (Frontend)**: Típicamente en `http://localhost:5173`
- **API (Backend)**: Típicamente en `http://localhost:3000` (el puerto específico te lo dirá la consola).

## Otros comandos útiles

- `pnpm build`: Compila todo el proyecto (Dominio, API y PWA) para producción.
- `pnpm typecheck`: Revisa que no haya errores de TypeScript en todo el proyecto.
- `pnpm lint`: Ejecuta el linter en todos los paquetes.
