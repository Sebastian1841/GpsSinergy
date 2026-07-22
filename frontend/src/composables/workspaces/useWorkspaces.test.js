import assert from "node:assert/strict"
import test from "node:test"
import { ref } from "vue"

import {
  ACTIVE_WORKSPACE_STORAGE_KEY,
  WORKSPACES_STORAGE_KEY,
  resetWorkspacesForTest,
  useWorkspaces,
} from "./useWorkspaces.js"

const createMemoryStorage = () => {
  const values = new Map()

  return {
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null
    },
    setItem(key, value) {
      values.set(String(key), String(value))
    },
    removeItem(key) {
      values.delete(String(key))
    },
  }
}

const withStorageWindow = (callback) => {
  const previousWindow = globalThis.window

  globalThis.window = {
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
  }

  resetWorkspacesForTest()

  try {
    callback(globalThis.window)
  } finally {
    resetWorkspacesForTest()

    if (previousWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = previousWindow
    }
  }
}

test("useWorkspaces creates a default workspace per user", () => {
  withStorageWindow((storageWindow) => {
    const routePath = ref("/app/company-1/activos")
    const routeName = ref("Activos")

    const { workspaces, activeWorkspaceId } = useWorkspaces({
      userId: ref("user-1"),
      currentRoutePath: routePath,
      currentRouteName: routeName,
      currentCompanyId: ref("company-1"),
    })

    assert.equal(workspaces.value.length, 1)
    assert.equal(workspaces.value[0].name, "Vista principal")
    assert.equal(workspaces.value[0].routePath, "/app/company-1/activos")
    assert.equal(activeWorkspaceId.value, workspaces.value[0].id)

    const storedWorkspaces = JSON.parse(storageWindow.localStorage.getItem(WORKSPACES_STORAGE_KEY))
    const storedActiveWorkspaces = JSON.parse(
      storageWindow.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY),
    )

    assert.equal(storedWorkspaces.length, 1)
    assert.equal(storedActiveWorkspaces["user-1"], workspaces.value[0].id)
  })
})

test("useWorkspaces manages custom workspace lifecycle", () => {
  withStorageWindow(() => {
    const routePath = ref("/app/company-1/activos")
    const routeName = ref("Activos")
    const assetGroupId = ref(null)

    const {
      workspaces,
      activeWorkspaceId,
      createWorkspace,
      renameWorkspace,
      saveCurrentWorkspaceView,
      selectWorkspace,
      deleteWorkspace,
    } = useWorkspaces({
      userId: ref("user-1"),
      currentRoutePath: routePath,
      currentRouteName: routeName,
      currentCompanyId: ref("company-1"),
      currentAssetGroupId: assetGroupId,
    })

    const defaultWorkspace = workspaces.value[0]
    const createdWorkspace = createWorkspace({
      name: "Operacion norte",
    })

    assert.equal(workspaces.value.length, 2)
    assert.equal(activeWorkspaceId.value, createdWorkspace.id)

    routePath.value = "/app/company-1/reportes"
    routeName.value = "Reportes"
    assetGroupId.value = "asset-group-1"

    const savedWorkspace = saveCurrentWorkspaceView(createdWorkspace.id)

    assert.equal(savedWorkspace.routePath, "/app/company-1/reportes")
    assert.equal(savedWorkspace.routeName, "Reportes")
    assert.equal(savedWorkspace.assetGroupId, "asset-group-1")

    const renamedWorkspace = renameWorkspace(createdWorkspace.id, "Turno noche")

    assert.equal(renamedWorkspace.name, "Turno noche")

    selectWorkspace(defaultWorkspace.id)
    assert.equal(activeWorkspaceId.value, defaultWorkspace.id)

    deleteWorkspace(createdWorkspace.id)

    assert.equal(workspaces.value.length, 1)
    assert.equal(workspaces.value[0].id, defaultWorkspace.id)
  })
})

