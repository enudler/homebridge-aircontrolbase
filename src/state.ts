import {AirControlBaseApi} from './airControlBaseApi';
import {Logger} from 'homebridge';


export class State {
  private devices = [];
  private readonly baseUrl = 'https://www.aircontrolbase.com';
  private readonly detailsPath = '/web/userGroup/getDetails';
  private readonly controlPath = '/web/device/control';

  constructor(readonly log: Logger, private airControlBaseApi: AirControlBaseApi) {
  }

  public async init() {
    await this.refreshDevices();
    setInterval(() => this.refreshDevices(), 60000);
  }

  private async refreshDevices() {
    const updatedDevices = await this.airControlBaseApi.refreshDevices();
    if (updatedDevices) {
      this.devices = updatedDevices;
    }
  }

  public getDevice(id) {
    // @ts-ignore
    const device = this.devices.find(device => device.id === id);
    return device;
  }

  public getDevices() {
    return this.devices;
  }

  async setPower(id, value) {
    const power = value ? 'y' : 'n';
    const deviceData = this.getDevice(id);
    // @ts-ignore
    deviceData.power = power;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      power,
    });
  }

  async setTemp(id, value) {
    const deviceData = this.getDevice(id);
    // @ts-ignore
    deviceData.setTemp = value;
    await this.airControlBaseApi.controlDevice(this.extractRelevantDeviceDataForApi(deviceData), {
      setTemp: value,
    });
  }

  async setMode(id, value) {
    const deviceData = this.getDevice(id);
    // @ts-ignore
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