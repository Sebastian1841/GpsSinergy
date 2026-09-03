import assert from "node:assert/strict"
import { test } from "node:test"

import { useMockDatabase } from "./useMockDatabase.js"

test("useMockDatabase gives platform admins access to every application", () => {
  const { users, accesses, applications } = useMockDatabase()
  const platformAdmins = users.value.filter((user) => user.isPlatformAdmin)

  assert.ok(platformAdmins.length > 0)

  platformAdmins.forEach((admin) => {
    const accessesByApplicationId = new Map(
      accesses.value
        .filter((access) => String(access.userId) === String(admin.id))
        .map((access) => [String(access.applicationId), access]),
    )

    assert.equal(accessesByApplicationId.size, applications.value.length)

    applications.value.forEach((application) => {
      const access = accessesByApplicationId.get(String(application.id))

      assert.ok(access)
      assert.equal(access.role, "admin")
      assert.equal(access.status, "active")
      assert.equal(access.scope.type, "all-assets")
      assert.ok(access.modules.every((moduleAccess) => moduleAccess.enabled))
      assert.ok(
        access.functions.every((functionAccess) => {
          return (
            functionAccess.enabled &&
            functionAccess.permissions.view &&
            functionAccess.permissions.edit &&
            functionAccess.permissions.admin
          )
        }),
      )
    })
  })
})