test("useWorkspaces persists saved view settings", () => {
  withStorageWindow((storageWindow) => {
    const viewSettings = ref({
      module: "activos",
      fleetLayout: {
        leftPanelWidth: 520,
      },
      fleetTableColumns: {
        visibleColumnKeys: ["estado", "vehiculo", "velocidad"],
        columnOrderKeys: ["vehiculo", "estado", "velocidad"],
        columnWidthsByKey: {
          vehiculo: 220,
        },
      },
    })
    const { activeWorkspaceId, saveCurrentWorkspaceView } = useWorkspaces({
      userId: ref("user-1"),
      currentRoutePath: ref("/app/company-1/activos"),
      currentRouteName: ref("Activos"),
      currentCompanyId: ref("company-1"),
      currentViewSettings: viewSettings,
    })

    const savedWorkspace = saveCurrentWorkspaceView(activeWorkspaceId.value)

    assert.deepEqual(savedWorkspace.viewSettings.fleetLayout, {
      leftPanelWidth: 520,
    })
    assert.deepEqual(savedWorkspace.viewSettings.fleetTableColumns.columnOrderKeys, [
      "vehiculo",
      "estado",
      "velocidad",
    ])

    const storedWorkspaces = JSON.parse(storageWindow.localStorage.getItem(WORKSPACES_STORAGE_KEY))
    const storedWorkspace = storedWorkspaces.find((workspace) => {
      return workspace.id === activeWorkspaceId.value
    })

    assert.equal(storedWorkspace.viewSettings.fleetTableColumns.columnWidthsByKey.vehiculo, 220)
  })
})

test("useWorkspaces keeps at least one workspace", () => {
  withStorageWindow(() => {
    const { workspaces, deleteWorkspace } = useWorkspaces({
      userId: ref("user-1"),
      currentRoutePath: ref("/activos"),
      currentRouteName: ref("Activos"),
    })

    assert.equal(deleteWorkspace(workspaces.value[0].id), null)
    assert.equal(workspaces.value.length, 1)
  })
})

test("useWorkspaces exposes shared workspaces without allowing receiver edits", () => {
  withStorageWindow(() => {
    const ownerWorkspaces = useWorkspaces({
      userId: ref("user-1"),
      currentRoutePath: ref("/app/company-1/activos"),
      currentRouteName: ref("Activos"),
      currentCompanyId: ref("company-1"),
    })
    const sharedWorkspace = ownerWorkspaces.createWorkspace({
      name: "Vista compartida",
      sharedWithUserIds: ["user-2"],
    })

    const receiverWorkspaces = useWorkspaces({
      userId: ref("user-2"),
      currentRoutePath: ref("/app/company-2/activos"),
      currentRouteName: ref("Activos"),
      currentCompanyId: ref("company-2"),
    })
    const receiverSharedWorkspace = receiverWorkspaces.workspaces.value.find((workspace) => {
      return workspace.id === sharedWorkspace.id
    })

    assert.ok(receiverSharedWorkspace)
    assert.equal(receiverSharedWorkspace.sharedWithCurrentUser, true)
    assert.equal(receiverSharedWorkspace.ownedByCurrentUser, false)
    assert.equal(receiverWorkspaces.selectWorkspace(sharedWorkspace.id)?.id, sharedWorkspace.id)
    assert.equal(receiverWorkspaces.renameWorkspace(sharedWorkspace.id, "Cambio externo"), null)
    assert.equal(receiverWorkspaces.saveCurrentWorkspaceView(sharedWorkspace.id), null)
    assert.equal(receiverWorkspaces.deleteWorkspace(sharedWorkspace.id), null)

    const ownerSharedWorkspace = ownerWorkspaces.workspaces.value.find((workspace) => {
      return workspace.id === sharedWorkspace.id
    })

    assert.equal(ownerSharedWorkspace.name, "Vista compartida")
  })
})
