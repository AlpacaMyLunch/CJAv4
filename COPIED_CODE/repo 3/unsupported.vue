
import type { SetupcomparisonUnsupported } from '#build/components';
<template>
    <v-container>
        {{ car }} is not supported.
    </v-container>
</template>

<script setup>
const props = defineProps(['car'])
</script>