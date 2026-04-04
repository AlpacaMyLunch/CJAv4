
<template>
    <v-container>
        <v-row align="start">

            <v-spacer></v-spacer>
            <v-col>
                <div>
                    <input type="file" accept=".json" @change="loadFile('left', $event)" hidden ref="leftFileInput">
                    <v-btn variant="outlined" color="primary" @click="triggerFileInput('left')">Load Baseline Setup</v-btn>
                    <div v-if="leftData">
                        <!-- Display some info about the left file or its contents here -->
                        <SetupcomparisonUnsupported v-if="leftData && !leftCar" :car="leftData.carName">
                        </SetupcomparisonUnsupported>
                        <span v-if="leftCar" class="carname">{{ leftCar.name }}</span>
                        <div v-if="leftCar">{{ leftFileName }}</div>
                    </div>
                </div>

            </v-col>
            <v-spacer></v-spacer>
            <v-col>
                <div>
                    <input type="file" accept=".json" @change="loadFile('right', $event)" hidden ref="rightFileInput">
                    <v-btn variant="outlined" color="primary" @click="triggerFileInput('right')">Load Compare Setup</v-btn>
                    <div v-if="rightData">
                        <!-- Display some info about the right file or its contents here -->
                        <SetupcomparisonUnsupported v-if="rightData && !rightCar" :car="rightData.carName">
                        </SetupcomparisonUnsupported>
                        <span v-if="rightCar" class="carname">{{ rightCar.name }}</span>
                        <div v-if="rightCar">{{ rightFileName }}</div>
                    </div>
                </div>


            </v-col>
            <v-spacer></v-spacer>
        </v-row>

        <div v-for="(values, category) in tempProcessed" class="category">

            <h3>{{ category }}</h3>
            <v-col>
                <v-row align="center" v-for="(items, key) in values" class="itemrow">
                    <v-col cols="2">
                        {{ key }}
                    </v-col>
                    <v-col cols="3" style="background-color: #4d4e50;">
                        <SetupcomparisonItem :items="leftProcessed[category][key]" v-if="leftData != null">
                        </SetupcomparisonItem>

                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col cols="3">
                        <SetupcomparisonItem :items="rightProcessed[category][key]" v-if="rightData != null">
                        </SetupcomparisonItem>
                    </v-col>
                    <v-col>
                        <span class="pre-wrap" v-if="leftData && rightData">{{ tips[category][key] }}</span>
                    </v-col>
                </v-row>
            </v-col>

        </div>
    </v-container>
</template>

<script setup>




