import { Logger} from 'homebridge';
import { Device } from './device';

import { stringify } from 'qs';
import axios from 'axios';

export class AirControlBaseApi {
  private devices = [];

  private readonly baseUrl = 'https://www.aircontrolbase.com';
  private readonly detailsPath = '/web/userGroup/getDetails';
  private readonly controlPath = '/web/device/control';
  private readonly loginPath = '/web/user/login';
  private userId: string = '';
  private sessionId: string = '';
  private lastUpdateTime: number = 0;

  constructor(readonly log: Logger, readonly email: string,
              readonly password: string,
              readonly avoidRefreshStatusOnUpdateInMs: number) {
  }

  public async login() {
    const loginResponse = await this.executeAPI(this.baseUrl + this.loginPath, undefined, undefined, {
      account: this.email,
      password: this.password,
      avoidRefreshStatusOnUpdateInMs: this.avoidRefreshStatusOnUpdateInMs
    }, false);

    this.log.info('logged in to aircontrolbase');
    this.userId = loginResponse.data.result.id;
    this.sessionId = loginResponse.headers['set-cookie'][0];
  }

  public async controlDevice(control, operation) {
    this.lastUpdateTime = Date.now();
    await this.executeAPI(this.baseUrl + this.controlPath, this.sessionId, this.userId, {
      control,
      operation,
    }, true);
  }

  public async refreshDevices() {
    //If any chance was done from homekit in the last X seconds, don't refresh,
    // as it might not yet been applied bye the device on the server.
    if (this.lastUpdateTime > 0 && Date.now() - this.lastUpdateTime < this.avoidRefreshStatusOnUpdateInMs) {
      return;
    }
    const devicesResponse = await this.executeAPI(this.baseUrl + this.detailsPath, this.sessionId, this.userId, {});
    let allDevices = [];
    if (devicesResponse?.data?.result?.areas) {
      const devicesOnAreas = devicesResponse.data.result.areas;
      devicesOnAreas.forEach((area) => {
        allDevices = allDevices.concat(area.data);
      });
    }
     return allDevices;
  }

  public async executeAPI(url, cookie, userId, data, shouldRetryOnSessionExpired = true) {
    const config = {
      url,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie ? cookie : '',
      }, method: 'post',
      data: userId ? stringify({
        userId: userId,
        control: data.control ? JSON.stringify(data.control) : undefined,
        operation: data.control ? JSON.stringify(data.control) : undefined,
      }) : stringify(data),

    };
    try {
      const apiResponse = await axios.request(config);
      this.log.debug('API Response:', JSON.stringify(apiResponse.data));
      if (apiResponse.data.code === 40018) {
        if (shouldRetryOnSessionExpired) {
          this.log.error('Session expired, logging in again');
          await this.login();
          return this.executeAPI(url, this.sessionId, this.userId, data, false);
        }
      }
      return apiResponse;
    } catch (error) {
      // @ts-ignore
      this.log.error(error);
      throw error;
    }
  }
}