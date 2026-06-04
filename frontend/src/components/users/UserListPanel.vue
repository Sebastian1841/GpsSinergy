<template>
  <aside class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white">
    <div class="border-b border-[#edf1f5] px-3 py-2">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-[13px] font-black text-[#102372]">Usuarios</h2>

        <span class="text-[10px] font-black text-slate-400">
          {{ totalUsersLabel }}
        </span>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-2">
      <button
        v-for="user in users"
        :key="user.id"
        type="button"
        class="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition last:mb-0"
        :class="
          selectedUserId === user.id
            ? 'border-[#ff6600] bg-[#fff7ed]'
            : 'border-[#edf1f5] bg-white hover:border-[#ff6600]/50 hover:bg-[#f8fafc]'
        "
        @click="$emit('select-user', user.id)"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
          :class="getAvatarClass(user.status)"
        >
          {{ getUserInitials(user.name) }}
        </span>

        <span class="min-w-0 flex-1">
          <span class="block truncate text-[12px] font-black text-[#172033]">
            {{ user.name }}
          </span>

          <span class="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
            @{{ user.username || "sin-usuario" }} · {{ user.email }}
          </span>

          <span class="mt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
            <span
              class="h-2 w-2 rounded-full"
              :class="user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'"
            ></span>

            {{ getStatusLabel(user.status) }} · {{ getUserAccesses(user).length }} empresa{{
              getUserAccesses(user).length === 1 ? "" : "s"
            }}
          </span>
        </span>
      </button>

      <div v-if="canShowMore" class="pt-1">
        <button
          type="button"
          class="h-10 w-full rounded-xl border border-[#d8dee8] bg-[#f8fafc] text-[11px] font-black text-[#102372] transition hover:border-[#ff6600]/50 hover:bg-[#fff7ed] hover:text-[#ff6600]"
          @click="$emit('show-more')"
        >
          Mostrar más usuarios · quedan {{ visibleUsersRemaining }}
        </button>
      </div>

      <div
        v-if="!users.length"
        class="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-center"
      >
        <p class="text-[12px] font-black text-[#102372]">Sin usuarios encontrados</p>

        <button
          type="button"
          class="mt-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[10px] font-black text-[#ff6600]"
          @click="$emit('clear-filters')"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue"

import {
  getAvatarClass,
  getStatusLabel,
  getUserInitials,
} from "../../utils/users/userAccessUtils.js"

const props = defineProps({
  users: {
    type: Array,
    default: () => [],
  },
  accesses: {
    type: Array,
    default: () => [],
  },
  selectedUserId: {
    type: String,
    default: null,
  },
  visibleUsersRemaining: {
    type: Number,
    default: 0,
  },
  canShowMore: {
    type: Boolean,
    default: false,
  },
})

defineEmits(["select-user", "clear-filters", "show-more"])

const totalUsersLabel = computed(() => {
  const total = props.users.length + props.visibleUsersRemaining

  if (!props.canShowMore) {
    return `${props.users.length} resultado${props.users.length === 1 ? "" : "s"}`
  }

  return `${props.users.length} de ${total} resultados`
})

const getUserAccesses = (user) => {
  return props.accesses.filter((access) => access.userId === user.id)
}
</script>
