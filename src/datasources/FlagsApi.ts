import {Configuration, User} from '@appflags/common';
import {appflags} from "@appflags/protobuf-types-typescript";
import {util} from "protobufjs";
import {toConfiguration} from "../utils/protobufConverters";

export const getConfiguration = async function(baseUrl: string, key: string, user: User, platformData: appflags.PlatformData, getUpdateAt: number|undefined): Promise<Configuration> {
    const getFlagRequest = appflags.GetFlagRequest.create();
    getFlagRequest.configurationId = key;
    getFlagRequest.getUpdateAt = getUpdateAt;
    getFlagRequest.platformData = platformData;
    getFlagRequest.loadType = getUpdateAt !== undefined ? appflags.ConfigurationLoadType.REALTIME_RELOAD : appflags.ConfigurationLoadType.INITIAL_LOAD;
    getFlagRequest.user = appflags.User.create();
    getFlagRequest.user.key = user.key;

    const encodedArray = appflags.GetFlagRequest.encode(getFlagRequest).finish();
    const encodedRequest = util.base64.encode(encodedArray, 0, encodedArray.length);
    const body = {
        request: encodedRequest
    }

    const url = baseUrl + "/configuration/v1/flags";
    const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });

    const json = await res.json() as { response: string };
    const responseArray = new Uint8Array(util.base64.length(json.response));
    util.base64.decode(json.response, responseArray, 0);
    const getFlagsResponse = appflags.GetFlagsResponse.decode(responseArray);
    return toConfiguration(getFlagsResponse);
}