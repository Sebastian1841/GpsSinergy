import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useAuthSession } from "../auth/useAuthSession.js"
import { useAccessControl } from "../auth/useAccessControl.js"
import { useUsersService } from "../../services/users/useUsersService.js"
import { useSupportService } from "../../services/support/useSupportService.js"
import {
  saveSupportFile,
  getSupportFile,
  deleteSupportFile,
} from "../../services/support/supportAttachmentStorage.js"
import {
  canReadSupportRequest,
  canManageSupportRequest,
  validateSupportFiles,
} from "../../utils/support/supportRequestUtils.js"

export const useSupportPanel = () => {
  const route = useRoute()
  const { currentUser, currentAccesses } = useAuthSession()
  const { accessibleCompanies, visibleAssets } = useAccessControl()
  const { users, accesses, applications } = useUsersService()
  const service = useSupportService()
  const search = ref(""),
    status = ref(""),
    type = ref(""),
    company = ref("")
  const selectedId = ref(""),
    page = ref(1),
    busy = ref(false),
    error = ref(""),
    notice = ref("")
  const createOpen = ref(false),
    replyText = ref(""),
    replyFiles = ref([])
  const management = ref({ status: "received", assigneeId: "", scheduledAt: "" })
  const companyForAccess = (access) =>
    applications.value.find((app) => String(app.id) === String(access.applicationId))?.companyId
  const technicianCompanyIds = computed(() =>
    currentAccesses.value
      .filter((access) => access.role === "technician")
      .map(companyForAccess)
      .filter(Boolean),
  )
  const context = (companyId = "") => ({
    user: currentUser.value,
    companyIds: accessibleCompanies.value.map((item) => item.id),
    technicianCompanyIds: technicianCompanyIds.value,
    assetIds: visibleAssets.value
      .filter((asset) => String(asset.companyId) === String(companyId))
      .map((asset) => asset.id),
    assigneeIds: assigneesFor(companyId).map((user) => user.id),
  })
  const assigneesFor = (companyId) =>
    users.value.filter(
      (user) =>
        user.status === "active" &&
        (user.isPlatformAdmin ||
          accesses.value.some(
            (access) =>
              String(access.userId) === String(user.id) &&
              access.status === "active" &&
              access.role === "technician" &&
              String(companyForAccess(access)) === String(companyId),
          )),
    )
  const visible = computed(() => {
    const scope = context()
    return service.requests.value.filter((item) => canReadSupportRequest(item, scope))
  })
  const normalize = (text) =>
    String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  const filtered = computed(() => {
    const query = normalize(search.value).trim()
    return visible.value
      .filter(
        (item) =>
          (!company.value || item.companyId === company.value) &&
          (!status.value || item.status === status.value) &&
          (!type.value || item.type === type.value) &&
          (!query ||
            normalize(
              [item.number, item.subject, item.company, item.plate, item.creator].join(" "),
            ).includes(query)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 10)))
  const displayed = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const selected = computed(
    () => visible.value.find((item) => item.id === selectedId.value) || null,
  )
  const canManage = computed(
    () =>
      selected.value && canManageSupportRequest(selected.value, context(selected.value.companyId)),
  )
  const assignees = computed(() => (canManage.value ? assigneesFor(selected.value.companyId) : []))
  const counts = computed(() => ({
    open: visible.value.filter((item) => item.status !== "resolved").length,
    waiting: visible.value.filter((item) => item.status === "waiting").length,
    resolved: visible.value.filter((item) => item.status === "resolved").length,
  }))
  watch([search, status, type, company], () => {
    page.value = 1
  })
  watch(pageCount, (count) => {
    page.value = Math.min(page.value, count)
  })
  watch(
    filtered,
    (rows) => {
      if (!rows.some((item) => item.id === selectedId.value)) selectedId.value = rows[0]?.id || ""
    },
    { immediate: true },
  )
  watch(
    selected,
    (item) => {
      management.value = {
        status: item?.status || "received",
        assigneeId: item?.assigneeId || "",
        scheduledAt: item?.scheduledAt || "",
      }
    },
    { immediate: true },
  )
  watch(selectedId, () => {
    replyText.value = ""
    replyFiles.value = []
  })
  watch(
    () => currentUser.value?.id,
    () => {
      createOpen.value = false
      error.value = ""
      notice.value = ""
      company.value = ""
      search.value = ""
      selectedId.value = ""
    },
  )
  const initialCompanyId = accessibleCompanies.value.find(
    (item) => String(item.id) === String(route.query.empresa),
  )?.id
  if (initialCompanyId) company.value = String(initialCompanyId)
  const run = async (action) => {
    if (busy.value) return
    busy.value = true
    error.value = ""
    notice.value = ""
    try {
      await action()
    } catch (cause) {
      error.value = cause.message || "No se pudo completar la operacion."
    } finally {
      busy.value = false
    }
  }
  const withFiles = async (files, action) => {
    validateSupportFiles(files)
    const actorId = currentUser.value?.id,
      saved = []
    try {
      for (const file of files) saved.push(await saveSupportFile(file))
      if (currentUser.value?.id !== actorId)
        throw new Error("La sesion cambio. Vuelve a intentarlo.")
      await action(saved)
    } catch (cause) {
      await Promise.allSettled(saved.map((file) => deleteSupportFile(file.storageId)))
      throw cause
    }
  }
  const createRequest = (draft) =>
    run(async () => {
      const target = accessibleCompanies.value.find(
        (item) => String(item.id) === String(draft.companyId),
      )
      if (!target) throw new Error("Selecciona una empresa autorizada.")
      const asset = visibleAssets.value.find(
        (item) =>
          String(item.id) === String(draft.vehicleId) &&
          String(item.companyId) === String(target.id),
      )
      await withFiles(draft.files, (attachments) => {
        const id = service.create(
          {
            ...draft,
            companyId: String(target.id),
            company: target.name,
            plate: asset?.patente || asset?.plate || "",
            attachments,
          },
          context(target.id),
        )
        search.value = status.value = type.value = company.value = ""
        selectedId.value = id
        page.value = 1
        createOpen.value = false
        notice.value = "Solicitud enviada."
      })
    })
  const sendReply = () => {
    const id = selected.value?.id,
      text = replyText.value,
      files = [...replyFiles.value]
    return run(() =>
      withFiles(files, (attachments) => {
        service.reply(id, text, attachments, context())
        replyText.value = ""
        replyFiles.value = []
        notice.value = "Respuesta enviada."
      }),
    )
  }
  const saveManagement = () =>
    run(() => {
      const item = selected.value,
        draft = management.value
      const assignee = assignees.value.find((user) => String(user.id) === String(draft.assigneeId))
      service.update(item.id, { ...draft, assignee: assignee?.name || "" }, context(item.companyId))
      notice.value = "Solicitud actualizada."
    })
  const downloadAttachment = (requestId, attachment) =>
    run(async () => {
      const request = service.requireRequest(requestId, context())
      if (
        !request.messages.some((message) =>
          message.attachments?.some((file) => file.storageId === attachment.storageId),
        )
      )
        throw new Error("Adjunto no autorizado.")
      const file = await getSupportFile(attachment.storageId)
      service.requireRequest(requestId, context())
      if (!file) throw new Error("El adjunto ya no esta disponible en este navegador.")
      const url = URL.createObjectURL(file),
        link = document.createElement("a")
      link.href = url
      link.download = attachment.name
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    })
  return {
    accessibleCompanies,
    visibleAssets,
    search,
    status,
    type,
    company,
    selectedId,
    page,
    pageCount,
    filtered,
    displayed,
    selected,
    canManage,
    assignees,
    counts,
    busy,
    error,
    notice,
    createOpen,
    replyText,
    replyFiles,
    management,
    createRequest,
    sendReply,
    saveManagement,
    downloadAttachment,
  }
}
