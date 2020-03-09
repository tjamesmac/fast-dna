import { html, when } from "@microsoft/fast-element";
import { Slider } from "./slider";
//import { bool } from "../utilities";

export const CheckboxTemplate = html<Slider>`
    <div
        part="slider"
        class="slider"
    >
    <slot name="label">
      <div>${x => x.label}</div>
    </slot>
    <slot name="background-track">
      <div part="background-track"></div>
    </slot>
    <slot name="track">
      <div part="track"></div>
    </slot>
    <slot name="thumb">
      <div part="thumb"></div>
    </slot>
    ${when(
        x => x.childNodes.length,
        html`
        <slot></slot>
    `
    )}
    </div>
`;
