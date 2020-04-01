import { html } from "@microsoft/fast-element";
import { Slider } from "./slider";
import { ref } from "@microsoft/fast-element/dist/directives";

export const SliderTemplate = html<Slider>`
  <template
    role="slider"
    aria-valuenow="${x => x.value}"
    aria-valuemin="${x => x.min}"
    aria-valuemax="${x => x.max}"
  >
    <div
          part="slider"
          class="slider"
    >
      <div part="layout-region" class="layout-region">
          <div ${ref("track")} part="track-container" class="track">
            <slot name="track"></slot>
          </div>
          <div ${ref("foregroundTrack")} part="foreground-track" class="foreground-track">
            <slot name="foreground-track"></slot>
          </div>
          <div ${ref("thumb")} part="thumb-container" class="thumb-container" style=${x =>
    x.position}>
              <slot name="thumb"><div class="thumb-cursor"></div></slot>
          </div>
          <div ${ref(
              "lowerThumb"
          )} part="lower-thumb-container" class="lower-thumb-container" style=${x =>
    x.lowerPosition}>
              <slot name="lower-thumb"><div class="lower-thumb-cursor"></div></slot>
          </div>
          <div ${ref(
              "upperThumb"
          )} part="upper-thumb-container" class="upper-thumb-container" style=${x =>
    x.upperPosition}>
              <slot name="upper-thumb"><div class="upper-thumb-cursor"></div></slot>
          </div>
          <slot></slot>
      </div>
    </div>
  </template>
`;
