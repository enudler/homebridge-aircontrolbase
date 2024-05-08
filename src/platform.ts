import {
    API,
    DynamicPlatformPlugin,
    Logger,
    PlatformAccessory,
    PlatformConfig,
    Service,
    Characteristic
} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {AirControlBaseAC} from './platformAccessory';
import {State} from "./state";
import {AirControlBaseApi} from "./airControlBaseApi";


export class AirControlBasePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];
    private readonly state: State;
    private readonly airControlBaseApi: AirControlBaseApi;


    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {


        this.log.debug('Finished initializing platform:', this.config.name);
        this.airControlBaseApi = new AirControlBaseApi(log, this.config.email, this.config.password);
        this.state = new State(log, this.airControlBaseApi);

        // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
        // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
        if (!log.success) {
            log.success = log.info;
        }

        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', async () => {
            log.debug('Executed didFinishLaunching callback');
            await this.airControlBaseApi.login();
            await this.state.init();

            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to set up event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache, so we can track if it has already been registered
        this.accessories.push(accessory);
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    async discoverDevices() {

        let allDevices: any[] = this.state.getDevices(this.config.userId, this.config.cookie);

        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of allDevices) {

            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address
            const uuid = this.api.hap.uuid.generate(device.id.toString());

            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

            if (existingAccessory) {
                // the accessory already exists
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. e.g.:
                // existingAccessory.context.device = device;
                // this.api.updatePlatformAccessories([existingAccessory]);

                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new AirControlBaseAC(this, existingAccessory, this.state);

                // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, e.g.:
                // remove platform accessories when no longer present
                // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            } else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);

                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);

                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;

                // create the accessory handler for the newly create accessory
                // this is imported from `platformAccessory.ts`
                new AirControlBaseAC(this, accessory, this.state);

                // link the accessory to your platform
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
        }
    }
}
