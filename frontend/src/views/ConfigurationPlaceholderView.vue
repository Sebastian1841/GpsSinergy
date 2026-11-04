<template>
  <section class="h-full min-h-0 p-6" :aria-label="title">
    <h1 class="text-xl font-bold text-[#102060]">{{ title }}</h1>
  </section>
</template>

<script setup>
defineProps({ title: { type: String, required: true } })
</script>
