import {Configuration, Flag, User} from "@appflags/common";
import {EventEmitter} from "eventemitter3";
import {InitializationOptions} from "./types/InitializationOptions";
import {getPlatformData} from "./utils/platformUtil";
import * as ConfigApi from "./datasources/FlagsApi";
import FlagsUpdateNotifier from "./datasources/FlagsUpdateNotifier";
import {getOverridesFromUrl} from "./forcers/UrlParamForcer";
import {FlagChangedCallback} from "./AppFlags";
import {appflags} from "@appflags/protobuf-types-typescript";
const pkg = require("../package.json");

export class AppFlagsClient {

    private static sdkOverride: string|undefined = undefined;
    private static sdkVersionOverride: string|undefined = undefined;

    public static _setSdk(sdk: string, sdkVersion: string) {
        AppFlagsClient.sdkOverride = sdk;
        AppFlagsClient.sdkVersionOverride = sdkVersion;
    }

    private readonly clientKey: string
    private readonly platformData: appflags.PlatformData
    private readonly edgeUrl: string

    private user: User
    private configuration: Configuration|null = null;

    private readonly eventBus = new EventEmitter;
    private static CONFIG_READY_EVENT = 'configReady';

    // @ts-ignore
    private notifier;

    public constructor(clientKey: string, user: User, options: InitializationOptions = {}) {
        console.log("Using AppFlags class now2")

        this.clientKey = clientKey
        this.user = user

        this.platformData= getPlatformData(AppFlagsClient.sdkOverride || 'javascript', AppFlagsClient.sdkVersionOverride || pkg.version);
        this.edgeUrl = options._urlOverride || "https://edge.appflags.net";

        // initial configuration load
        this.retrieveConfig();

        // subscribe to configuration change notifications
        this.notifier = new FlagsUpdateNotifier(this.edgeUrl, clientKey, (published) => this.retrieveConfig(published));
    }

    private retrieveConfig(getUpdateAt?: number) {
        ConfigApi.getConfiguration(this.edgeUrl, this.clientKey, this.user, this.platformData, getUpdateAt)
            .then(configuration => this.receiveConfiguration(configuration));
    }

    private receiveConfiguration (newConfig: Configuration) {
        // apply overrides
        getOverridesFromUrl(newConfig);

        // swap configs
        const oldConfig = this.configuration;
        this.configuration = newConfig;

        if (oldConfig === null) {
            this.eventBus.emit(AppFlagsClient.CONFIG_READY_EVENT);
        } else {
            this.emitFlagChangedEvents(oldConfig, newConfig);
        }
    }

    private emitFlagChangedEvents(oldConfig: Configuration, newConfig: Configuration) {
        for (const flag of newConfig.flags) {
            const oldFlag = oldConfig.flags.find(f => f.key === flag.key);
            if (!oldFlag || oldFlag.value != flag.value) {
                this.eventBus.emit(flag.key, flag);
            }
        }
    }

    private async getConfiguration() {
        if (this.configuration === null) {
            await new Promise(resolve => this.eventBus.once(AppFlagsClient.CONFIG_READY_EVENT, resolve));
        }
        if (this.configuration === null)  {
            throw Error("Configuration should be initialized");
        }
        return this.configuration;
    }

    public async getFlag(key: string): Promise<Flag> {
        const config = await this.getConfiguration();
        const flag = config.flags.find(f => f.key === key);
        if (!flag) {
            throw Error(`Flag "${key}" not found`);
        }
        return flag;
    }

    public onFlagChanged(flagKey: string, callback: FlagChangedCallback): () => void {
        this.eventBus.on(flagKey, callback);

        // immediately fire callback
        this.getFlag(flagKey)
            .then(flag => {
                callback(flag);
            });

        // noinspection UnnecessaryLocalVariableJS
        const unsubscribe = () => this.eventBus.removeListener(flagKey, callback);
        return unsubscribe;
    }

    public updateUser(user: User) {
        this.user = user
        this.retrieveConfig()
    }
}