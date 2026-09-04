<template>
  <header class="shrink-0 bg-[#f6f8fb]">
    <section class="px-4 pb-4 pt-5 sm:px-8">
      <div
        class="flex flex-col gap-4 border-b border-[#dfe5ed] pb-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex min-w-0 items-center gap-3.5">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9efff] text-[#102372]"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M8 10h2M14 10h2"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="min-w-0">
            <p class="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Empresas</p>

            <h1 class="mt-0.5 text-[24px] font-black leading-tight text-[#102372] sm:text-[27px]">
              Gestión de empresas
            </h1>

            <p class="mt-1 text-[11px] font-semibold text-slate-500">
              Administra y accede rápidamente a todas las empresas de la plataforma.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#e65c00]"
          @click="$emit('create-company')"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>

          Nueva empresa
        </button>
      </div>
    </section>
  </header>
</template>

<script setup>
defineEmits(["create-company"])
</script>
