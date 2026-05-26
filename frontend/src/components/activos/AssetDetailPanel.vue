<template>
  <aside
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8dee8] bg-white shadow-sm"
  >
    <template v-if="activo">
      <div class="shrink-0 border-b border-[#d8dee8] bg-[#102372] px-4 py-3 text-white">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#FF6600]">
              Activo seleccionado
            </p>

            <h2 class="mt-1 truncate text-[16px] font-black text-white">
              {{ activo.vehiculo }}
            </h2>

            <p class="mt-1 truncate text-[11px] font-semibold text-white/60">
              {{ activo.conductor || "Sin conductor" }}
            </p>
          </div>

          <button
            type="button"
            class="cursor-pointer text-lg leading-none text-white/40 transition hover:text-white"
            title="Cerrar detalle"
            @click="$emit('clear')"
          >
            ×
          </button>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <span
            class="rounded-full px-2 py-1 text-[10px] font-black"
            :class="statusPillClass(activo.estado)"
          >
            {{ statusLabel(activo.estado) }}
          </span>

          <span class="text-[10px] font-semibold text-white/45">
            Actualizado: {{ activo.datosUlt }}
          </span>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto bg-white">
        <section class="border-b border-[#edf0f5] px-4 py-3">
          <h3 class="text-[11px] font-black text-[#172033]">Estado del vehículo</h3>

          <div class="mt-3 space-y-3">
            <DetailRow label="Velocidad" :value="activo.velocidad || '-'" />
            <DetailRow label="Ignición" :value="activo.ignicion || '-'" />
            <DetailRow label="Último reporte" :value="activo.datosUlt || '-'" />
            <DetailRow
              label="Conductor / iButton"
              :value="activo.conductor || '-'"
              :subvalue="activo.ibutton"
            />
            <DetailRow label="Nivel combustible" :value="activo.combustible || '-'" />
            <DetailRow label="Odómetro" :value="activo.odometro || '-'" />
          </div>
        </section>

        <section class="border-b border-[#edf0f5] px-4 py-3">
          <div class="flex items-center justify-between">
            <h3 class="text-[11px] font-black text-[#172033]">Ruta actual</h3>

            <span
              class="rounded-full bg-[#fff3eb] px-2 py-0.5 text-[10px] font-black text-[#FF6600]"
            >
              62%
            </span>
          </div>

          <div class="mt-3 space-y-2">
            <div class="flex justify-between gap-3 text-[11px]">
              <span class="text-slate-500">Desde</span>
              <strong class="truncate text-[#172033]">Base operacional</strong>
            </div>

            <div class="flex justify-between gap-3 text-[11px]">
              <span class="text-slate-500">Hacia</span>
              <strong class="truncate text-[#172033]">Punto de servicio</strong>
            </div>
          </div>

          <div class="mt-3 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
            <div class="h-full w-[62%] rounded-full bg-[#FF6600]"></div>
          </div>

          <button
            type="button"
            class="mt-3 w-full cursor-pointer rounded-lg border border-[#d8dee8] bg-[#f8fafc] px-3 py-2 text-[11px] font-black text-[#102372] transition hover:border-[#102372] hover:bg-[#eef3ff]"
            @click="$emit('show-route')"
          >
            Ver ruta completa →
          </button>
        </section>

        <section class="px-4 py-3">
          <div class="flex items-center justify-between">
            <h3 class="text-[11px] font-black text-[#172033]">Alertas recientes</h3>

            <button
              type="button"
              class="cursor-pointer text-[10px] font-black text-[#102372] transition hover:text-[#FF6600]"
              @click="$emit('show-alerts')"
            >
              Ver todas
            </button>
          </div>

          <div class="mt-3 space-y-2">
            <AlertItem title="Exceso de velocidad" time="12:30 PM" color="bg-[#FF6600]" />
            <AlertItem title="Geocerca salida" time="11:58 AM" color="bg-amber-500" />
            <AlertItem title="Detención prolongada" time="11:20 AM" color="bg-red-500" />
          </div>
        </section>
      </div>
    </template>

    <div
      v-else
      class="flex h-full items-center justify-center p-6 text-center text-[12px] font-semibold text-slate-500"
    >
      Selecciona un activo para ver su detalle.
    </div>
  </aside>
</template>

<script setup>
import { defineComponent, h } from "vue"

defineProps({
  activo: {
    type: Object,
    default: null,
  },
})

defineEmits(["clear", "show-route", "show-alerts"])

const DetailRow = defineComponent({
  props: {
    label: String,
    value: String,
    subvalue: String,
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-start justify-between gap-3 text-[11px]" }, [
        h("span", { class: "text-slate-500" }, props.label),
        h("div", { class: "min-w-0 text-right" }, [
          h("strong", { class: "block truncate text-[#172033]" }, props.value),
          props.subvalue
            ? h(
                "span",
                {
                  class: "block truncate text-[10px] font-semibold text-[#102372]",
                },
                props.subvalue,
              )
            : null,
        ]),
      ])
  },
})

const AlertItem = defineComponent({
  props: {
    title: String,
    time: String,
    color: String,
  },
  setup(props) {
    return () =>
      h(
        "div",
        {
          class:
            "flex items-center gap-2 rounded-lg border border-[#edf0f5] bg-[#f8fafc] px-3 py-2",
        },
        [
          h("span", {
            class: `h-2.5 w-2.5 shrink-0 rounded-full ${props.color}`,
          }),
          h("div", { class: "min-w-0 flex-1" }, [
            h("p", { class: "truncate text-[11px] font-bold text-[#172033]" }, props.title),
            h("p", { class: "text-[10px] font-semibold text-slate-500" }, props.time),
          ]),
        ],
      )
  },
})

const statusLabel = (estado) => {
  const labels = {
    moving: "En ruta",
    idle: "Espera",
    stopped: "Detenido",
    offline: "Offline",
  }

  return labels[estado] || "Sin estado"
}

const statusPillClass = (estado) => {
  const classes = {
    moving: "bg-emerald-400/15 text-emerald-100",
    idle: "bg-sky-400/15 text-sky-100",
    stopped: "bg-red-400/15 text-red-100",
    offline: "bg-white/10 text-white/60",
  }

  return classes[estado] || "bg-white/10 text-white/60"
}
</script>
