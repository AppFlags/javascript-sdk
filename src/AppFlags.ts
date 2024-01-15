import {Configuration, User, Flag} from '@appflags/common';
import {EventEmitter} from 'eventemitter3';
const pkg = require("../package.json");

import FlagsUpdateNotifier from './datasources/FlagsUpdateNotifier';
import * as ConfigApi from "./datasources/FlagsApi";
import {InitializationOptions} from "./types/InitializationOptions";
import {getOverridesFromUrl} from "./forcers/UrlParamForcer";
import {getPlatformData} from "./utils/platformUtil";

let initialized = false;
// @ts-ignore
let notifier = null;
let configuration: Configuration|null = null;

const eventBus = new EventEmitter;
const CONFIG_READY_EVENT = 'configReady';

let sdkOverride: string|undefined = undefined;
let sdkVersionOverride: string|undefined = undefined;

export function _setSdk(sdk: string, sdkVersion: string) {
    sdkOverride = sdk;
    sdkVersionOverride = sdkVersion;
}

export function initialize(clientKey: string, user: User, options: InitializationOptions = {}) {
    if (initialized) {
        console.warn("AppFlags is already initialized.");
        return;
    }
    initialized = true;

    const platformData= getPlatformData(sdkOverride || 'javascript', sdkVersionOverride || pkg.version);
    const urls= getUrlConfig(options);

    const retrieveConfig = (getUpdateAt?: number) => {
        ConfigApi.getConfiguration(urls.staticBaseUrl, clientKey, user, platformData, getUpdateAt)
            .then(configuration => receiveConfiguration(configuration));
    }

    // initial configuration load
    retrieveConfig();

    // subscribe to configuration change notifications
    notifier = new FlagsUpdateNotifier(urls.realtimeBaseUrl, clientKey, (published) => retrieveConfig(published));
}

function getUrlConfig(options: InitializationOptions) {
    const baseUrl = options._urlOverride || "https://edge.appflags.net";
    const staticBaseUrl = options._staticUrlOverride || baseUrl;
    const realtimeBaseUrl = options._realtimeUrlOverride || baseUrl;

    return {
        staticBaseUrl: staticBaseUrl,
        realtimeBaseUrl: realtimeBaseUrl
    }
}
function receiveConfiguration (newConfig: Configuration) {
    // apply overrides
    getOverridesFromUrl(newConfig);

    // swap configs
    const oldConfig = configuration;
    configuration = newConfig;

    if (oldConfig === null) {
        eventBus.emit(CONFIG_READY_EVENT);
    } else {
        emitFlagChangedEvents(oldConfig, newConfig);
    }
}

function emitFlagChangedEvents(oldConfig: Configuration, newConfig: Configuration) {
    for (const flag of newConfig.flags) {
        const oldFlag = oldConfig.flags.find(f => f.key === flag.key);
        if (!oldFlag || oldFlag.value != flag.value) {
            eventBus.emit(flag.key, flag);
        }
    }
}

async function getConfiguration() {
    if (configuration === null) {
        await new Promise(resolve => eventBus.once(CONFIG_READY_EVENT, resolve));
    }
    if (configuration === null)  {
        throw Error("Configuration should be initialized");
    }
    return configuration;
}

export async function getFlag(key: string): Promise<Flag> {
    const config = await getConfiguration();
    const flag = config.flags.find(f => f.key === key);
    if (!flag) {
        throw Error(`Flag "${key}" not found`);
    }

    return flag;
}

export type FlagChangedCallback = (flag: Flag) => void

export function onFlagChanged(flagKey: string, callback: FlagChangedCallback ): () => void {
    eventBus.on(flagKey, callback);

    // immediately fire callback
    getFlag(flagKey)
        .then(flag => {
            callback(flag);
        });

    // noinspection UnnecessaryLocalVariableJS
    const unsubscribe = () => eventBus.removeListener(flagKey, callback);
    return unsubscribe;
}
