<template>
  <div
    class="absolute left-6 right-6 top-0 z-30 h-3 touch-none cursor-ns-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'n')"
  ></div>

  <div
    class="absolute bottom-0 left-6 right-6 z-30 h-3 touch-none cursor-ns-resize"
    @pointerdown.stop="$emit('start-resize', $event, 's')"
  ></div>

  <div
    class="absolute bottom-6 left-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'w')"
  ></div>

  <div
    class="absolute bottom-6 right-0 top-6 z-30 w-3 touch-none cursor-ew-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'e')"
  ></div>

  <div
    class="absolute left-0 top-0 z-40 h-7 w-7 touch-none cursor-nwse-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'nw')"
  ></div>

  <div
    class="absolute right-0 top-0 z-40 h-7 w-7 touch-none cursor-nesw-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'ne')"
  ></div>

  <div
    class="absolute bottom-0 left-0 z-40 h-7 w-7 touch-none cursor-nesw-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'sw')"
  ></div>

  <div
    class="absolute bottom-0 right-0 z-40 h-7 w-7 touch-none cursor-nwse-resize"
    @pointerdown.stop="$emit('start-resize', $event, 'se')"
  >
    <div
      class="absolute bottom-2 right-2 h-3 w-3 rounded-sm border-b-2 border-r-2 border-slate-400"
    ></div>
  </div>
</template>

<script setup>
defineEmits(["start-resize"])
</script>
