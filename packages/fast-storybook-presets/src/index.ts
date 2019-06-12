import path from "path";
import glob from "glob";

/**
 * Options object to configure the FAST DNA presets
 */
interface FASTDNAPresetOptions {
    designSystemAddon: {
        enabled: boolean;
    };
}

const optionDefaults: FASTDNAPresetOptions = {
    designSystemAddon: {
        enabled: true,
    },
};

export function addons(entry = [], options: FASTDNAPresetOptions): string[] {
    const withDefaults: FASTDNAPresetOptions = { ...optionDefaults, ...options };

    return withDefaults.designSystemAddon.enabled
        ? entry.concat([
              require.resolve("@microsoft/fast-storybook-design-system-addon/register"),
          ])
        : entry;
}

export function entries(entries: any): any {
    return [
        ...entries,
        ...glob.sync("./src/**/*.stories.tsx"),
        path.resolve(__dirname, "./fast-storybook-design-system-addon-setup.js"),
        path.resolve(__dirname, "./global-styles.js"),
    ];
}