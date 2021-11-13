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
        email: string
        password: string
        logger?: Function
    }

    export interface LightData {
        channel: number;
        capacity: number;
        gradual: number;
        rgb?: number;
        temperature?: number;
        luminance?: number;
    }

    export type Callback<T> = (error: Error | null, data: T) => void
    export type ErrorCallback = (error: Error | null) => void
    export type DeviceInitializedEvent = 'deviceInitialized'

    export type DeviceInitializedCallback = (deviceId: string, deviceDef: DeviceDefinition, device: MerossCloudDevice) => void

    export class MerossCloud extends EventEmitter {
        constructor (options: CloudOptions)
        connect (callback: Callback<number>): void
        on(name: DeviceInitializedEvent, handler: DeviceInitializedCallback): this
    }

    export class MerossCloudDevice extends EventEmitter {
        connect(): void
        disconnect(force: boolean): void
        publishMessage(method: 'GET' | 'SET', namespace: string, payload: any, callback?: Callback<any>): number

        getSystemAllData(callback: Callback<any>): number
        getSystemDebug(callback: Callback<any>): number
        getSystemAbilities(callback: Callback<any>): number
        getSystemReport(callback: Callback<any>): number
        getSystemRuntime(callback: Callback<any>): number
        getSystemDNDMode(callback: Callback<any>): number
        getOnlineStatus(callback: Callback<any>): number
        getConfigWifiList(callback: Callback<any>): number
        getConfigTrace(callback: Callback<any>): number
        getControlPowerConsumption(callback: Callback<any>): number
        getControlPowerConsumptionX(callback: Callback<GetControlPowerConsumptionXResponse>): number
        getControlElectricity(callback: Callback<GetControlElectricityResponse>): number
        getRollerShutterState(callback: Callback<any>): number
        getRollerShutterPosition(callback: Callback<any>): number

        controlToggle(onoff: boolean, callback: Callback<any>): number
        controlToggleX(channel: number, onoff: boolean, callback: Callback<any>): number
        controlSpray(channel: number, mode: number, callback: Callback<any>): number
        controlRollerShutterUp(channel: number, callback: Callback<any>): number
        controlRollerShutterDown(channel: number, callback: Callback<any>): number
        controlRollerShutterStop(channel: number, callback: Callback<any>): number
        controlGarageDoor(channel: number, open: boolean, callback: Callback<any>): number
        controlLight(light: LightData, callback: Callback<any>): number
        controlDiffusorSpray(type: string, channel: number, mode: number, callback: Callback<any>): number
        controlDiffusorLight(type: string, light: LightData, callback: Callback<any>): number
        setSystemDNDMode(onoff: boolean, callback: Callback<any>): number
    }

    export default MerossCloud
}
