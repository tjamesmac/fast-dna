import { css } from "@microsoft/fast-element";
import { display } from "../styles";

export const BadgeStyles = css`
    ${display("inline-block")} :host {
        box-sizing: border-box;
        font-family: var(--body-font);
    }

    .badge {
        border-radius: calc(var(--elevated-corner-radius) * 1px);
        padding: calc(var(--design-unit) * 1.5px);
        ${/* Font size, weight, and line height are temporary - 
            replace when adaptive typography is figured out */ ""} font-size: 12px;
        font-weight: 400px;
        line-height: 18px;
    }

    :host(.circular) .badge {
        border-radius: 100%;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    :host(.small) .badge {
        padding: calc(var(--design-unit) * 1px);
        ${/* Font size, weight, and line height are temporary - 
            replace when adaptive typography is figured out */ ""} font-size: 10px;
        font-weight: 400px;
        line-height: 16px;
    }

    :host(.circular.small) .badge {
        height: 20px;
        width: 20px;
        padding: 0;
    }

    :host(.medium)) .badge {
        padding: calc(var(--design-unit) * 1.5px);
        ${/* Font size, weight, and line height are temporary - 
            replace when adaptive typography is figured out */ ""} font-size: 12px;
        font-weight: 400px;
        line-height: 18px;
    }

    :host(.circular.medium) .badge {
        height: 26px;
        width: 26px;
        padding: 0;
    }

    :host(.large) .badge {
        padding: calc(var(--design-unit) * 2px);
        ${/* Font size, weight, and line height are temporary - 
            replace when adaptive typography is figured out */ ""} font-size: 14px;
        font-weight: 400px;
        line-height: 20px;
    }

    :host(.circular.large) .badge {
        height: calc(var(--height-number) * 1px);
        width: calc(var(--height-number) * 1px);
        padding: 0;
    }
`;
