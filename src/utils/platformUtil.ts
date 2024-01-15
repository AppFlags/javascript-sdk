import {appflags} from "@appflags/protobuf-types-typescript";
import UAParser from "ua-parser-js";

export const getPlatformData = (sdk: string, sdkVersion: string): appflags.PlatformData => {
    const uaParser = new UAParser(window.navigator.userAgent);
    const browser = uaParser.getBrowser();

    const platformData = appflags.PlatformData.create();
    platformData.sdk = sdk;
    platformData.sdkType = 'client';
    platformData.sdkVersion = sdkVersion;
    platformData.platform = browser.name;
    platformData.platformVersion = browser.version;
    return platformData;
}