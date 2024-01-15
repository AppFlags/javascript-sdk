import {Configuration} from "@appflags/common";

interface Override {
    key: string,
    value: string
}

const parseOverride = function(s: string): Override {
    const [key, value] = s.split(":");
    return {
        key: key,
        value: value
    }
};

const getOverrides = function(): Override[] {
    // ?appflags_force=test:0,three:B
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = urlSearchParams.getAll("appflags_force");
    const overrides: Override[] = [];
    for (const param of params) {
        const overrideStrings = param.split(",");
        for (const overrideString of overrideStrings) {
            try {
                const override = parseOverride(overrideString);
                overrides.push(override);
            } catch (e) {
                console.warn("Unable to parse AppFlag's override", e);
            }
        }
    }
    return overrides;
};

const applyOverrides = function(config: Configuration, overrides: Override[]) {
    for(const override of overrides) {
        const flag = config.flags.find(f => f.key === override.key);
        if (flag) {
            console.info(`Overriding AppFlag's flag "${flag.key}" from "${flag.value}" to "${override.value}"`);
            flag.value = override.value;
        }
    }
};

export const getOverridesFromUrl = function(config: Configuration) {
    const overrides = getOverrides();
    applyOverrides(config, overrides);
};
