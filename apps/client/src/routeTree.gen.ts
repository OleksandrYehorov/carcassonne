/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as GameCreateImport } from './routes/game.create'
import { Route as GameGameIdImport } from './routes/game.$gameId'
import { Route as GameGameIdWaitImport } from './routes/game_.$gameId.wait'
import { Route as GameGameIdJoinImport } from './routes/game_.$gameId.join'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const GameCreateRoute = GameCreateImport.update({
  id: '/game/create',
  path: '/game/create',
  getParentRoute: () => rootRoute,
} as any)

const GameGameIdRoute = GameGameIdImport.update({
  id: '/game/$gameId',
  path: '/game/$gameId',
  getParentRoute: () => rootRoute,
} as any)

const GameGameIdWaitRoute = GameGameIdWaitImport.update({
  id: '/game_/$gameId/wait',
  path: '/game/$gameId/wait',
  getParentRoute: () => rootRoute,
} as any)

const GameGameIdJoinRoute = GameGameIdJoinImport.update({
  id: '/game_/$gameId/join',
  path: '/game/$gameId/join',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/game/$gameId': {
      id: '/game/$gameId'
      path: '/game/$gameId'
      fullPath: '/game/$gameId'
      preLoaderRoute: typeof GameGameIdImport
      parentRoute: typeof rootRoute
    }
    '/game/create': {
      id: '/game/create'
      path: '/game/create'
      fullPath: '/game/create'
      preLoaderRoute: typeof GameCreateImport
      parentRoute: typeof rootRoute
    }
    '/game_/$gameId/join': {
      id: '/game_/$gameId/join'
      path: '/game/$gameId/join'
      fullPath: '/game/$gameId/join'
      preLoaderRoute: typeof GameGameIdJoinImport
      parentRoute: typeof rootRoute
    }
    '/game_/$gameId/wait': {
      id: '/game_/$gameId/wait'
      path: '/game/$gameId/wait'
      fullPath: '/game/$gameId/wait'
      preLoaderRoute: typeof GameGameIdWaitImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/game/$gameId': typeof GameGameIdRoute
  '/game/create': typeof GameCreateRoute
  '/game/$gameId/join': typeof GameGameIdJoinRoute
  '/game/$gameId/wait': typeof GameGameIdWaitRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/game/$gameId': typeof GameGameIdRoute
  '/game/create': typeof GameCreateRoute
  '/game/$gameId/join': typeof GameGameIdJoinRoute
  '/game/$gameId/wait': typeof GameGameIdWaitRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/game/$gameId': typeof GameGameIdRoute
  '/game/create': typeof GameCreateRoute
  '/game_/$gameId/join': typeof GameGameIdJoinRoute
  '/game_/$gameId/wait': typeof GameGameIdWaitRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/game/$gameId'
    | '/game/create'
    | '/game/$gameId/join'
    | '/game/$gameId/wait'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/game/$gameId'
    | '/game/create'
    | '/game/$gameId/join'
    | '/game/$gameId/wait'
  id:
    | '__root__'
    | '/'
    | '/game/$gameId'
    | '/game/create'
    | '/game_/$gameId/join'
    | '/game_/$gameId/wait'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  GameGameIdRoute: typeof GameGameIdRoute
  GameCreateRoute: typeof GameCreateRoute
  GameGameIdJoinRoute: typeof GameGameIdJoinRoute
  GameGameIdWaitRoute: typeof GameGameIdWaitRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  GameGameIdRoute: GameGameIdRoute,
  GameCreateRoute: GameCreateRoute,
  GameGameIdJoinRoute: GameGameIdJoinRoute,
  GameGameIdWaitRoute: GameGameIdWaitRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/game/$gameId",
        "/game/create",
        "/game_/$gameId/join",
        "/game_/$gameId/wait"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/game/$gameId": {
      "filePath": "game.$gameId.tsx"
    },
    "/game/create": {
      "filePath": "game.create.tsx"
    },
    "/game_/$gameId/join": {
      "filePath": "game_.$gameId.join.tsx"
    },
    "/game_/$gameId/wait": {
      "filePath": "game_.$gameId.wait.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
