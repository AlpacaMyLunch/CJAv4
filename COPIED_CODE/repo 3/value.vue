
<template>
    <v-container>
        <span :class="class">{{ value }}</span>
    </v-container>
</template>

<script setup>
const props = defineProps(['value', 'class'])
</script>

<style scoped>
.green {
    color: rgb(32, 216, 32);
}
.red {
    color: rgb(201, 127, 15);
}
</style>