import test from "node:test"
import assert from "node:assert/strict"
import { ref, computed } from "vue"
import { useUserAccessDrafts } from "./useUserAccessDrafts.js"

const setup = ({ admin = false, targetAdmin = false, canEdit = true } = {}) => {
  const users = ref([
    {
      id: "target",
      name: "Target",
      username: "target",
      email: "t@test.cl",
      password: "original",
      status: "active",
      isPlatformAdmin: targetAdmin,
    },
  ])
  const accesses = ref(
    ["A", "B"].map((id) => ({
      id,
      userId: "target",
      applicationId: id,
      status: "active",
      role: "viewer",
      modules: [],
      functions: [],
      scope: { type: "selected-assets", assetIds: [] },
    })),
  )
  const applications = ref([
    { id: "A", companyId: "a" },
    { id: "B", companyId: "b" },
  ])
  const selectedUserId = ref("target")
  const selectedUser = computed(() => users.value.find((u) => u.id === selectedUserId.value))
  const selectedUserAccesses = computed(() =>
    accesses.value.filter((a) => a.userId === selectedUserId.value),
  )
  const editor = useUserAccessDrafts({
    users,
    accesses,
    applications,
    modules: ref([]),
    moduleFunctions: ref([]),
    assets: ref([]),
    assetTags: ref([]),
    selectedUserId,
    selectedUser,
    selectedUserAccesses,
    applicationsById: computed(() => new Map(applications.value.map((a) => [a.id, a]))),
    currentUserId: ref("operator"),
    isPlatformAdmin: ref(admin),
    canManageApplication: (id) => admin || id === "A",
    canCreateInApplication: (id) => admin || id === "A",
    canEditUser: () => canEdit,
    createDatabaseUser: (user) => users.value.push(user),
    updateDatabaseUser: (id, patch) =>
      Object.assign(
        users.value.find((u) => u.id === id),
        patch,
      ),
    createDatabaseAccess: (access) => accesses.value.push(access),
    deleteDatabaseAccess: (id) => {
      accesses.value = accesses.value.filter((a) => a.id !== id)
    },
  })
  return { editor, users, accesses }
}

test("non-platform operators cannot open or submit edits to a platform administrator", () => {
  const { editor, users } = setup({ targetAdmin: true })
  editor.openEditUserModal()
  assert.equal(editor.showEditorModal.value, false)
  editor.editorMode.value = "edit"
  editor.draftUser.value = { ...users.value[0], password: "replacement" }
  editor.saveUserFromModal()
  assert.equal(users.value[0].password, "original")
})

test("platform administrators can still edit administrator credentials", () => {
  const { editor, users } = setup({ admin: true, targetAdmin: true })
  editor.openEditUserModal()
  editor.draftUser.value.password = "replacement"
  editor.saveUserFromModal()
  assert.equal(users.value[0].password, "replacement")
})

test("every access mutation rejects a destination application outside the operator scope", () => {
  const { editor, accesses } = setup()
  const before = JSON.stringify(accesses.value)
  editor.updateAccessRole("B", "admin")
  editor.toggleAccessStatus("B")
  editor.toggleModuleAccess("B", "users")
  editor.toggleFunctionAccess("B", "users-view")
  editor.togglePermission("B", "users-view", "edit")
  editor.updateOperationalScope("B", "all-assets")
  editor.toggleScopeAsset("B", "asset")
  editor.toggleScopeAssetTag("B", "tag")
  editor.removeApplicationAccess("B")
  assert.equal(JSON.stringify(accesses.value), before)
  editor.updateAccessRole("A", "editor")
  assert.equal(accesses.value[0].role, "editor")
  accesses.value = accesses.value.filter((a) => a.id !== "B")
  editor.addApplicationAccess("B")
  assert.equal(accesses.value.length, 1)
})

test("user creation cannot bypass the destination company check", () => {
  const { editor, users } = setup()
  editor.openCreateUserModal()
  Object.assign(editor.draftUser.value, {
    name: "New",
    username: "new",
    email: "new@test.cl",
    password: "long-password",
    initialApplicationId: "B",
  })
  editor.saveUserFromModal()
  assert.equal(users.value.length, 1)
  assert.equal(editor.showEditorModal.value, true)
})

test("editing a user outside the permitted companies is rejected even with a supplied draft", () => {
  const { editor, users } = setup({ canEdit: false })
  editor.openEditUserModal()
  assert.equal(editor.showEditorModal.value, false)
  editor.editorMode.value = "edit"
  editor.draftUser.value = { ...users.value[0], password: "replacement" }
  editor.saveUserFromModal()
  editor.toggleSelectedUserStatus()
  assert.equal(users.value[0].password, "original")
  assert.equal(users.value[0].status, "active")
})
