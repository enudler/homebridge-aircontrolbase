import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';

import {AirControlBasePlatform} from './platform';
import {State} from "./state";

export class AirControlBaseAC {
    private service: Service;

    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    private exampleStates = {
        On: false,
        Brightness: 100,
    };

    constructor(
        private readonly platform: AirControlBasePlatform,
        private readonly accessory: PlatformAccessory,
        private readonly state: State
    ) {


        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Midea')
            .setCharacteristic(this.platform.Characteristic.Model, 'AC')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial')

        this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);


        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
            .onSet(this.setTemp.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
            .setProps({
                minValue: 16,
                maxValue: 30,
                minStep: 1
            })
            .onSet(this.setTemp.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
            .setProps({
                minValue: 16,
                maxValue: 30,
                minStep: 1
            })
            .onSet(this.setTemp.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
            .onSet(this.setMode.bind(this));

        setInterval(async () => {
            const device = state.getDevice(accessory.context.device.id)
            if (device === undefined) {
                this.platform.log.info('No data exists for device ' + accessory.context.device.id + ' not going to update it');
                return;
            }
            if (device.power === "n") {
                this.service.updateCharacteristic(this.platform.Characteristic.Active, false);
            } else if (device.power === "y" && device.mode === "heat") {
                this.service.updateCharacteristic(this.platform.Characteristic.Active, true);
                this.service.updateCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature, device.setTemp);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.platform.Characteristic.TargetHeaterCoolerState.HEAT);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.platform.Characteristic.CurrentHeaterCoolerState.HEATING);
            } else if (device.power === "y" && device.mode === "cool") {
                this.service.updateCharacteristic(this.platform.Characteristic.Active, true);
                this.service.updateCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature, device.setTemp);
                this.service.updateCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState, this.platform.Characteristic.TargetHeaterCoolerState.COOL);
                this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.platform.Characteristic.CurrentHeaterCoolerState.COOLING);
            }
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, device.factTemp);
        }, 10000);
    }

    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
     */
    async setOn(value: CharacteristicValue) {
        await this.state.setPower(this.accessory.context.device.id, value)
        this.platform.log.debug('Set Characteristic On ->', value);
    }

    async setTemp(value: CharacteristicValue) {
        await this.state.setTemp(this.accessory.context.device.id, value)
        this.platform.log.debug('Set Characteristic Temp ->', value);
    }

    async setMode(value: CharacteristicValue) {
        // 0 = auto, 1 = heat, 2 = cool
        let mode = 'cool'
        switch (value) {
            case 0 :
                mode = 'auto';
                break;
            case 1:
                mode = 'heat';
                break;
            case 2:
                mode = 'cool';
                break;
        }
        await this.state.setMode(this.accessory.context.device.id, mode)
        this.platform.log.debug('Set Characteristic Mode ->', mode);
    }
}