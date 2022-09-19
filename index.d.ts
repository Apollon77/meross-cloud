declare module 'meross-cloud' {
    import { EventEmitter } from 'events'

    export interface DeviceDefinition {
        uuid: string
        onlineStatus: number
        devName: string
        devIconId: string
        bindTime: number
        deviceType: string
        subType: string
        channels: any[]
        region: string
        fmwareVersion: string
        hdwareVersion: string
        userDevIcon: string
        iconType: number
        skillNumber: string
        domain: string
        reservedDomain: string
    }

    export interface GetControlPowerConsumptionXResponse {
        consumptionx: {
            date: string
            /**
             * timestamp, utc.
             * has to be multiplied by 1000 to use on new Date(time)
             */
            time: number
            value: number
        }[]
    }
    export interface GetControlElectricityResponse {
        electricity: {
            channel: number
            /**
             * current in decimilliAmp. Has to get divided by 10000 to get Amp(s)
             */
            current: number
            /**
             * voltage in deciVolt. Has to get divided by 10 to get Volt(s)
             */
            voltage: number
            /**
             * power in milliWatt. Has to get divided by 1000 to get Watt(s)
             */
            power: number
            config: {
                voltageRatio: number
                electricityRatio: number
            }
        }
    }

    export interface CloudOptions {
        email: string;
        password: string;
        logger?: Function;
        localHttpFirst?: boolean,
        onlyLocalForGet?: boolean,
        timeout?: number
    }

    export interface LightData {
        channel: number;
        capacity: number;
        gradual: number;
        rgb?: number;
        temperature?: number;
        luminance?: number;
    }

    export interface ThermostatModeData {
        channel: number;
        heatTemp?: number;
        coolTemp?: number;
        manualTemp?: number;
        ecoTemp?: number;
        targetTemp?: number;
        mode?: number;
        onoff?: number;
    }

    export type MessageId = string
    export type Callback<T> = (error: Error | null, data: T) => void
    export type ErrorCallback = (error: Error | null) => void
    export type DeviceInitializedEvent = 'deviceInitialized'

    export type DeviceInitializedCallback = (deviceId: string, deviceDef: DeviceDefinition, device: MerossCloudDevice) => void

    export class MerossCloud extends EventEmitter {
        constructor(options: CloudOptions)
        connect(callback: Callback<number>): void
        on(name: DeviceInitializedEvent, handler: DeviceInitializedCallback): this
        logout(callback: Callback<number>): void
        disconnectAll(force: boolean): void
        getDevice(uuid: string): MerossCloudDevice
    }

    export class MerossCloudDevice extends EventEmitter {
        /**
         * @deprecated
         */
        connect(): void
        /**
         * @deprecated
         */
        disconnect(force: boolean): void

        setKnownLocalIp(ip: string): void
        removeKnownLocalIp(): void

        publishMessage(method: 'GET' | 'SET', namespace: string, payload: any, callback?: Callback<any>): MessageId

        getSystemAllData(callback: Callback<any>): MessageId
        getSystemDebug(callback: Callback<any>): MessageId
        getSystemAbilities(callback: Callback<any>): MessageId
        getSystemReport(callback: Callback<any>): MessageId
        getSystemRuntime(callback: Callback<any>): MessageId
        getSystemDNDMode(callback: Callback<any>): MessageId
        getOnlineStatus(callback: Callback<any>): MessageId
        getConfigWifiList(callback: Callback<any>): MessageId
        getConfigTrace(callback: Callback<any>): MessageId
        getControlPowerConsumption(callback: Callback<any>): MessageId
        getControlPowerConsumptionX(callback: Callback<GetControlPowerConsumptionXResponse>): MessageId
        getControlElectricity(callback: Callback<GetControlElectricityResponse>): MessageId
        getRollerShutterState(callback: Callback<any>): MessageId
        getRollerShutterPosition(callback: Callback<any>): MessageId
        getFilterMaintenance(callback: Callback<any>): MessageId
        getPhysicalLockState(callback: Callback<any>): MessageId
        getFanState(callback: Callback<any>): MessageId

        controlToggle(onoff: boolean, callback: Callback<any>): MessageId
        controlToggleX(channel: number, onoff: boolean, callback: Callback<any>): MessageId
        controlSpray(channel: number, mode: number, callback: Callback<any>): MessageId
        controlRollerShutterUp(channel: number, callback: Callback<any>): MessageId
        controlRollerShutterDown(channel: number, callback: Callback<any>): MessageId
        controlRollerShutterStop(channel: number, callback: Callback<any>): MessageId
        controlGarageDoor(channel: number, open: boolean, callback: Callback<any>): MessageId
        controlLight(light: LightData, callback: Callback<any>): MessageId
        controlDiffusorSpray(type: string, channel: number, mode: number, callback: Callback<any>): MessageId
        controlDiffusorLight(type: string, light: LightData, callback: Callback<any>): MessageId
        controlThermostatMode(channel: number, modeData: ThermostatModeData, callback: Callback<any>): MessageId
        controlPhysicalLock(channel: number, locked: boolean, callback: Callback<any>): MessageId
        controlFan(channel: number, speed: number, maxSpeed: number, callback: Callback<any>): MessageId
        setSystemDNDMode(onoff: boolean, callback: Callback<any>): MessageId
    }

    export default MerossCloud
}