const carData = {
    // GT3
    amr_v12_vantage_gt3: {
        name: 'AMR V12 Vantage GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.22 + 8.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185],
            [95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195]
        ],
        steeringRatioMin: 14,
        brakeBiasMin: 57,
        rideHeightMinFront: 55,
        rideHeightMinRear: 55
    },
    amr_v8_vantage_gt3: {
        name: 'AMR V8 Vantage GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.18 + 10.7,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [115, 125, 135, 145, 155, 165, 175, 185],
            [105, 115, 125, 135, 145, 155, 165, 175, 185, 195]
        ],
        steeringRatioMin: 14,
        brakeBiasMin: 57,
        rideHeightMinFront: 53,
        rideHeightMinRear: 53
    },
    audi_r8_lms: {
        name: 'Audi R8 LMS',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (16.8 - 8.8) / 34 + 8.8,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [112, 132, 153, 174, 185, 195],
            [124, 144, 163, 173, 183, 202]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    audi_r8_lms_evo: {
        name: 'Audi R8 LMS evo',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (16.8 - 8.8) / 34 + 8.8,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [112, 132, 153, 174, 185, 195],
            [124, 144, 163, 173, 183, 202]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    audi_r8_lms_evo_ii: {
        name: 'Audi R8 LMS evo II',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (16.8 - 8.8) / 34 + 8.8,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [112, 132, 153, 174, 185, 195],
            [124, 144, 163, 173, 183, 202]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    bentley_continental_gt3_2016: {
        name: 'Bentley Continental GT3 2016',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.24 + 8.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185],
            [95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 57,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    bentley_continental_gt3_2018: {
        name: 'Bentley Continental GT3 2018',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.24 + 8.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185],
            [95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 57,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    bmw_m4_gt3: {
        name: 'BMW M4 GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.195 + 6.1,
        toeMins: [-0.2, 0],
        wheelRates: [
            [105, 120, 135, 150, 165, 180],
            [90, 105, 120, 135, 150, 165]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 48.5,
        rideHeightMinFront: 50,
        rideHeightMinRear: 50
    },
    bmw_m6_gt3: {
        name: 'BMW M6 GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.2075 + 6.7,
        toeMins: [-0.2, 0],
        wheelRates: [
            [136, 146, 156, 166, 176, 186],
            [96, 106, 116, 126, 136, 146]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 47.5,
        rideHeightMinFront: 52,
        rideHeightMinRear: 52
    },
    ferrari_296_gt3: {
        name: 'Ferrari 296 GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (13.8 - 8.5) / 30 + 8.5,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [163.769, 170.068, 176.367, 182.666, 188.964, 195.263, 201.562, 207.861, 214.160],
            [122.091, 129.273, 136.455, 143.637, 150.818, 158.000, 165.182, 172.364, 179.546]
        ],
        steeringRatioMin: 13,
        brakeBiasMin: 50,
        rideHeightMinFront: 50,
        rideHeightMinRear: 50
    },
    ferrari_488_gt3: {
        name: 'Ferrari 488 GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (20.6 - 5.0) / 98 + 5.0,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [94, 101, 107, 113, 120, 126, 138.6, 151, 163.8, 176, 189],
            [106, 113, 120, 127, 134, 141, 155, 169.5, 183.6, 198, 212]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 47,
        rideHeightMinFront: 55,
        rideHeightMinRear: 55
    },
    ferrari_488_gt3_evo: {
        name: 'Ferrari 488 GT3 Evo',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (20.6 - 5.0) / 98 + 5.0,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [94, 101, 107, 113, 120, 126, 138.6, 151, 163.8, 176, 189],
            [106, 113, 120, 127, 134, 141, 155, 169.5, 183.6, 198, 212]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 47,
        rideHeightMinFront: 55,
        rideHeightMinRear: 55
    },
    honda_nsx_gt3: {
        name: 'Honda NSX GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (15.2 - 8.8) + 8.8,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [115, 124, 133, 142, 151, 160, 169, 178, 187, 196],
            [115, 124, 133, 142, 151, 160, 169, 178, 187, 196, 205]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    honda_nsx_gt3_evo: {
        name: 'Honda NSX GT3 Evo',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.19 + 7.2,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [73, 79.08, 85.16, 91.24, 97.32, 103.4, 109.48, 115.56, 121.64, 127.72, 133.8, 139.88, 145.96, 152.04, 158.12, 164.2, 170.28],
            [126.8, 134.7, 142.6, 150.5, 158.4, 166.3, 174.2, 182.1, 190, 197.9, 205.8, 213.7, 221.6, 229.5, 237.4, 245.3, 253.2]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 44,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    jaguar_g3: {
        name: 'Emil Frey Jaguar G3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.1825 + 4,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185],
            [120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 57,
        rideHeightMinFront: 60,
        rideHeightMinRear: 60
    },
    lamborghini_huracan_gt3: {
        name: 'Lamborghini Huracán GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (15 - 6.2) / 34 + 6.2,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [121, 144, 167, 190, 201, 212],
            [117, 136, 154, 164, 173, 191]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    lamborghini_huracan_gt3_evo: {
        name: 'Lamborghini Huracán GT3 Evo',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (15 - 6.2) / 34 + 6.2,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [121, 144, 167, 190, 201, 212],
            [117, 136, 154, 164, 173, 191]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    lamborghini_huracan_gt3_evo2: {
        name: 'Lamborghini Huracán GT3 EVO2',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (15 - 6.2) / 34 + 6.2,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [121, 144, 167, 190, 201, 212],
            [117, 136, 154, 164, 173, 191]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    lexus_rc_f_gt3: {
        name: 'Lexus RC F GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.19 + 7.9,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [96, 115, 134, 154, 173, 192],
            [87, 112, 136, 154, 175, 210]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 50,
        rideHeightMinRear: 64
    },
    mclaren_650s_gt3: {
        name: 'McLaren 650S GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.24 + 5.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [126, 136, 146, 156, 166, 176],
            [126, 136, 146, 156, 166, 176]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 47,
        rideHeightMinFront: 56,
        rideHeightMinRear: 56
    },
    mclaren_720s_gt3: {
        name: 'McLaren 720S GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (8 - 5.3) / 11 + 5.3,
        toeMins: [-0.48, -0.1],
        wheelRates: [
            [118, 134, 150, 166, 182, 198, 214, 230],
            [114, 128, 142, 156, 170, 184, 198, 212]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 47,
        rideHeightMinFront: 50,
        rideHeightMinRear: 64
    },
    mclaren_720s_gt3_evo: {
        name: 'McLaren 720S GT3 Evo',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (16.3 - 5.3) / 46 + 5.3,
        toeMins: [-0.48, -0.1],
        wheelRates: [
            [118, 134, 150, 166, 182, 198, 214, 230],
            [83, 97, 111, 125, 139, 153, 167, 181, 195, 209]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 47,
        rideHeightMinFront: 50,
        rideHeightMinRear: 64
    },
    mercedes_amg_gt3: {
        name: 'Mercedes-AMG GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (14.1 - 6) + 6,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [130, 143, 155, 171, 187, 202],
            [71, 83, 95, 107, 119, 131]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 42,
        rideHeightMinRear: 67
    },
    mercedes_amg_gt3_evo: {
        name: 'Mercedes-AMG GT3 2020',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (14.1 - 6) + 6,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [130, 143, 155, 171, 187, 202],
            [71, 83, 95, 107, 119, 131]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 42,
        rideHeightMinRear: 67
    },
    nissan_gt_r_gt3_2017: {
        name: 'Nissan GT-R Nismo GT3 2017',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.205 + 6,
        toeMins: [-0.2, 0],
        wheelRates: [
            [122, 132, 142, 152, 162, 172, 182],
            [94, 104, 114, 124, 134, 144, 154]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 47.5,
        rideHeightMinFront: 55,
        rideHeightMinRear: 55
    },
    nissan_gt_r_gt3_2018: {
        name: 'Nissan GT-R Nismo GT3 2018',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.18 + 12.5,
        toeMins: [-0.2, 0],
        wheelRates: [
            [136, 146, 156, 166, 176, 186],
            [96, 106, 116, 126, 136, 146]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 47.5,
        rideHeightMinFront: 55,
        rideHeightMinRear: 55
    },
    porsche_991_gt3_r: {
        name: 'Porsche 991 GT3 R',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.1 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [83, 100, 116, 133, 149, 166],
            [155, 128, 141, 154, 167, 180]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 43,
        rideHeightMinFront: 60,
        rideHeightMinRear: 60
    },
    porsche_991ii_gt3_r: {
        name: 'Porsche 991II GT3 R',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.2 + 4.4,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [100.5, 110, 114, 119, 127, 137, 141.5, 146, 155, 173.5],
            [137, 149.5, 156, 162, 174.5, 187, 193, 199.5, 212, 237]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 43,
        rideHeightMinFront: 53,
        rideHeightMinRear: 55
    },
    porsche_992_gt3_r: {
        name: 'Porsche 992 GT3 R',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (12.4 - 6.5) / 30 + 6.5,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [100.5, 110, 114, 119, 127, 137, 141.5, 146, 155, 173.5],
            [137, 149.5, 156, 162, 174.5, 187, 193, 199.5, 212, 237]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 43,
        rideHeightMinFront: 53,
        rideHeightMinRear: 55
    },
    lamborghini_gallardo_rex: {
        name: 'Reiter Engineering R-EX GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * (12 - 4.9) + 4.9,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [121, 126, 131, 136, 141, 146, 151, 156, 161, 166, 171, 176, 181, 186, 191, 196, 201, 206, 211],
            [117, 122, 127, 132, 137, 142, 147, 152, 157, 162, 167, 182, 187]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    ford_mustang_gt3: {
        name: 'Ford Mustang GT3',
        camberFrontRange: [-4, -1.5],
        camberRearRange: [-3.5, -1],
        tirePressureMin: 20.3,
        casterFunc: (v) => v * 0.175 + 5.3,
        toeMins: [-0.2, -0.1],
        wheelRates: [
            [105, 120, 135, 150, 165, 180],
            [90, 105, 120, 135, 150, 165]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 48.5,
        rideHeightMinFront: 50,
        rideHeightMinRear: 50
    },



    // GT4
    alpine_a110_gt4: {
        name: 'Alpine A110 GT4',
        camberFrontRange: [-5, 0],
        camberRearRange: [-5, 0],
        tirePressureMin: 17,
        casterFunc: (v) => v * (13.7 - 7.3) / 34 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [62.5, 72.5, 82.5, 92.5],
            [73.3, 83.3, 93.3, 103.3]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 45,
        rideHeightMinFront: 95,
        rideHeightMinRear: 85
    },
    amr_v8_vantage_gt4: {
        name: 'AMR V8 Vantage GT4',
        camberFrontRange: [-4, 0],
        camberRearRange: [-4, 0],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.18 + 10.7,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [80, 90, 100, 110],
            [70, 75, 80]
        ],
        steeringRatioMin: 14,
        brakeBiasMin: 45,
        rideHeightMinFront: 98,
        rideHeightMinRear: 102
    },
    audi_r8_gt4: {
        name: 'Audi R8 LMS GT4',
        camberFrontRange: [-4.5, 0],
        camberRearRange: [-3.5, 0],
        tirePressureMin: 17,
        casterFunc: (v) => v * (13.3 - 6.6) / 34 + 6.6,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [142, 160],
            [146, 163]
        ],
        steeringRatioMin: 14,
        brakeBiasMin: 50,
        rideHeightMinFront: 105,
        rideHeightMinRear: 107
    },
    bmw_m4_gt4: {
        name: 'BMW M4 GT4',
        camberFrontRange: [-4.5, -2.5],
        camberRearRange: [-3.5, -1.5],
        tirePressureMin: 17,
        casterFunc: (v) => 8.4,
        toeMins: [-0.2, 0.0],
        wheelRates: [
            [165.888, 184.320, 202.752],
            [103.335, 117.113, 130.891]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 49,
        rideHeightMinFront: 80,
        rideHeightMinRear: 75
    },
    chevrolet_camaro_gt4r: {
        name: 'Chevrolet Camaro GT4.R',
        camberFrontRange: [-5, -2.5],
        camberRearRange: [-3.5, -1.5],
        tirePressureMin: 17,
        casterFunc: (v) => 7.1,
        toeMins: [-0.2, 0.0],
        wheelRates: [
            [165.888, 184.32, 202.752],
            [90, 102, 114]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 47,
        rideHeightMinFront: 115,
        rideHeightMinRear: 123
    },
    ginetta_g55_gt4: {
        name: 'Ginetta G55 GT4',
        camberFrontRange: [-4, -0.5],
        camberRearRange: [-3.5, -0.5],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.2625 + 3.7,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [80, 90, 100, 110, 120],
            [60, 70, 80, 90, 100]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 46,
        rideHeightMinFront: 75,
        rideHeightMinRear: 76
    },
    ktm_xbow_gt4: {
        name: 'KTM X-Bow GT4',
        camberFrontRange: [-2, -0.5],
        camberRearRange: [-2, -0.5],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.1925 + 1.7,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [87, 97, 107, 117, 127],
            [81, 91, 101, 111, 121, 131]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 44,
        rideHeightMinFront: 110,
        rideHeightMinRear: 110
    },
    maserati_mc_gt4: {
        name: 'Maserati GranTurismo MC GT4',
        camberFrontRange: [-4.3, -2.7],
        camberRearRange: [-3.8, -2.2],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.22 + 3.4,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [116, 151, 186],
            [113, 138, 163]
        ],
        steeringRatioMin: 14,
        brakeBiasMin: 49,
        rideHeightMinFront: 80,
        rideHeightMinRear: 105
    },
    mclaren_570s_gt4: {
        name: 'McLaren 570S GT4',
        camberFrontRange: [-5, 0],
        camberRearRange: [-5, 0],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.245 + 5.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [140, 175],
            [162.85, 175.52]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 60,
        rideHeightMinFront: 95,
        rideHeightMinRear: 95
    },
    mercedes_amg_gt4: {
        name: 'Mercedes-AMG GT4',
        camberFrontRange: [-4.5, -2.5],
        camberRearRange: [-3.5, -1.5],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.18 + 9.2,
        toeMins: [-0.2, 0.0],
        wheelRates: [
            [78, 88, 104],
            [66]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 51,
        rideHeightMinFront: 103,
        rideHeightMinRear: 101
    },
    porsche_718_cayman_gt4_mr: {
        name: 'Porsche 718 Cayman GT4 Clubsport',
        camberFrontRange: [-5, -2.5],
        camberRearRange: [-5, -1.5],
        tirePressureMin: 17,
        casterFunc: (v) => v * (10.2 - 7.3) / 28 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [99, 108, 116, 124],
            [91, 99, 108, 116, 124]
        ],
        steeringRatioMin: 15,
        brakeBiasMin: 45,
        rideHeightMinFront: 106,
        rideHeightMinRear: 94
    },


    // Cup
    ferrari_488_challenge_evo: {
        name: 'Ferrari 488 Challenge Evo',
        camberFrontRange: [-4.4, -1.5],
        camberRearRange: [-3.3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * (20.6 - 5.0) / 98 + 5.0,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [151, 163.8],
            [141, 155]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 51,
        rideHeightMinFront: 59,
        rideHeightMinRear: 103
    },
    lamborghini_huracan_st_evo2: {
        name: 'Lamborghini Huracan ST EVO2',
        camberFrontRange: [-3, -0.5],
        camberRearRange: [-3.5, -0.5],
        tirePressureMin: 20.3,
        casterFunc: (v) => (v) * (17.4 - 10.7) / 34 + 10.7,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [121, 144, 167, 190, 201, 212],
            [117, 136, 154, 164, 173, 191]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 50,
        rideHeightMinFront: 54,
        rideHeightMinRear: 54
    },
    porsche_991ii_gt3_cup: {
        name: 'Porsche 991II GT3 Cup',
        camberFrontRange: [-6.5, -2.5],
        camberRearRange: [-5, -1.5],
        tirePressureMin: 20.3,
        casterFunc: (v) => (v) * 0.1 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [0, 1, 2, 3],
            [0, 1, 2, 3]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 60,
        rideHeightMinRear: 80
    },
    porsche_992_gt3_cup: {
        name: 'Porsche 992 GT3 Cup',
        camberFrontRange: [-5, -2.5],
        camberRearRange: [-4.4, -1.5],
        tirePressureMin: 20.3,
        casterFunc: (v) => 14.8,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [1],
            [1]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 72,
        rideHeightMinRear: 106
    },


    // TCX
    bmw_m2_cs_racing: {
        name: 'BMW M2 CS Racing',
        camberFrontRange: [-5, -3],
        camberRearRange: [-3.5, -2],
        tirePressureMin: 17,
        casterFunc: (v) => 8.5,
        toeMins: [-0.2, 0],
        wheelRates: [
            [162, 180, 198],
            [103, 117, 131]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 56,
        rideHeightMinFront: 125,
        rideHeightMinRear: 125
    },


    // GT2
    audi_r8_lms_gt2: {
        name: "Audi R8 LMS GT2",
        camberFrontRange: [-3.5, -1.5],
        camberRearRange: [-3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * (13.3 - 6.6) / 34 + 6.6,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [142, 160],
            [146, 163]
        ],
        steeringRatioMin: 12,
        brakeBiasMin: 50,
        rideHeightMinFront: 80,
        rideHeightMinRear: 80,
        minPreload: 10
    },
    ktm_xbow_gt2: {
        name: "KTM X-Bow GT2",
        camberFrontRange: [-3.5, -0.5],
        camberRearRange: [-3, -0.5],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.215 + 3.2,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [87, 97, 107, 117, 127],
            [81, 91, 101, 111, 121, 131]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 44,
        rideHeightMinFront: 75,
        rideHeightMinRear: 200,
        minPreload: 10,
        minWing: 1
    },
    maserati_mc20_gt2: {
        name: "Maserati MC20 GT2",
        camberFrontRange: [-3.5, -1.5],
        camberRearRange: [-3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.18 + 8.5,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [165.18, 179.54, 193.9],
            [173.913, 189.036, 204.158]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 55,
        rideHeightMinFront: 80,
        rideHeightMinRear: 80,
        minWing: 1
    },
    mercedes_amg_gt2: {
        name: "Mercedes-AMG GT2",
        camberFrontRange: [-3.5, -1.5],
        camberRearRange: [-3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.18 + 9.2,
        toeMins: [-0.2, 0.0],
        wheelRates: [
            [78, 88, 104],
            [66, 76, 86]
        ],
        steeringRatioMin: 10,
        brakeBiasMin: 55,
        rideHeightMinFront: 122,
        rideHeightMinRear: 140,
        minPreload: 10,
        minWing: 1
    },
    porsche_935: {
        name: "Porsche 935",
        camberFrontRange: [-3.5, -1.5],
        camberRearRange: [-3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.1 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [0, 0.001, 0.002, 0.003],
            [0, 0.001, 0.002, 0.003]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 90,
        rideHeightMinRear: 160,
        minPreload: 0.1,
        minWing: 1
    },
    porsche_991_gt2_rs_mr: {
        name: "Porsche 991 GT2 RS Clubsport MR",
        camberFrontRange: [-3.5, -1.5],
        camberRearRange: [-3, -1],
        tirePressureMin: 17,
        casterFunc: (v) => v * 0.1 + 7.3,
        toeMins: [-0.4, -0.4],
        wheelRates: [
            [0, 0.001, 0.002, 0.003],
            [0, 0.001, 0.002, 0.003]
        ],
        steeringRatioMin: 11,
        brakeBiasMin: 50,
        rideHeightMinFront: 100,
        rideHeightMinRear: 167,
        minPreload: 0.1,
        minWing: 1
    }

}

const tipsConfig = {
    'Tyres': {
        'Compound': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Front Pressure [psi]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Pressure [psi]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Front Toe [°]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Toe [°]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Front Camber [°]': {
            'rightHigher': 'This setup has less negative camber.  You will have less grip available during cornering but may benefit from better braking performance as there is more tyre touching the track in a straight line.',
            'leftHigher': 'This setup has more negative camber, providing more grip during cornering.  You may notice decreased braking performance as there is less tyre touching the track in a straight line.',
            'general': ''
        },
        'Rear Camber [°]': {
            'rightHigher': 'This setup has less negative camber.  This promotes oversteer during cornering as well as increased traction during acceleration.',
            'leftHigher': 'This setup has more negative camber.  This will promote stability and understeer during cornering, as well as reduced traction during acceleration.',
            'general': ''
        },
        'Caster [°]': {
            'rightHigher': 'The higher caster value will improve straight line stability and increase the camber available to the front wheels during cornering.',
            'leftHigher': 'This setup has a lower caster value, reducing straight line stability and reducing the amount of camber available to the front wheels during cornering.',
            'general': ''
        }
    },
    'Electronics': {
        'TC1': {
            'rightHigher': 'This setup will engage TC more often.',
            'leftHigher': 'This setup will not engage TC as often.',
            'general': ''
        },
        'TC2': {
            'rightHigher': 'This setup cuts more power when TC is engaged.',
            'leftHigher': 'This setup cuts less power when TC is engaged.',
            'general': ''
        },
        'ABS': {
            'rightHigher': 'The higher ABS value will help prevent lockups at the cost of longer braking distances.',
            'leftHigher': 'The lower ABS value will reduce braking distances but increases the possibility of lockups.',
            'general': ''
        },
        'ECU map': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        }
    },
    'Mechanical': {
        'Front Antiroll bar': {
            'rightHigher': 'This setup will be more stable on corner entry.',
            'leftHigher': 'This setup will be more responsive on corner entry.',
            'general': ''
        },
        'Rear Antiroll bar': {
            'rightHigher': 'This setup will be more prone to oversteer on corner exit.',
            'leftHigher': 'This setup will be more prone to understeer on corner exit.',
            'general': ''
        },
        'Diff preload [Nm]': {
            'rightHigher': 'The higher preload makes the car more stable on corner entry and may cause oversteer on corner exit.',
            'leftHigher': 'The lower preload provides more oversteer on corner entry and better straight line acceleration.',
            'general': ''
        },
        'Brake power [%]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Brake bias [%]': {
            'rightHigher': 'Higher brake bias provides more stability under braking but may cause understeer on corner entry.',
            'leftHigher': 'Lower brake bias may help with rotation on corner entry, at the cost of some stability under braking.',
            'general': ''
        },
        'Steering ratio': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Front Wheel rate [N/m]': {
            'rightHigher': 'The higher wheel rate improves responsiveness especially at high speeds or during aggressive maneuvers.  It may also result in a harser ride over bumps and less grip on uneven surfaces.',
            'leftHigher': 'The lower wheel rate helps to absorb bumps, potentially increasing front tire contact on uneven surfaces.  This may also lead to increased body roll and a less responsive turn-in.',
            'general': ''
        },
        'Rear Wheel rate [N/m]': {
            'rightHigher': 'The higher wheel rate will enhance stability and responsiveness during acceleration and cornering.  You may have less traction on uneven surfaces as the tires struggle to maintain consistent contact with the track.',
            'leftHigher': 'The lower wheel rate will improve traction on uneven surfaces but may feel less precise during aggressive cornering.',
            'general': ''
        },
        'Front Bumpstop rate [N]': {
            'rightHigher': 'This setup is more stable during braking and more responsive to steering inputs, but may experience understeer on rough tracks or uneven surfaces.',
            'leftHigher': 'This setup absorbs impacts more effectively, improving front grip on uneven surfaces.  Initial turn-in may be less responsive.',
            'general': ''
        },
        'Rear Bumpstop rate [N]': {
            'rightHigher': 'This setup has improved rear-end stability during acceleration and on corner exit, reducing oversteer.  You may experience a loss of traction on bumpy or uneven surfaces.',
            'leftHigher': 'This setup has improved rear-end grip over bumpy or uneven surfaces.  A value that is too soft may lead to oversteer.',
            'general': ''
        },
        'Front Bumpstop range': {
            'rightHigher': 'Suspension has more room to travel before hitting the bumpstop.  This can lead to improved absorption of bumps and irregularities on the track, potentially offering better front grip and stability over uneven surfaces. You may notice a less responsive turn-in.',
            'leftHigher': "Reducing the front bumpstop range limits the suspension's travel before hitting the bumpstop. This typically results in a more direct and responsive turn-in, as the car's front end becomes more rigid. While this can enhance steering precision and response on smooth tracks, it may compromise front grip and stability on rough or uneven surfaces, as the suspension has less capacity to absorb bumps.",
            'general': ''
        },
        'Rear Bumpstop range': {
            'rightHigher': 'This setup allows for more suspension travel before the bumpstops engage. This can improve traction and stability at the rear, especially over bumps and through fast corners, by allowing the tires to maintain better contact with the track. However, it might also make the rear end feel softer, potentially leading to a slight delay in response when accelerating out of corners.',
            'leftHigher': "This setup has a stiffer rear end, which can enhance the car's responsiveness and stability during high-speed cornering and under braking. However, it may also lead to reduced traction and harsher handling over uneven surfaces, as the ability of the suspension to absorb impacts is diminished.",
            'general': ''
        },
    },
    'Dampers': {
        'Front Bump': {
            'rightHigher': 'The higher value means the spring will travel further during compression.',
            'leftHigher': 'The lower value means the spring does not have as far to travel during compression.',
            'general': ''
        },
        'Rear Bump': {
            'rightHigher': 'The higher value means the spring will travel further during compression.',
            'leftHigher': 'The lower value means the spring does not have as far to travel during compression.',
            'general': ''
        },
        'Front Fast bump': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Fast bump': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Front Rebound': {
            'rightHigher': 'The higher value means the spring will decompress more slowly.',
            'leftHigher': 'The lower value means the spring will decompress more quickly.',
            'general': ''
        },
        'Rear Rebound': {
            'rightHigher': 'The higher value means the spring will decompress more slowly.',
            'leftHigher': 'The lower value means the spring will decompress more quickly.',
            'general': ''
        },
        'Front Fast rebound': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Fast rebound': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
    },
    'Aero': {
        'Front Ride height [mm]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Ride height [mm]': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rake': {
            'rightHigher': 'This setup has more rake, which will help promote rotation in the corners but will increase drag on the straights.',
            'leftHigher': 'This setup has less rake, which will give less rotation in the corners but also less drag on the straights.',
            'general': ''
        },
        'Front Brake ducts': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Rear Brake ducts': {
            'rightHigher': '',
            'leftHigher': '',
            'general': ''
        },
        'Splitter': {
            'rightHigher': 'The higher value provides more grip to the front wheels, possibly increasing oversteer.',
            'leftHigher': 'The lower value provides less grip to the front wheels, possibly increasing understeer.',
            'general': ''
        },
        'Wing': {
            'rightHigher': 'The higher value provides more grip to the rear wheels.  You will notice less rotation in the corners and increased drag on the straights.',
            'leftHigher': 'The lower value provides less grip to the rear wheels.  You will notice more rotation in the corners and less drag on the straights.',
            'general': ''
        }
    }
}

const leftFileInput = ref(null);
const rightFileInput = ref(null);
const leftData = ref(null);
const rightData = ref(null);
const leftPreProcessed = ref({});
const rightPreProcessed = ref({});
const leftProcessed = ref({});
const rightProcessed = ref({});
const tempProcessed = ref({});

const leftCar = ref(null);
const rightCar = ref(null);
const leftFileName = ref('');
const rightFileName = ref('');
const tips = ref({});

function triggerFileInput(side) {
    if (side === 'left') {
        leftFileInput.value.click();
    } else if (side === 'right') {
        rightFileInput.value.click();
    }
}

async function loadFile(side, event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const content = await file.text();
        const jsonData = JSON.parse(content);
        if (side === 'left') {
            leftData.value = jsonData;
            leftCar.value = carData[jsonData?.carName]
            leftFileName.value = file.name;
        } else if (side === 'right') {
            rightData.value = jsonData;
            rightCar.value = carData[jsonData?.carName]
            rightFileName.value = file.name;
        }

        if (rightCar && leftCar) {
            setupGroups.map(([title, items]) =>
                DiffSection(title, items)
            )
            updateProcessedData()


            GenerateTips()
        }
    } catch (error) {
        console.error('Error reading or parsing file', error);
    }
}

function displayItem(compValue, dispValue = compValue) {
    return {
        compValue: compValue,
        dispValue: dispValue
    };
}

const tyresSetup = [
    // ['Compound', (s) => [displayItem(s?.basicSetup.tyres.tyreCompound)]],
    ['Pressure [psi]', (s, c) => s?.basicSetup.tyres.tyrePressure.map((v) => displayItem((c.tirePressureMin + v / 10).toFixed(1)))],
    ['Toe [°]', (s, c) => s?.basicSetup.alignment.toe.map((v, i) => displayItem((v / 100 + c.toeMins[i >> 1]).toFixed(2)))],
    ['Camber [°]', (s, c) => {
        if (!c) {
            console.error('Car data not provided');
            return [
                displayItem('N/A'), displayItem('N/A'), // Handling for front wheels when car data is not provided
                displayItem('N/A'), displayItem('N/A')  // Handling for rear wheels when car data is not provided
            ];
        }

        // Apply adjustments to both front and rear camber clicks
        const adjustedCamberValues = s.basicSetup.alignment.camber.map((v, index) => {
            let adjustmentBase = index < 2 ? c.camberFrontRange[0] : c.camberRearRange[0]; // Determine base adjustment depending on wheel position
            return adjustmentBase + (v * 0.1); // Apply adjustment
        });

        return adjustedCamberValues.map((adjustedValue) => displayItem(adjustedValue.toFixed(1)));
    }],
    // ['Camber [clicks]', (s) => s?.basicSetup.alignment.camber.map((v) => displayItem(v))],
    ['Caster [°]', (s, c) => [
        displayItem(c?.casterFunc(s.basicSetup.alignment.casterLF).toFixed(1)),
        displayItem(c?.casterFunc(s.basicSetup.alignment.casterRF).toFixed(1))
    ]]
];

const electronicsSetup = [
    ['TC1', (s) => [displayItem(s?.basicSetup.electronics.tC1)]],
    ['TC2', (s) => [displayItem(s?.basicSetup.electronics.tC2)]],
    ['ABS', (s) => [displayItem(s?.basicSetup.electronics.abs)]],
    ['ECU map', (s) => [displayItem(s && s.basicSetup.electronics.eCUMap + 1)]]
];

const mechanicalSetup = [
    ['Antiroll bar', (s) => [
        displayItem(s?.advancedSetup.mechanicalBalance.aRBFront),
        displayItem(s?.advancedSetup.mechanicalBalance.aRBRear)
    ]],
    ['Diff preload [Nm]', (s) => [displayItem(s && s.advancedSetup.drivetrain.preload * 10 + 20)]],
    ['Brake power [%]', (s) => [displayItem(s && s.advancedSetup.mechanicalBalance.brakeTorque + 80)]],
    ['Brake bias [%]', (s, c) => [displayItem(s && s.advancedSetup.mechanicalBalance.brakeBias / 5 + c.brakeBiasMin)]],
    ['Steering ratio', (s, c) => [displayItem(s && s.basicSetup.alignment.steerRatio + c.steeringRatioMin)]],
    ['Wheel rate [N/m]', (s, c) => s?.advancedSetup.mechanicalBalance.wheelRate.map((v, i) => displayItem(c.wheelRates[i >> 1][v] * 1000))],
    ['Bumpstop rate [N]', (s) => s?.advancedSetup.mechanicalBalance.bumpStopRateUp.map((v) => displayItem(v * 100 + 200))],
    //['Bumpstop rate [N]', (s) => s?.advancedSetup.mechanicalBalance.bumpStopRateUp.map((v) => displayItem(v * 100 + 300))],
    ['Bumpstop range', (s) => s?.advancedSetup.mechanicalBalance.bumpStopWindow.map((v) => displayItem(v))]
];

const dampersSetup = [
    ['Bump', (s) => s?.advancedSetup.dampers.bumpSlow.map((v) => displayItem(v))],
    ['Fast bump', (s) => s?.advancedSetup.dampers.bumpFast.map((v) => displayItem(v))],
    ['Rebound', (s) => s?.advancedSetup.dampers.reboundSlow.map((v) => displayItem(v))],
    ['Fast rebound', (s) => s?.advancedSetup.dampers.reboundFast.map((v) => displayItem(v))]
];

const aeroSetup = [
    ['Ride height [mm]', (s, c) => [
        displayItem(s && s.advancedSetup.aeroBalance.rideHeight[0] + c.rideHeightMinFront),
        displayItem(s && s.advancedSetup.aeroBalance.rideHeight[2] + c.rideHeightMinRear)
    ]],
    ['Rake', (s, c) => [
        displayItem(s && (s.advancedSetup.aeroBalance.rideHeight[2] + c.rideHeightMinRear) -
            (s.advancedSetup.aeroBalance.rideHeight[0] + c.rideHeightMinFront))
    ]],
    ['Brake ducts', (s) => s?.advancedSetup.aeroBalance.brakeDuct.map((v) => displayItem(v))],
    ['Splitter', (s) => [displayItem(s && s.advancedSetup.aeroBalance.splitter + 1)]],
    ['Wing', (s) => [displayItem(s && s.advancedSetup.aeroBalance.rearWing)]]
];

const setupGroups = [
    ['Tyres', tyresSetup],
    ['Electronics', electronicsSetup],
    ['Mechanical', mechanicalSetup],
    ['Dampers', dampersSetup],
    ['Aero', aeroSetup]
];

function processSetupData(preProcessedData) {
    const processed = {};

    // Initialize placeholders for front and rear ride heights
    let frontRideHeight = null;
    let rearRideHeight = null;

    for (const category in preProcessedData.value) {
        processed[category] = {};

        for (const subcat in preProcessedData.value[category]) {
            const items = preProcessedData.value[category][subcat];
            if (items.length === 4) {
                processed[category][`Front ${subcat}`] = items.slice(0, 2);
                processed[category][`Rear ${subcat}`] = items.slice(2);
            } else if (items.length === 2 && subcat !== "Caster [°]") {
                processed[category][`Front ${subcat}`] = [items[0]];
                processed[category][`Rear ${subcat}`] = [items[1]];
                if (subcat === 'Ride height [mm]') {
                    frontRideHeight = parseFloat(items[0]?.text);
                    rearRideHeight = parseFloat(items[1]?.text);
                }
            } else {
                processed[category][subcat] = items;
            }
        }


    }


    tempProcessed.value = processed; // Assuming tempProcessed is a ref you want to update
    return processed;
}
function updateProcessedData() {
    if (typeof leftData.value === 'object' && leftData.value !== null && Object.keys(leftData.value).length > 0) {

        leftProcessed.value = processSetupData(leftPreProcessed);

    }
    if (typeof rightData.value === 'object' && rightData.value !== null && Object.keys(rightData.value).length > 0) {

        rightProcessed.value = processSetupData(rightPreProcessed);

    }
}
function DiffItem(text, value, other) {
    const compResult = value - other;
    const style = compResult > 0 ? 'green' : compResult < 0 ? 'red' : 'grey';



    return {
        className: style,
        text: text
    }


}

function compareValues(left, right) {
    let fleft = parseFloat(left[0].text)
    let fright = parseFloat(right[0].text)
    return fleft < fright ? 1 : fright < fleft ? -1 : 0;
}

function GenerateTips() {
    if (!leftData && !rightData) { return; }
    // Reset tips
    tips.value = {};
    Object.keys(tipsConfig).forEach(category => {
        if (!tips.value[category]) {
            tips.value[category] = {};
        }
        Object.keys(tipsConfig[category]).forEach(attribute => {
            const leftValue = leftProcessed.value[category]?.[attribute];
            const rightValue = rightProcessed.value[category]?.[attribute];


            // Check if both setups have the attribute and values are present
            if (leftValue !== undefined && rightValue !== undefined) {
                const comparisonResult = compareValues(leftValue, rightValue);
                if (attribute==='Front Toe [°]') {
                    const frontLeftSetupPositive = parseFloat(leftValue[0].text) > 0
                    const frontLeftSetupNegative = parseFloat(leftValue[0].text) < 0
                    const frontRightSetupPositive = parseFloat(rightValue[0].text) > 0
                    const frontRightSetupNegative = parseFloat(rightValue[0].text) < 0
                    let frontToeTip = ''

                    switch (comparisonResult) {
                        case 1: // Right is higher
                            if (frontRightSetupPositive) {
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'Both will be responsive to steering inputs at the cost of reduced straight-line stability, with this setup being more extreme than the one on the left.'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'We have switched from negative toe to positive toe.  This setup will have much better initial turn-in response but will feel less stable at high speeds.'
                                } else {
                                    frontToeTip = 'This setup will have better turn-in response but will be less stable at high speeds.'
                                }
                                
                            } else if (frontRightSetupNegative){
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'We have switched from positive toe to negative toe.  This setup will have better straight line stability but at the cost of a less responsive initial turn-in.'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'Both setups provide straight line stability however the setup on the right will be more responsive on initial turn-in.'
                                } else {
                                    frontToeTip = 'n/a'
                                }
                            } else {
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'n/a'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'This setup offers a balance between straight line stability and initial turn-in response, whereas the baseline setup had more stability and less initial turn-in response.'
                                } else {
                                    frontToeTip = ''
                                }
                            }
                            break;
                        case -1: // Left is higher
                            if (frontRightSetupPositive) {
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'Both will be responsive to steering inputs at the cost of reduced straight-line stability, but this setup is not as extreme in that regard.'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'n/a'
                                } else {
                                    frontToeTip = 'n/a'
                                }
                                
                            } else if (frontRightSetupNegative){
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'We have switched from positive toe to negative toe.  This setup will be more stable at high speeds but less responsive on turn-in.'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'Both setups favor straight-line stability over initial turn-in.  The setup on the right favors stability over turn-in more than the baseline setup.'
                                } else {
                                    frontToeTip = 'The baseline setup is neutral, and this setup favors straight line stability over initial turn-in response.'
                                }
                            } else {
                                if (frontLeftSetupPositive) {
                                    frontToeTip = 'This has less turn-in response but more straight-line stability than the baseline.'
                                } else if (frontLeftSetupNegative) {
                                    frontToeTip = 'n/a'
                                } else {
                                    frontToeTip = ''
                                }
                            }
                            break;
                        default: // Equal or not comparable
                            
                            break;
                    }
                    tips.value[category][attribute] = frontToeTip;
                }else if (attribute==='Rear Toe [°]'){
                    const rearLeftSetupPositive = parseFloat(leftValue[0].text) > 0
                    const rearLeftSetupNegative = parseFloat(leftValue[0].text) < 0
                    const rearRightSetupPositive = parseFloat(rightValue[0].text) > 0
                    const rearRightSetupNegative = parseFloat(rightValue[0].text) < 0
                    let rearToeTip = ''

                    switch (comparisonResult) {
                        case 1: // Right is higher
                            if (rearRightSetupPositive) {
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'This setup has better rotation in the corners but will be more unstable at high speeds.'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'This setup is more responsive to steering inputs at the cost of straight-line stability.'
                                } else {
                                    rearToeTip = 'This setup has better rotation in the corners but will be more unstable at high speeds.'
                                }
                                
                            } else if (rearRightSetupNegative){
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'This setup increases straight-line stability and reduces oversteer on corner exit while reducing initial turn-in response.'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'Both setups have negative rear toe and will benefit from straight line stability and '
                                } else {
                                    rearToeTip = 'n/a'
                                }
                            } else {
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'n/a'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'This setup has neutral rear toe, but compared to the baseline will provide a more responsive car during cornering.'
                                } else {
                                    rearToeTip = ''
                                }
                            }
                            break;
                        case -1: // Left is higher
                            if (rearRightSetupPositive) {
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'Both setups value rotation over straight line stability, but this setup is not as aggressive as the baseline.'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'n/a'
                                } else {
                                    rearToeTip = 'n/a'
                                }
                                
                            } else if (rearRightSetupNegative){
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'Compared to the baseline this setup will have much more stability on the straights at the cost of much less rotation in the corners.'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'Both setups value stability over rotation.  This setup will have slightly more rotation than the baseline.'
                                } else {
                                    rearToeTip = 'This setup is more stable at high speeds but has less rotation in the corners.'
                                }
                            } else {
                                if (rearLeftSetupPositive) {
                                    rearToeTip = 'This setup has less rotation in the corners and more stability in a straight line.'
                                } else if (rearLeftSetupNegative) {
                                    rearToeTip = 'n/a'
                                } else {
                                    rearToeTip = ''
                                }
                            }
                            break;
                        default: // Equal or not comparable
                            
                            break;
                    }
                    tips.value[category][attribute] = rearToeTip;
                } else {
                    console.log('generating ', attribute)
                    switch (comparisonResult) {
                        case 1: // Right is higher
                            tips.value[category][attribute] = tipsConfig[category][attribute].rightHigher;
                            break;
                        case -1: // Left is higher
                            tips.value[category][attribute] = tipsConfig[category][attribute].leftHigher;
                            break;
                        default: // Equal or not comparable
                            tips.value[category][attribute] = tipsConfig[category][attribute].general;
                            break;
                    }
                }


            } else {
                // General tip if only one setup is loaded or attribute is missing in one setup
                tips.value[category][attribute] = tipsConfig[category][attribute].general;
            }
        });
    });

}

function DiffRow(title, desc, valueFunc) {
    const left = valueFunc(leftData.value, leftCar.value) ?? [];
    const right = valueFunc(rightData.value, rightCar.value) ?? [];

    const leftItems = left.map((v, i) =>
        DiffItem(v.dispValue, v.compValue, right[i]?.compValue));
    const rightItems = right.map((v, i) =>
        DiffItem(v.dispValue, v.compValue, left[i]?.compValue));


    if (!leftPreProcessed.value[title]) {
        leftPreProcessed.value[title] = {}
    }
    if (!rightPreProcessed.value[title]) {
        rightPreProcessed.value[title] = {}
    }
    leftPreProcessed.value[title][desc] = leftItems;
    rightPreProcessed.value[title][desc] = rightItems;



}

function DiffSection(title, items) {

    try {

        items.map(([desc, valueFunc]) =>
            DiffRow(title, desc, valueFunc)
        )

    } catch (error) {
        console.log('err')
        console.log(error)
    }


}
</script>


<style scoped>
.carname {
    font-size: 1.2em;
    font-weight: bolder;

}


.category {
    padding-bottom: 50px;
    margin: 10px;
}

.itemrow {
    /* padding-left: 15px; */
    border-bottom: 1px solid grey;
}


.pre-wrap {
    white-space: pre-wrap;
}
</style>