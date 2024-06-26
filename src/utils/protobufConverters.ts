import {Configuration, Flag} from "@appflags/common";
import {appflags} from "@appflags/protobuf-types-typescript";
import {AppFlagsUser} from "../types/AppFlagsUser";

export const toUserProto = (user: AppFlagsUser): appflags.User => {
    const proto = appflags.User.create();
    proto.key = user.key;
    return proto;
}

export const toConfiguration = (getFlagsResponse: appflags.GetFlagsResponse): Configuration => {
    const flags: Flag[] = getFlagsResponse.flags.map(fromFlagProto);
    return {
        flags: flags
    };
}

const fromFlagProto = (proto: appflags.ComputedFlag): Flag => {
    if (proto.key === undefined) {
        throw Error("Computed flag does not have key");
    }
    if (proto.value === undefined) {
        throw Error("Computed flag does not have a value");
    }

    const value = function() {
        if (proto.valueType === appflags.FlagValueType.BOOLEAN) {
            if (proto.value.booleanValue === undefined) {
                throw Error("boolean flag does not have boolean value");
            }
            return proto.value.booleanValue;
        } else if (proto.valueType === appflags.FlagValueType.STRING) {
            if (proto.value.stringValue === undefined) {
                throw Error("string flag does not have string value");
            }
            return proto.value.stringValue;
        } else if (proto.valueType === appflags.FlagValueType.DOUBLE) {
            if (proto.value.doubleValue === undefined) {
                throw Error("double flag does not have double value");
            }
            return proto.value.doubleValue;
        } else {
            throw Error("flag has an unexpected value type")
        }
    }();

    return {
        key: proto.key,
        value: value
    }
}