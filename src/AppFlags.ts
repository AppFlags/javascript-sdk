import {AppFlagsClient} from "./AppFlagsClient";
import {Flag} from '@appflags/common';
import {InitializationOptions} from "./types/InitializationOptions";
import {AnonymousUser, AppFlagsUser} from "./types/AppFlagsUser";

export function _setSdk(sdk: string, sdkVersion: string) {
    AppFlagsClient._setSdk(sdk, sdkVersion)
}

export type FlagChangedCallback = (flag: Flag) => void

let INSTANCE: AppFlagsClient|null = null

export function initialize(clientKey: string, user: AppFlagsUser = AnonymousUser, options: InitializationOptions = {}) {
    if (INSTANCE) {
        console.warn("AppFlags is already initialized.");
        return;
    }
    INSTANCE = new AppFlagsClient(clientKey, user, options)
}

function getClient(): AppFlagsClient {
    if (!INSTANCE) {
        throw Error("You must initialize AppFlags before using it.")
    }
    return INSTANCE
}

export async function getFlag(key: string): Promise<Flag> {
    return getClient().getFlag(key)
}

export function onFlagChanged(flagKey: string, callback: FlagChangedCallback): () => void {
    return getClient().onFlagChanged(flagKey, callback)
}

export function identifyUser(user: AppFlagsUser) {
    return getClient().updateUser(user)
}

export function resetUser() {
    return getClient().updateUser(AnonymousUser)
}

