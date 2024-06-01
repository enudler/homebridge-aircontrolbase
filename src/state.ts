import {AirControlBaseApi} from './airControlBaseApi';
import {HAPStatus, HapStatusError, Logger} from 'homebridge';
import {Device, mapWindFromHomeKitToApi} from './device';


export class State {
  private devices: Device[] = [];
  private readonly baseUrl = 'https://www.aircontrolbase.com';
  private readonly detailsPath = '/web/userGroup/getDetails';
  private readonly controlPath = '/web/device/control';

  constructor(readonly log: Logger, private readonly airControlBaseApi: AirControlBaseApi, private readonly refreshDevicesEachMs: number) {
  }

  public async init() {
    await this.refreshDevices();
    setInterval(() => this.refreshDevices(), this.refreshDevicesEachMs);
  }

  private async refreshDevices() {
    const updatedDevices = await this.airControlBaseApi.refreshDevices();
    if (updatedDevices) {
      this.devices = updatedDevices;
    }
  }

  public getDevice(id) : Device {
    const device = this.devices.find(device => device.id === id);
    if (device === undefined) {
      this.log.error('Device not found with id ' + id);
      // @ts-ignore
      throw new HapStatusError(HAPStatus.RESOURCE_DOES_NOT_EXIST);
    }
    return device;
  }

  public getDevices(): Device[] {
    return this.devices;
  }

  async setPower(id, value) {
    const power = value ? 'y' : 'n';
    const deviceData = this.getDevice(id);
    deviceData.power = power;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      power,
    });
  }

  async setRotationSpeed(id, value) {
    const wind = mapWindFromHomeKitToApi(value);
    const deviceData = this.getDevice(id);
    deviceData.wind = wind;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      wind,
    });
  }

  async setTemp(id, value) {
    const deviceData = this.getDevice(id);
    deviceData.setTemp = value;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      setTemp: value,
    });
  }

  async setMode(id, value) {
    const deviceData = this.getDevice(id);
    deviceData.mode = value;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      mode: value,
    });
  }

  private extractRelevantDeviceDataForApi(device) {
    return {
      power: device.power,
      mode: device.mode,
      setTemp: device.setTemp,
      wind: device.wind,
      swing: device.swing,
      lock: device.lock,
      factTemp: device.factTemp,
      modeLockValue: device.modeLockValue,
      coolLockValue: device.coolLockValue,
      heatLockValue: device.heatLockValue,
      windLockValue: device.windLockValue,
      id: device.id,
      unlock: device.unlock,
    };
  }

}