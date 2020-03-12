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
    publishMessage(method: 'GET' | 'SET', namespace: string, payload: any, callback: ErrorCallback): void
    getSystemAllData(callback: Callback<any>): void
    getSystemDebug(callback: Callback<any>): void
    getSystemAbilities(callback: Callback<any>): void
    getSystemReport(callback: Callback<any>): void
    getSystemRuntime(callback: Callback<any>): void
    getSystemDNDMode(callback: Callback<any>): void
    getOnlineStatus(callback: Callback<any>): void
    getConfigWifiList(callback: Callback<any>): void
    getConfigTrace(callback: Callback<any>): void
    getControlPowerConsumption(callback: Callback<any>): void
    getControlPowerConsumptionX(callback: Callback<GetControlPowerConsumptionXResponse>): void
    getControlElectricity(callback: Callback<GetControlElectricityResponse>): void
    
    controlToggle(onoff: boolean, callback: Callback<any>): void
    controlToggleX(channel, onoff: boolean, callback: Callback<any>): void
    controlSpray(channel, mode: number, callback: Callback<any>): void
    controlGarageDoor(channel, open: boolean, callback: Callback<any>): void
    controlLight(light, callback: Callback<any>): void
    setSystemDNDMode(onoff: boolean, callback: Callback<any>): void
  }
  
  export default MerossCloud
}
