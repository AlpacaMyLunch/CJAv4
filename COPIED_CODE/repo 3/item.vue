<template>
    <v-container>
        <div v-if="items!=null">
            <div v-if="items.length === 1">
                <SetupcomparisonValue :value="items[0].text" :class="items[0].className">
                </SetupcomparisonValue>
            </div>
            <div v-else-if="items.length === 2">
                <v-row>
                    <v-col>
                        <SetupcomparisonValue :value="items[0].text" :class="items[0].className">
                        </SetupcomparisonValue>
                    </v-col>
                    <v-col>
                        <SetupcomparisonValue :value="items[1].text" :class="items[1].className">
                        </SetupcomparisonValue>
                    </v-col>
                </v-row>

            </div>
            <div v-else-if="items.length === 4">
                <v-row>
                    <v-col>
                        FL <SetupcomparisonValue :value="items[0].text" :class="items[0].className">
                        </SetupcomparisonValue>
                    </v-col>
                    <v-col>
                        FR <SetupcomparisonValue :value="items[1].text" :class="items[1].className">
                        </SetupcomparisonValue>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        RL <SetupcomparisonValue :value="items[2].text" :class="items[2].className">
                        </SetupcomparisonValue>
                    </v-col>
                    <v-col>
                        RR <SetupcomparisonValue :value="items[3].text" :class="items[3].className">
                        </SetupcomparisonValue>
                    </v-col>
                </v-row>
            </div>
            <div v-else>
                {{ items }}
            </div>
        </div>
    </v-container>
</template>
<script setup>

const props = defineProps(['items'])

</script>