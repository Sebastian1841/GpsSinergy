<template>
  <div class="min-h-0 flex-1 overflow-auto bg-[#f6f8fb] p-3">
    <section
      class="flex min-h-full flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white"
    >
      <div class="shrink-0 border-b border-[#e8ecf2] bg-[#f8fafc] p-3">
        <input
          ref="importFileInputRef"
          class="sr-only"
          type="file"
          accept=".csv,.xml,.kml,.kmz,.geojson,.json,text/csv,application/xml,application/geo+json,application/json,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
          @change="handleImportFileChange"
        />

        <section
          class="rounded-xl border border-[#d8dee8] bg-white p-3 shadow-[0_8px_22px_rgba(15,35,114,0.05)]"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-[15px] font-black text-[#102372]">Geocercas</h4>

                <span
                  class="rounded-lg bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ geofences.length }}
                </span>
              </div>

              <p class="mt-1 text-[10px] font-semibold text-slate-500">
                Organiza zonas por grupo, revisa el listado y administra archivos.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-if="canEditGeofences"
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#0c1b59]"
                @click="showCreateGeofenceHelpModal = true"
              >
                <span class="text-[16px] leading-none">+</span>
                Nueva geocerca
              </button>

              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @click="openGeofenceFileModal"
              >
                Importar / exportar
              </button>

              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @click="showGeofenceGroupsModal = true"
              >
                Grupos
              </button>
            </div>
          </div>

          <div
            class="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-2"
          >
            <span class="text-[11px] font-black text-[#102372]">
              Usar geocerca como direccion
            </span>

            <button
              type="button"
              class="relative h-7 w-12 shrink-0 rounded-full transition"
              :class="useGeofenceLocationAddress ? 'bg-[#FF6600]' : 'bg-slate-300'"
              :aria-pressed="useGeofenceLocationAddress"
              aria-label="Usar geocerca como direccion"
              @click="emit('update:use-geofence-location-address', !useGeofenceLocationAddress)"
            >
              <span
                class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition"
                :class="useGeofenceLocationAddress ? 'left-6' : 'left-1'"
              ></span>
            </button>
          </div>
        </section>

        <label class="mt-3 block">
          <span class="sr-only">Buscar geocerca o zona</span>

          <span class="relative block">
            <svg
              viewBox="0 0 24 24"
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m20 20-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>

            <input
              :value="search"
              type="search"
              class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white pl-10 pr-9 text-[12px] font-semibold text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
              placeholder="Buscar geocerca o zona..."
              @input="emit('update:search', $event.target.value)"
            />

            <button
              v-if="search"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-base font-black leading-none text-slate-400 transition hover:text-[#FF6600]"
              aria-label="Limpiar busqueda"
              @click="emit('update:search', '')"
            >
              &times;
            </button>
          </span>
        </label>
      </div>

      <div
        v-if="showGeofenceGroupsModal"
        class="fixed inset-0 z-[920] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="geofence-groups-title"
        tabindex="-1"
        @click.self="showGeofenceGroupsModal = false"
        @keydown.esc="showGeofenceGroupsModal = false"
      >
        <section
          class="flex max-h-[calc(100vh-16px)] w-full max-w-[520px] flex-col overflow-hidden rounded-t-xl border border-[#d8dee8] bg-white shadow-[0_24px_70px_rgba(15,35,114,0.22)] sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
        >
          <header
            class="flex shrink-0 items-center justify-between gap-3 border-b border-[#e8ecf2] bg-white px-4 py-3"
          >
            <div class="min-w-0">
              <h3 id="geofence-groups-title" class="text-[16px] font-black text-[#102372]">
                Nuevo grupo de geocercas
              </h3>
            </div>

            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#102372]"
              aria-label="Cerrar"
              @click="showGeofenceGroupsModal = false"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M6 18 18 6M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </header>

          <div class="min-h-0 overflow-auto bg-[#f8fafc] p-3">
            <div class="grid gap-2.5">
              <section
                v-if="canEditGeofences"
                class="rounded-lg border border-[#d8dee8] bg-white p-3"
              >
                <form
                  class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_92px]"
                  @submit.prevent="handleCreateGeofenceGroup"
                >
                  <label class="min-w-0">
                    <span class="sr-only">Nombre del grupo</span>

                    <input
                      v-model="newGeofenceGroupName"
                      type="text"
                      class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                      placeholder="Nombre del grupo"
                    />
                  </label>

                  <button
                    type="submit"
                    class="h-10 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white transition hover:bg-[#0c1b59] disabled:cursor-not-allowed disabled:bg-slate-300"
                    :disabled="!canCreateGeofenceGroup"
                  >
                    Crear
                  </button>
                </form>

                <p
                  v-if="geofenceGroupFormMessage"
                  class="mt-2 text-[10px] font-bold"
                  :class="geofenceGroupFormMessageClass"
                >
                  {{ geofenceGroupFormMessage }}
                </p>
              </section>

              <section class="overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
                <header
                  class="flex items-center justify-between gap-3 border-b border-[#e8ecf2] px-3 py-2.5"
                >
                  <p class="text-[12px] font-black text-[#102372]">Grupos existentes</p>

                  <span
                    class="rounded-md bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]"
                  >
                    {{ visibleGeofenceGroups.length }}
                  </span>
                </header>

                <div v-if="visibleGeofenceGroups.length" class="divide-y divide-[#e8ecf2]">
                  <article
                    v-for="group in visibleGeofenceGroups"
                    :key="group.id"
                    class="grid gap-2 px-3 py-2.5"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          class="h-2.5 w-2.5 shrink-0 rounded-full"
                          :style="{ backgroundColor: group.color }"
                        ></span>

                        <span class="min-w-0">
                          <span class="block truncate text-[12px] font-black text-[#172033]">
                            {{ group.label }}
                          </span>

                          <span
                            class="mt-0.5 block truncate text-[10px] font-semibold text-slate-500"
                          >
                            {{ getGeofenceGroupRowDescription(group) }}
                          </span>
                        </span>
                      </div>

                      <div
                        v-if="
                          canEditGeofences && !group.isUngrouped && !isEditingGeofenceGroup(group)
                        "
                        class="flex shrink-0 items-center gap-1.5"
                      >
                        <button
                          type="button"
                          class="rounded-md px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#102372]/10"
                          @click="startRenameGeofenceGroup(group)"
                        >
                          Renombrar
                        </button>

                        <button
                          type="button"
                          class="rounded-md px-2 py-1 text-[10px] font-black text-red-600 transition hover:bg-red-50"
                          @click="handleDeleteGeofenceGroup(group)"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <form
                      v-if="isEditingGeofenceGroup(group)"
                      class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                      @submit.prevent="handleRenameGeofenceGroup"
                    >
                      <label class="min-w-0">
                        <span class="sr-only">Nuevo nombre del grupo</span>

                        <input
                          v-model="editingGeofenceGroupName"
                          type="text"
                          class="h-9 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-bold text-[#102372] outline-none transition placeholder:text-slate-400 focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                          placeholder="Nuevo nombre"
                        />
                      </label>

                      <button
                        type="button"
                        class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-slate-600 transition hover:border-[#102372] hover:text-[#102372]"
                        @click="cancelRenameGeofenceGroup"
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        class="h-9 rounded-lg bg-[#FF6600] px-3 text-[10px] font-black text-white transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                        :disabled="!canSaveGeofenceGroupRename"
                      >
                        Guardar
                      </button>
                    </form>

                    <p
                      v-if="isEditingGeofenceGroup(group) && geofenceGroupRenameMessage"
                      class="text-[10px] font-bold"
                      :class="
                        hasDuplicateEditingGeofenceGroupName ? 'text-red-600' : 'text-slate-500'
                      "
                    >
                      {{ geofenceGroupRenameMessage }}
                    </p>
                  </article>
                </div>

                <div v-else class="px-4 py-5 text-center">
                  <p class="text-[12px] font-black text-[#102372]">No hay grupos creados</p>

                  <p class="mt-1 text-[10px] font-semibold text-slate-500">
                    Crea un grupo para clasificar nuevas geocercas.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="showGeofenceFileModal"
        class="fixed inset-0 z-[920] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="geofence-file-title"
        @click.self="showGeofenceFileModal = false"
      >
        <section
          class="flex max-h-[calc(100vh-16px)] w-full max-w-[500px] flex-col overflow-hidden rounded-t-xl border border-[#d8dee8] bg-white shadow-2xl sm:max-h-[calc(100vh-32px)] sm:rounded-xl"
        >
          <header
            class="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8ecf2] px-4 py-3"
          >
            <div class="min-w-0">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]">
                Intercambio
              </p>

              <h3 id="geofence-file-title" class="mt-0.5 text-[15px] font-black text-[#102372]">
                Importar y exportar
              </h3>
            </div>

            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] text-[14px] font-black text-slate-500 transition hover:border-[#FF6600] hover:text-[#FF6600]"
              aria-label="Cerrar"
              @click="showGeofenceFileModal = false"
            >
              x
            </button>
          </header>

          <div class="grid gap-3 bg-[#f8fafc] p-4">
            <div class="grid grid-cols-2 gap-2 rounded-xl border border-[#d8dee8] bg-white p-1">
              <button
                type="button"
                class="h-9 rounded-lg text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-60"
                :class="
                  activeGeofenceFileModule === 'export'
                    ? 'bg-[#102372] text-white shadow-sm'
                    : 'text-[#102372] hover:bg-[#102372]/10'
                "
                :disabled="isImportingGeofences"
                @click="setActiveGeofenceFileModule('export')"
              >
                Exportar
              </button>

              <button
                type="button"
                class="h-9 rounded-lg text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-60"
                :class="
                  activeGeofenceFileModule === 'import'
                    ? 'bg-[#102372] text-white shadow-sm'
                    : 'text-[#102372] hover:bg-[#102372]/10'
                "
                :disabled="isImportingGeofences"
                @click="setActiveGeofenceFileModule('import')"
              >
                Importar
              </button>
            </div>

            <section
              v-if="activeGeofenceFileModule === 'export'"
              class="rounded-xl border border-[#d8dee8] bg-white p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[12px] font-black text-[#102372]">Exportar</p>

                  <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                    Elige formato y grupos a incluir.
                  </p>
                </div>

                <span
                  class="rounded-md bg-[#102372]/10 px-2 py-1 text-[10px] font-black text-[#102372]"
                >
                  {{ selectedExportGeofences.length }}
                </span>
              </div>

              <label class="mt-3 block">
                <span
                  class="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                >
                  Formato
                </span>

                <select
                  v-model="selectedFileFormat"
                  class="h-10 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[12px] font-black text-[#102372] outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  :disabled="isImportingGeofences"
                >
                  <option
                    v-for="formatOption in GEOFENCE_FILE_FORMAT_OPTIONS"
                    :key="formatOption.id"
                    :value="formatOption.id"
                  >
                    {{ formatOption.label }}
                  </option>
                </select>
              </label>

              <div class="mt-3 overflow-hidden rounded-lg border border-[#e8ecf2]">
                <header
                  class="flex items-center justify-between gap-2 border-b border-[#e8ecf2] bg-[#f8fafc] px-3 py-2"
                >
                  <p class="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                    Grupos
                  </p>

                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="rounded-md px-2 py-1 text-[10px] font-black text-[#102372] transition hover:bg-[#102372]/10 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="!exportableGeofenceGroups.length || areAllExportGroupsSelected"
                      @click="selectAllExportGroups"
                    >
                      Todos
                    </button>

                    <button
                      type="button"
                      class="rounded-md px-2 py-1 text-[10px] font-black text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="!selectedExportGroupIds.length"
                      @click="clearExportGroups"
                    >
                      Limpiar
                    </button>
                  </div>
                </header>

                <div
                  v-if="exportableGeofenceGroups.length"
                  class="max-h-[170px] overflow-auto divide-y divide-[#e8ecf2]"
                >
                  <label
                    v-for="group in exportableGeofenceGroups"
                    :key="group.id"
                    class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-[#f8fafc]"
                  >
                    <span class="flex min-w-0 items-center gap-2.5">
                      <input
                        v-model="selectedExportGroupIds"
                        type="checkbox"
                        class="h-4 w-4 rounded border-[#d8dee8] text-[#FF6600] focus:ring-[#FF6600]"
                        :value="group.id"
                        :disabled="isImportingGeofences"
                      />

                      <span
                        class="h-2.5 w-2.5 shrink-0 rounded-full"
                        :style="{ backgroundColor: group.color }"
                      ></span>

                      <span class="min-w-0">
                        <span class="block truncate text-[12px] font-black text-[#172033]">
                          {{ group.label }}
                        </span>

                        <span class="block truncate text-[10px] font-semibold text-slate-500">
                          {{ getGeofenceGroupRowDescription(group) }}
                        </span>
                      </span>
                    </span>

                    <span
                      class="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500"
                    >
                      {{ group.count }}
                    </span>
                  </label>
                </div>

                <div v-else class="px-3 py-4 text-center">
                  <p class="text-[11px] font-black text-[#102372]">Sin geocercas exportables</p>
                </div>
              </div>

              <p class="mt-2 text-[10px] font-bold text-slate-500">
                {{ selectedExportSummary }}
              </p>

              <button
                type="button"
                class="mt-3 h-10 w-full rounded-lg border border-[#d8dee8] bg-white px-3 text-[11px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600] disabled:cursor-not-allowed disabled:opacity-45"
                :disabled="!canExportSelectedGeofences"
                @click="handleExportGeofences"
              >
                Exportar seleccion
              </button>
            </section>

            <section v-else class="rounded-xl border border-[#d8dee8] bg-white p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[12px] font-black text-[#102372]">Importar</p>

                  <p class="mt-0.5 text-[10px] font-semibold text-slate-500">
                    CSV, XML, KML, KMZ o GeoJSON.
                  </p>
                </div>

                <button
                  v-if="canEditGeofences"
                  type="button"
                  class="h-9 rounded-lg bg-[#FF6600] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00] disabled:cursor-not-allowed disabled:bg-slate-300"
                  :disabled="isImportingGeofences"
                  @click="openImportFileDialog"
                >
                  {{ isImportingGeofences ? "Cargando..." : "Importar" }}
                </button>
              </div>

              <div
                v-if="showGeofenceImportProgress"
                class="mt-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-2"
              >
                <div class="flex items-center justify-between gap-3">
                  <span
                    class="truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#102372]"
                  >
                    {{ geofenceImportProgressLabel }}
                  </span>

                  <span class="text-[10px] font-black text-slate-500">
                    {{ geofenceImportProgress }}%
                  </span>
                </div>

                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="geofenceImportProgressBarClass"
                    :style="{ width: `${geofenceImportProgress}%` }"
                  ></div>
                </div>
              </div>
            </section>

            <p
              class="rounded-lg px-3 py-2 text-[10px] font-bold"
              :class="
                fileMessage
                  ? fileMessageTone === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                  : 'bg-white text-slate-500'
              "
            >
              {{ fileMessage || "Elige una accion para importar o exportar geocercas." }}
            </p>
          </div>
        </section>
      </div>

      <div
        v-if="showCreateGeofenceHelpModal"
        class="fixed inset-0 z-[920] flex items-end justify-center bg-slate-950/45 p-2 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-geofence-help-title"
        @click.self="showCreateGeofenceHelpModal = false"
      >
        <section
          class="w-full max-w-[420px] overflow-hidden rounded-t-xl border border-[#d8dee8] bg-white shadow-2xl sm:rounded-xl"
        >
          <header
            class="flex items-start justify-between gap-3 border-b border-[#e8ecf2] px-4 py-3"
          >
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-[#FF6600]">
                Nueva zona
              </p>

              <h3
                id="create-geofence-help-title"
                class="mt-0.5 text-[15px] font-black text-[#102372]"
              >
                Crear geocerca desde el mapa
              </h3>
            </div>

            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dee8] text-[14px] font-black text-slate-500 transition hover:border-[#FF6600] hover:text-[#FF6600]"
              aria-label="Cerrar"
              @click="showCreateGeofenceHelpModal = false"
            >
              x
            </button>
          </header>

          <div class="grid gap-3 bg-[#f8fafc] p-4">
            <p
              class="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[11px] font-bold leading-relaxed text-slate-600"
            >
              Usa el boton + del mapa, elige circular, ruta o poligono y luego asigna el grupo desde
              el formulario de geocerca.
            </p>

            <button
              type="button"
              class="h-10 rounded-lg bg-[#102372] px-4 text-[11px] font-black text-white transition hover:bg-[#0c1b59]"
              @click="showCreateGeofenceHelpModal = false"
            >
              Entendido
            </button>
          </div>
        </section>
      </div>

      <div
        v-if="!geofences.length"
        class="flex min-h-[220px] flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102372]/[0.07] text-[#102372]"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M12 21s7-4.6 7-11.25A7 7 0 0 0 5 9.75C5 16.4 12 21 12 21Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <circle cx="12" cy="9.75" r="2.5" stroke="currentColor" stroke-width="1.7" />
          </svg>
        </div>

        <p class="mt-3 text-[12px] font-black text-[#102372]">No hay geocercas</p>

        <p class="mt-1 max-w-[250px] text-[10px] font-semibold leading-relaxed text-slate-500">
          Crea una zona o ruta desde las herramientas del mapa.
        </p>
      </div>

      <div
        v-else-if="!visibleFilteredGeofences.length"
        class="flex min-h-[220px] flex-1 flex-col items-center justify-center px-6 py-10 text-center"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="1.7" />

            <path d="m15 15 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </div>

        <p class="mt-3 text-[12px] font-black text-[#102372]">Sin resultados</p>

        <p class="mt-1 max-w-[250px] text-[10px] font-semibold leading-relaxed text-slate-500">
          No encontramos geocercas con ese criterio de busqueda.
        </p>
      </div>

      <div v-else class="min-h-0 flex-1 overflow-hidden bg-[#f6f8fb] p-3">
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-[0_8px_22px_rgba(15,35,114,0.04)]"
        >
          <header
            class="flex shrink-0 flex-col gap-3 border-b border-[#e8ecf2] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="text-[13px] font-black text-[#102372]">Listado de geocercas</h4>

                <span
                  class="rounded-full bg-[#102372]/10 px-2 py-0.5 text-[9px] font-black text-[#102372]"
                >
                  {{ visibleFilteredGeofences.length }}
                </span>
              </div>

              <p class="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                Grupo activo: {{ activeGeofenceGroupLabel }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <label
                class="flex h-9 items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372]"
              >
                <span class="text-slate-500">Grupo:</span>

                <select
                  v-model="selectedGeofenceGroup"
                  class="h-full max-w-[150px] bg-transparent text-[10px] font-black text-[#102372] outline-none"
                >
                  <option :value="ALL_GEOFENCE_GROUPS">Todos</option>

                  <option v-for="group in visibleGeofenceGroups" :key="group.id" :value="group.id">
                    {{ group.label }} ({{ group.count }})
                  </option>
                </select>
              </label>

              <label
                class="flex h-9 items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372]"
              >
                <span class="text-slate-500">Ordenar por:</span>

                <select
                  v-model="selectedGeofenceSort"
                  class="h-full bg-transparent text-[10px] font-black text-[#102372] outline-none"
                >
                  <option
                    v-for="sortOption in geofenceSortOptions"
                    :key="sortOption.id"
                    :value="sortOption.id"
                  >
                    {{ sortOption.label }}
                  </option>
                </select>
              </label>

              <button
                type="button"
                class="h-9 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @click="toggleAllGeofenceGroups"
              >
                {{ areAllGeofenceGroupsExpanded ? "Contraer grupos" : "Expandir grupos" }}
              </button>

              <button
                v-if="canEditGeofences"
                type="button"
                class="h-9 rounded-lg border px-3 text-[10px] font-black transition"
                :class="
                  isGeofenceBulkSelectionMode
                    ? 'border-[#FF6600] bg-[#fff7ed] text-[#FF6600]'
                    : 'border-[#d8dee8] bg-white text-[#102372] hover:border-[#FF6600] hover:text-[#FF6600]'
                "
                @click="toggleGeofenceBulkSelectionMode"
              >
                {{ isGeofenceBulkSelectionMode ? "Cancelar selección" : "Eliminar varias" }}
              </button>
            </div>
          </header>

          <div
            v-if="canEditGeofences && isGeofenceBulkSelectionMode"
            class="flex shrink-0 flex-col gap-2 border-b border-[#e8ecf2] bg-[#fbfcff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <label
              class="flex cursor-pointer items-center gap-2 text-[10px] font-black text-[#102372]"
              :class="!visibleSelectableGeofences.length ? 'cursor-not-allowed opacity-50' : ''"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-[#cbd5e1] accent-[#FF6600]"
                :checked="areAllVisibleGeofencesSelected"
                :disabled="!visibleSelectableGeofences.length"
                @change="toggleVisibleGeofenceSelection"
              />

              <span>
                {{
                  areAllVisibleGeofencesSelected
                    ? "Quitar visibles"
                    : `Seleccionar visibles (${visibleSelectableGeofences.length})`
                }}
              </span>
            </label>

            <div
              v-if="selectedGeofenceCount"
              class="flex flex-wrap items-center gap-2 text-[10px] font-black"
            >
              <span class="rounded-full bg-[#102372]/10 px-2 py-1 text-[#102372]">
                {{ selectedGeofenceCount }} seleccionadas
              </span>

              <button
                type="button"
                class="h-8 rounded-lg border border-red-200 bg-red-50 px-3 text-[10px] font-black text-red-600 transition hover:border-red-300 hover:bg-red-100"
                @click="deleteSelectedGeofences"
              >
                Eliminar seleccionadas
              </button>

              <button
                type="button"
                class="h-8 rounded-lg border border-[#d8dee8] bg-white px-3 text-[10px] font-black text-[#102372] transition hover:border-[#FF6600] hover:text-[#FF6600]"
                @click="clearSelectedGeofences"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-auto p-3">
            <div class="overflow-hidden rounded-xl border border-[#e8ecf2]">
              <section v-for="group in groupedFilteredGeofences" :key="group.id">
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 border-b border-[#e8ecf2] bg-[#f8fafc] px-4 py-3 text-left transition hover:bg-[#eef3ff]"
                  @click="toggleGeofenceGroup(group.id)"
                >
                  <span class="flex min-w-0 items-center gap-2">
                    <span
                      class="h-2.5 w-2.5 shrink-0 rounded-full"
                      :style="{ backgroundColor: group.color }"
                    ></span>

                    <span class="truncate text-[11px] font-black text-[#102372]">
                      {{ group.label }}
                    </span>

                    <span
                      class="rounded-full bg-[#102372]/10 px-2 py-0.5 text-[9px] font-black text-[#102372]"
                    >
                      {{ group.geofences.length }}
                    </span>
                  </span>

                  <svg
                    viewBox="0 0 24 24"
                    class="h-3.5 w-3.5 shrink-0 text-slate-400 transition"
                    :class="isGeofenceGroupCollapsed(group.id) ? '-rotate-90' : ''"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>

                <div v-if="!isGeofenceGroupCollapsed(group.id)" class="divide-y divide-[#e8ecf2]">
                  <article
                    v-for="(geofence, index) in group.geofences"
                    :key="getGeofenceRenderKey(geofence, index)"
                    class="group relative transition"
                    :class="
                      normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
                        ? 'bg-[#fff8f3]'
                        : isGeofenceBulkSelectionMode && isGeofenceSelectedForBulkDelete(geofence)
                          ? 'bg-[#eef3ff]'
                          : 'bg-white hover:bg-[#f8fafc]'
                    "
                  >
                    <span
                      class="absolute inset-y-0 left-0 w-[3px]"
                      :class="
                        normalizeId(selectedGeofenceId) === normalizeId(geofence.id)
                          ? 'bg-[#FF6600]'
                          : 'bg-transparent'
                      "
                    ></span>

                    <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                      <div class="flex min-w-0 flex-1 items-center gap-3">
                        <label
                          v-if="canEditGeofences && isGeofenceBulkSelectionMode"
                          class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d8dee8] bg-white transition hover:border-[#FF6600]"
                          title="Seleccionar geocerca"
                          :aria-label="`Seleccionar ${geofence.name}`"
                          @click.stop
                        >
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-[#cbd5e1] accent-[#FF6600]"
                            :checked="isGeofenceSelectedForBulkDelete(geofence)"
                            @change="toggleGeofenceSelection(geofence)"
                          />
                        </label>

                        <button
                          type="button"
                          class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                          @click="emit('select-geofence', geofence)"
                        >
                          <span
                            class="h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-100"
                            :style="{ backgroundColor: getGeofenceColor(geofence) }"
                          ></span>

                          <span class="min-w-0">
                            <span class="block truncate text-[12px] font-black text-[#172033]">
                              {{ geofence.name }}
                            </span>

                            <span
                              class="mt-1 block truncate text-[10px] font-semibold text-slate-500"
                            >
                              {{ getGeofenceDescription(geofence) }}
                            </span>
                          </span>
                        </button>
                      </div>

                      <div
                        class="flex items-center justify-between gap-2 sm:shrink-0 sm:justify-end"
                      >
                        <span
                          class="shrink-0 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-wide"
                          :class="getGeofenceBadgeClass(geofence)"
                        >
                          {{ getGeofenceBadgeLabel(geofence) }}
                        </span>

                        <span
                          class="hidden max-w-[130px] truncate text-[9px] font-bold text-slate-400 lg:block"
                        >
                          {{ getGeofenceMeta(geofence) }}
                        </span>

                        <div v-if="canEditGeofences" class="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            class="h-8 rounded-lg px-2.5 text-[10px] font-black text-[#102372] transition hover:bg-[#102372]/10"
                            title="Editar geocerca"
                            aria-label="Editar geocerca"
                            @click.stop="emit('edit-geofence', geofence)"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Eliminar geocerca"
                            aria-label="Eliminar geocerca"
                            @click.stop="emit('delete-geofence', geofence)"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              class="h-3.5 w-3.5"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M5 7h14M9 7V4.75h6V7M8.5 10.5v6M12 10.5v6M15.5 10.5v6M6.5 7l.75 13h9.5l.75-13"
                                stroke="currentColor"
                                stroke-width="1.7"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>

          <footer
            class="flex shrink-0 items-center justify-between border-t border-[#e8ecf2] bg-white px-4 py-3 text-[10px] font-bold text-slate-500"
          >
            <span>
              Mostrando 1-{{ visibleFilteredGeofences.length }} de
              {{ visibleFilteredGeofences.length }}
            </span>

            <span>{{ activeGeofenceGroupLabel }}</span>
          </footer>
        </section>
      </div>
    </section>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue"

import {
  buildGeofenceExportFileAsync,
  GEOFENCE_FILE_FORMAT_OPTIONS,
  getGeofenceFileFormat,
  parseGeofenceImportFileAsync,
} from "../../../utils/geofenceImportExportUtils.js"
import {
  getGeofenceBadgeClass,
  getGeofenceBadgeLabel,
  getGeofenceColor,
  getGeofenceDescription,
  getGeofenceMeta,
} from "../../../utils/geofenceUtils.js"
import { normalizeId } from "../../../utils/idUtils.js"

const props = defineProps({
  geofences: {
    type: Array,
    default: () => [],
  },
  geofenceGroups: {
    type: Array,
    default: () => [],
  },
  filteredGeofences: {
    type: Array,
    default: () => [],
  },
  search: {
    type: String,
    default: "",
  },
  selectedGeofenceId: {
    type: [String, Number],
    default: null,
  },
  canEditGeofences: {
    type: Boolean,
    default: false,
  },
  useGeofenceLocationAddress: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  "select-geofence",
  "edit-geofence",
  "delete-geofence",
  "delete-geofences",
  "export-geofences",
  "import-geofences",
  "create-geofence-group",
  "delete-geofence-group",
  "rename-geofence-group",
  "update:search",
  "update:use-geofence-location-address",
])

const ALL_GEOFENCE_GROUPS = "__all_geofence_groups__"
const UNGROUPED_GEOFENCE_GROUP = "__ungrouped_geofences__"
const GEOFENCE_FILE_MODULE_EXPORT = "export"
const GEOFENCE_FILE_MODULE_IMPORT = "import"

const selectedFileFormat = ref("kml")
const activeGeofenceFileModule = ref(GEOFENCE_FILE_MODULE_EXPORT)
const importFileInputRef = ref(null)
const fileMessage = ref("")
const fileMessageTone = ref("success")
const isImportingGeofences = ref(false)
const geofenceImportProgress = ref(0)
const geofenceImportProgressLabel = ref("")
const geofenceImportProgressTone = ref("idle")
const selectedGeofenceGroup = ref(ALL_GEOFENCE_GROUPS)
const selectedExportGroupIds = ref([])
const collapsedGeofenceGroupIds = ref(new Set())
const newGeofenceGroupName = ref("")
const editingGeofenceGroupId = ref("")
const editingGeofenceGroupName = ref("")
const showGeofenceGroupsModal = ref(false)
const showGeofenceFileModal = ref(false)
const showCreateGeofenceHelpModal = ref(false)
const selectedGeofenceSort = ref("name")
const isGeofenceBulkSelectionMode = ref(false)
const selectedGeofenceIds = ref([])

const geofenceSortOptions = [
  {
    id: "name",
    label: "Nombre",
  },
  {
    id: "group",
    label: "Grupo",
  },
  {
    id: "type",
    label: "Tipo",
  },
]

const getGeofenceGroupName = (geofence = {}) => {
  if (typeof geofence === "string") return geofence.trim()

  return String(
    geofence?.groupName || geofence?.group || geofence?.grupo || geofence?.groupLabel || "",
  ).trim()
}

const getGeofenceGroupId = (geofence = {}) => {
  return getGeofenceGroupName(geofence) || UNGROUPED_GEOFENCE_GROUP
}

const getGeofenceGroupLabel = (groupId) => {
  return groupId === UNGROUPED_GEOFENCE_GROUP ? "Sin grupo" : groupId
}

const getGeofenceGroupNameKey = (groupName) => {
  return getGeofenceGroupName(groupName).toLocaleLowerCase("es")
}

const geofenceGroupsFromGeofences = computed(() => {
  const groupsById = new Map()

  props.geofences.forEach((geofence) => {
    const groupId = getGeofenceGroupId(geofence)
    const currentGroup = groupsById.get(groupId) || {
      id: groupId,
      name: groupId === UNGROUPED_GEOFENCE_GROUP ? "" : groupId,
      label: getGeofenceGroupLabel(groupId),
      count: 0,
      color: getGeofenceColor(geofence),
      isUngrouped: groupId === UNGROUPED_GEOFENCE_GROUP,
    }

    currentGroup.count += 1
    groupsById.set(groupId, currentGroup)
  })

  return Array.from(groupsById.values()).sort((firstGroup, secondGroup) => {
    if (firstGroup.id === UNGROUPED_GEOFENCE_GROUP) return 1
    if (secondGroup.id === UNGROUPED_GEOFENCE_GROUP) return -1

    return firstGroup.label.localeCompare(secondGroup.label, "es", {
      sensitivity: "base",
    })
  })
})

const visibleGeofenceGroups = computed(() => {
  const groupsByName = new Map()

  props.geofenceGroups.forEach((group) => {
    const name = getGeofenceGroupName(group?.name || group?.label || group)

    if (!name) return

    groupsByName.set(getGeofenceGroupNameKey(name), {
      id: name,
      storageId: group?.id || name,
      name,
      label: group?.label || name,
      count: Number(group?.count || 0),
      color: group?.color || "#102372",
      isUngrouped: false,
    })
  })

  geofenceGroupsFromGeofences.value.forEach((group) => {
    if (group.isUngrouped) {
      groupsByName.set(UNGROUPED_GEOFENCE_GROUP, group)
      return
    }

    const groupKey = getGeofenceGroupNameKey(group.name)
    const existingGroup = groupsByName.get(groupKey)

    groupsByName.set(groupKey, {
      ...group,
      ...existingGroup,
      count: group.count,
      color: group.color || existingGroup?.color || "#102372",
    })
  })

  return Array.from(groupsByName.values()).sort((firstGroup, secondGroup) => {
    if (firstGroup.isUngrouped) return 1
    if (secondGroup.isUngrouped) return -1

    return firstGroup.label.localeCompare(secondGroup.label, "es", {
      sensitivity: "base",
    })
  })
})

const exportableGeofenceGroups = computed(() => {
  return visibleGeofenceGroups.value.filter((group) => {
    return Number(group.count || 0) > 0
  })
})

const selectedExportGroupIdSet = computed(() => {
  return new Set(selectedExportGroupIds.value)
})

const selectedExportGeofences = computed(() => {
  if (!selectedExportGroupIds.value.length) return []

  return props.geofences.filter((geofence) => {
    return selectedExportGroupIdSet.value.has(getGeofenceGroupId(geofence))
  })
})

const selectedExportGroupCount = computed(() => {
  return exportableGeofenceGroups.value.filter((group) => {
    return selectedExportGroupIdSet.value.has(group.id)
  }).length
})

const areAllExportGroupsSelected = computed(() => {
  return (
    exportableGeofenceGroups.value.length > 0 &&
    selectedExportGroupCount.value === exportableGeofenceGroups.value.length
  )
})

const canExportSelectedGeofences = computed(() => {
  return !isImportingGeofences.value && selectedExportGeofences.value.length > 0
})

const selectedExportSummary = computed(() => {
  if (!exportableGeofenceGroups.value.length) {
    return "No hay geocercas disponibles para exportar."
  }

  if (!selectedExportGeofences.value.length) {
    return "Selecciona uno o mas grupos para exportar."
  }

  const groupLabel =
    selectedExportGroupCount.value === 1 ? "1 grupo" : `${selectedExportGroupCount.value} grupos`
  const geofenceLabel =
    selectedExportGeofences.value.length === 1
      ? "1 geocerca"
      : `${selectedExportGeofences.value.length} geocercas`

  return `Se exportaran ${geofenceLabel} de ${groupLabel}.`
})

const activeGeofenceGroupLabel = computed(() => {
  if (selectedGeofenceGroup.value === ALL_GEOFENCE_GROUPS) return "Todos los grupos"

  const activeGroup = visibleGeofenceGroups.value.find((group) => {
    return group.id === selectedGeofenceGroup.value
  })

  return activeGroup?.label || getGeofenceGroupLabel(selectedGeofenceGroup.value)
})

const newGeofenceGroupNameKey = computed(() => {
  return getGeofenceGroupNameKey(newGeofenceGroupName.value)
})

const hasDuplicateGeofenceGroupName = computed(() => {
  if (!newGeofenceGroupNameKey.value) return false

  return visibleGeofenceGroups.value.some((group) => {
    return (
      !group.isUngrouped && getGeofenceGroupNameKey(group.name) === newGeofenceGroupNameKey.value
    )
  })
})

const geofenceGroupFormMessage = computed(() => {
  if (!newGeofenceGroupNameKey.value) {
    return ""
  }

  if (hasDuplicateGeofenceGroupName.value) {
    return "Ya existe un grupo con ese nombre."
  }

  return ""
})

const geofenceGroupFormMessageClass = computed(() => {
  if (hasDuplicateGeofenceGroupName.value) return "text-red-600"

  return "text-slate-500"
})

const canCreateGeofenceGroup = computed(() => {
  if (!props.canEditGeofences) return false

  return Boolean(newGeofenceGroupNameKey.value) && !hasDuplicateGeofenceGroupName.value
})

const showGeofenceImportProgress = computed(() => {
  return isImportingGeofences.value || geofenceImportProgress.value > 0
})

const geofenceImportProgressBarClass = computed(() => {
  if (geofenceImportProgressTone.value === "error") return "bg-red-500"
  if (geofenceImportProgressTone.value === "success") return "bg-emerald-500"

  return "bg-[#FF6600]"
})

const getGeofenceGroupRowDescription = (group = {}) => {
  if (group.isUngrouped) return "Geocercas sin clasificar"

  const count = Number(group.count || 0)

  return count === 1 ? "1 geocerca asociada" : `${count} geocercas asociadas`
}

const editingGeofenceGroup = computed(() => {
  if (!editingGeofenceGroupId.value) return null

  return (
    visibleGeofenceGroups.value.find((group) => {
      return group.id === editingGeofenceGroupId.value
    }) || null
  )
})

const editingGeofenceGroupNameKey = computed(() => {
  return getGeofenceGroupNameKey(editingGeofenceGroupName.value)
})

const hasDuplicateEditingGeofenceGroupName = computed(() => {
  if (!editingGeofenceGroupNameKey.value) return false

  return visibleGeofenceGroups.value.some((group) => {
    return (
      !group.isUngrouped &&
      group.id !== editingGeofenceGroupId.value &&
      getGeofenceGroupNameKey(group.name) === editingGeofenceGroupNameKey.value
    )
  })
})

const canSaveGeofenceGroupRename = computed(() => {
  if (!props.canEditGeofences || !editingGeofenceGroup.value) return false
  if (!editingGeofenceGroupNameKey.value || hasDuplicateEditingGeofenceGroupName.value) {
    return false
  }

  return (
    editingGeofenceGroupNameKey.value !== getGeofenceGroupNameKey(editingGeofenceGroup.value.name)
  )
})

const geofenceGroupRenameMessage = computed(() => {
  if (!editingGeofenceGroupNameKey.value) return ""
  if (hasDuplicateEditingGeofenceGroupName.value) return "Ya existe un grupo con ese nombre."

  return ""
})

const visibleFilteredGeofences = computed(() => {
  if (selectedGeofenceGroup.value === ALL_GEOFENCE_GROUPS) {
    return props.filteredGeofences
  }

  return props.filteredGeofences.filter((geofence) => {
    return getGeofenceGroupId(geofence) === selectedGeofenceGroup.value
  })
})

const visibleSelectableGeofences = computed(() => {
  return visibleFilteredGeofences.value.filter((geofence) => {
    return Boolean(normalizeId(geofence?.id))
  })
})

const selectedGeofenceIdSet = computed(() => {
  return new Set(
    selectedGeofenceIds.value.map((geofenceId) => normalizeId(geofenceId)).filter(Boolean),
  )
})

const selectedGeofences = computed(() => {
  return props.geofences.filter((geofence) => {
    return selectedGeofenceIdSet.value.has(normalizeId(geofence?.id))
  })
})

const selectedGeofenceCount = computed(() => {
  return selectedGeofences.value.length
})

const visibleSelectedGeofenceCount = computed(() => {
  return visibleSelectableGeofences.value.filter((geofence) => {
    return selectedGeofenceIdSet.value.has(normalizeId(geofence?.id))
  }).length
})

const areAllVisibleGeofencesSelected = computed(() => {
  return (
    visibleSelectableGeofences.value.length > 0 &&
    visibleSelectedGeofenceCount.value === visibleSelectableGeofences.value.length
  )
})

const sortedVisibleFilteredGeofences = computed(() => {
  return [...visibleFilteredGeofences.value].sort((firstGeofence, secondGeofence) => {
    const sortKey = selectedGeofenceSort.value
    const firstValue = getGeofenceSortValue(firstGeofence, sortKey)
    const secondValue = getGeofenceSortValue(secondGeofence, sortKey)

    return firstValue.localeCompare(secondValue, "es", {
      sensitivity: "base",
      numeric: true,
    })
  })
})

const groupedFilteredGeofences = computed(() => {
  const groupsById = new Map()

  sortedVisibleFilteredGeofences.value.forEach((geofence) => {
    const groupId = getGeofenceGroupId(geofence)
    const currentGroup = groupsById.get(groupId) || {
      id: groupId,
      label: getGeofenceGroupLabel(groupId),
      color: getGeofenceColor(geofence),
      geofences: [],
    }

    currentGroup.geofences.push(geofence)
    groupsById.set(groupId, currentGroup)
  })

  return Array.from(groupsById.values()).sort((firstGroup, secondGroup) => {
    if (firstGroup.id === UNGROUPED_GEOFENCE_GROUP) return 1
    if (secondGroup.id === UNGROUPED_GEOFENCE_GROUP) return -1

    return firstGroup.label.localeCompare(secondGroup.label, "es", {
      sensitivity: "base",
    })
  })
})

const areAllGeofenceGroupsExpanded = computed(() => {
  return groupedFilteredGeofences.value.every((group) => {
    return !collapsedGeofenceGroupIds.value.has(group.id)
  })
})

const getGeofenceSortValue = (geofence, sortKey) => {
  if (sortKey === "group") {
    return getGeofenceGroupLabel(getGeofenceGroupId(geofence))
  }

  if (sortKey === "type") {
    return getGeofenceBadgeLabel(geofence)
  }

  return String(geofence?.name || "")
}

const isGeofenceSelectedForBulkDelete = (geofence) => {
  return selectedGeofenceIdSet.value.has(normalizeId(geofence?.id))
}

const toggleGeofenceSelection = (geofence) => {
  const geofenceId = normalizeId(geofence?.id)

  if (!geofenceId) return

  if (selectedGeofenceIdSet.value.has(geofenceId)) {
    selectedGeofenceIds.value = selectedGeofenceIds.value.filter((selectedId) => {
      return normalizeId(selectedId) !== geofenceId
    })
    return
  }

  selectedGeofenceIds.value = [...selectedGeofenceIds.value, geofenceId]
}

const toggleVisibleGeofenceSelection = () => {
  const visibleIds = visibleSelectableGeofences.value.map((geofence) => normalizeId(geofence.id))

  if (!visibleIds.length) return

  if (areAllVisibleGeofencesSelected.value) {
    const visibleIdSet = new Set(visibleIds)

    selectedGeofenceIds.value = selectedGeofenceIds.value.filter((geofenceId) => {
      return !visibleIdSet.has(normalizeId(geofenceId))
    })
    return
  }

  const nextIds = new Set(selectedGeofenceIds.value.map((geofenceId) => normalizeId(geofenceId)))

  visibleIds.forEach((geofenceId) => {
    nextIds.add(geofenceId)
  })

  selectedGeofenceIds.value = Array.from(nextIds)
}

const clearSelectedGeofences = () => {
  selectedGeofenceIds.value = []
}

const toggleGeofenceBulkSelectionMode = () => {
  isGeofenceBulkSelectionMode.value = !isGeofenceBulkSelectionMode.value

  if (!isGeofenceBulkSelectionMode.value) {
    clearSelectedGeofences()
  }
}

const deleteSelectedGeofences = () => {
  if (!selectedGeofenceCount.value) return

  emit("delete-geofences", selectedGeofences.value)
}

const isGeofenceGroupCollapsed = (groupId) => {
  return collapsedGeofenceGroupIds.value.has(groupId)
}

const toggleGeofenceGroup = (groupId) => {
  const nextCollapsedGroupIds = new Set(collapsedGeofenceGroupIds.value)

  if (nextCollapsedGroupIds.has(groupId)) {
    nextCollapsedGroupIds.delete(groupId)
  } else {
    nextCollapsedGroupIds.add(groupId)
  }

  collapsedGeofenceGroupIds.value = nextCollapsedGroupIds
}

const toggleAllGeofenceGroups = () => {
  if (areAllGeofenceGroupsExpanded.value) {
    collapsedGeofenceGroupIds.value = new Set(
      groupedFilteredGeofences.value.map((group) => {
        return group.id
      }),
    )
    return
  }

  collapsedGeofenceGroupIds.value = new Set()
}

const isEditingGeofenceGroup = (group = {}) => {
  return group.id === editingGeofenceGroupId.value
}

const startRenameGeofenceGroup = (group = {}) => {
  if (!props.canEditGeofences || group.isUngrouped) return

  editingGeofenceGroupId.value = group.id
  editingGeofenceGroupName.value = group.name || group.label || ""
}

const cancelRenameGeofenceGroup = () => {
  editingGeofenceGroupId.value = ""
  editingGeofenceGroupName.value = ""
}

const handleCreateGeofenceGroup = () => {
  if (!canCreateGeofenceGroup.value) return

  const groupName = getGeofenceGroupName(newGeofenceGroupName.value)

  emit("create-geofence-group", groupName)
  newGeofenceGroupName.value = ""
}

const handleRenameGeofenceGroup = () => {
  if (!canSaveGeofenceGroupRename.value || !editingGeofenceGroup.value) return

  emit("rename-geofence-group", {
    groupIdOrName:
      editingGeofenceGroup.value.storageId ||
      editingGeofenceGroup.value.id ||
      editingGeofenceGroup.value.name,
    name: getGeofenceGroupName(editingGeofenceGroupName.value),
  })

  cancelRenameGeofenceGroup()
}

const handleDeleteGeofenceGroup = (group) => {
  if (!props.canEditGeofences || !group || group.isUngrouped) return

  const confirmed = window.confirm(
    `Eliminar el grupo "${group.label}"? Las geocercas quedaran sin grupo.`,
  )

  if (!confirmed) return

  emit("delete-geofence-group", group.storageId || group.id || group.name)
}

watch(
  visibleGeofenceGroups,
  (groups) => {
    if (selectedGeofenceGroup.value === ALL_GEOFENCE_GROUPS) return

    const selectedGroupExists = groups.some((group) => {
      return group.id === selectedGeofenceGroup.value
    })

    if (!selectedGroupExists) {
      selectedGeofenceGroup.value = ALL_GEOFENCE_GROUPS
    }
  },
  {
    immediate: true,
  },
)

watch(
  () =>
    props.geofences.map((geofence) => {
      return normalizeId(geofence?.id)
    }),
  (geofenceIds) => {
    const validGeofenceIds = new Set(geofenceIds.filter(Boolean))

    selectedGeofenceIds.value = selectedGeofenceIds.value.filter((geofenceId) => {
      return validGeofenceIds.has(normalizeId(geofenceId))
    })
  },
  {
    immediate: true,
  },
)

watch(exportableGeofenceGroups, (groups) => {
  const validGroupIds = new Set(
    groups.map((group) => {
      return group.id
    }),
  )

  selectedExportGroupIds.value = selectedExportGroupIds.value.filter((groupId) => {
    return validGroupIds.has(groupId)
  })
})

const getAllExportGroupIds = () => {
  return exportableGeofenceGroups.value.map((group) => {
    return group.id
  })
}

const getDefaultExportGroupIds = () => {
  if (
    selectedGeofenceGroup.value !== ALL_GEOFENCE_GROUPS &&
    exportableGeofenceGroups.value.some((group) => {
      return group.id === selectedGeofenceGroup.value
    })
  ) {
    return [selectedGeofenceGroup.value]
  }

  return getAllExportGroupIds()
}

const selectAllExportGroups = () => {
  selectedExportGroupIds.value = getAllExportGroupIds()
}

const clearExportGroups = () => {
  selectedExportGroupIds.value = []
}

const clearFileMessage = () => {
  fileMessage.value = ""
  fileMessageTone.value = "success"
  isImportingGeofences.value = false
  geofenceImportProgress.value = 0
  geofenceImportProgressLabel.value = ""
  geofenceImportProgressTone.value = "idle"
}

const setFileMessage = (message, tone = "success") => {
  fileMessage.value = message
  fileMessageTone.value = tone
}

const setGeofenceImportProgress = (progress, label, tone = "loading") => {
  const progressValue = Number(progress)

  geofenceImportProgress.value = Math.min(
    100,
    Math.max(0, Number.isFinite(progressValue) ? Math.round(progressValue) : 0),
  )
  geofenceImportProgressLabel.value = label
  geofenceImportProgressTone.value = tone
}

const finishGeofenceImportFeedback = (message, tone = "success") => {
  isImportingGeofences.value = false
  setGeofenceImportProgress(100, tone === "error" ? "Carga detenida" : "Carga completa", tone)
  setFileMessage(message, tone)
}

const setActiveGeofenceFileModule = (module) => {
  if (isImportingGeofences.value) return

  activeGeofenceFileModule.value =
    module === GEOFENCE_FILE_MODULE_IMPORT
      ? GEOFENCE_FILE_MODULE_IMPORT
      : GEOFENCE_FILE_MODULE_EXPORT
}

const openGeofenceFileModal = () => {
  clearFileMessage()
  activeGeofenceFileModule.value = exportableGeofenceGroups.value.length
    ? GEOFENCE_FILE_MODULE_EXPORT
    : GEOFENCE_FILE_MODULE_IMPORT
  selectedExportGroupIds.value = getDefaultExportGroupIds()
  showGeofenceFileModal.value = true
}

const downloadGeofenceFile = ({ content, fileName, mimeType }) => {
  if (typeof window === "undefined" || typeof document === "undefined") return

  const blob = new Blob([content], {
    type: mimeType,
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  link.click()

  window.URL.revokeObjectURL(url)
}

const handleExportGeofences = async () => {
  if (!canExportSelectedGeofences.value) return

  clearFileMessage()

  try {
    const exportGeofences = selectedExportGeofences.value
    const exportFile = await buildGeofenceExportFileAsync({
      geofences: exportGeofences,
      format: selectedFileFormat.value,
    })

    downloadGeofenceFile(exportFile)
    setFileMessage(
      `Exportadas ${exportGeofences.length} geocercas de ${selectedExportGroupCount.value} grupos en ${exportFile.extension.toUpperCase()}.`,
    )
    emit("export-geofences", {
      count: exportGeofences.length,
      format: exportFile.extension,
    })
  } catch {
    setFileMessage("No se pudo exportar el archivo de geocercas.", "error")
  }
}

const openImportFileDialog = () => {
  if (isImportingGeofences.value) return

  clearFileMessage()
  activeGeofenceFileModule.value = GEOFENCE_FILE_MODULE_IMPORT
  importFileInputRef.value?.click()
}

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(String(reader.result || ""))
    }

    reader.onerror = () => {
      reject(reader.error)
    }

    reader.readAsText(file)
  })
}

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(reader.error)
    }

    reader.readAsArrayBuffer(file)
  })
}

const handleImportFileChange = async (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  clearFileMessage()
  isImportingGeofences.value = true
  setFileMessage(`Leyendo ${file.name}...`)
  setGeofenceImportProgress(12, "Preparando archivo")

  try {
    const format = getGeofenceFileFormat(file.name)
    const isKmzFile = format === "kmz"

    setGeofenceImportProgress(32, "Leyendo archivo")

    const content = isKmzFile ? "" : await readFileAsText(file)
    const arrayBuffer = isKmzFile ? await readFileAsArrayBuffer(file) : null

    setFileMessage("Validando geocercas...")
    setGeofenceImportProgress(58, "Validando datos")

    const importedGeofences = await parseGeofenceImportFileAsync({
      arrayBuffer,
      content,
      fileName: file.name,
    })

    if (!importedGeofences.length) {
      finishGeofenceImportFeedback("El archivo no contiene geocercas validas.", "error")
      return
    }

    setFileMessage(`Cargando ${importedGeofences.length} geocercas...`)
    setGeofenceImportProgress(82, "Guardando geocercas")

    emit("import-geofences", {
      fileName: file.name,
      format,
      geofences: importedGeofences,
      onResult: ({ importedCount = 0, parsedCount = importedGeofences.length } = {}) => {
        if (!importedCount) {
          finishGeofenceImportFeedback(
            `El archivo contiene ${parsedCount} registros, pero ninguno tiene geometria valida para guardar.`,
            "error",
          )
          return
        }

        const skippedCount = Math.max(0, parsedCount - importedCount)

        finishGeofenceImportFeedback(
          skippedCount
            ? `Cargadas ${importedCount} geocercas. ${skippedCount} registros fueron descartados.`
            : `Cargadas ${importedCount} geocercas correctamente.`,
        )
      },
    })
  } catch {
    finishGeofenceImportFeedback("No se pudo leer el archivo de geocercas.", "error")
  } finally {
    event.target.value = ""
  }
}

const getGeofenceRenderKey = (geofence, index) => {
  const coordinatesKey = Array.isArray(geofence?.coordinates)
    ? geofence.coordinates
        .map((point) => {
          return `${point?.lat ?? ""},${point?.lng ?? ""}`
        })
        .join("|")
    : `${geofence?.center?.lat ?? ""},${geofence?.center?.lng ?? ""},${geofence?.radius ?? ""}`

  return [
    normalizeId(geofence?.id) || "geofence",
    geofence?.companyId || "",
    geofence?.type || "",
    coordinatesKey,
    index,
  ].join("::")
}
</script>
