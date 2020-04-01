import { attr, FastElement, observable, Observable } from "@microsoft/fast-element";
import { FormAssociated } from "../form-associated";
import {
    keyCodeArrowRight,
    keyCodeArrowLeft,
    keyCodeArrowDown,
    keyCodeArrowUp,
} from "@microsoft/fast-web-utilities";
import { convertPixelToPercent } from "./slider-utilities";

export enum SliderMode {
    singleValue = "single-value",
    adjustFromLower = "adjust-from-lower",
    adjustFromUpper = "adjust-from-upper",
    dualThumb = "dual-thumb",
}

export enum SliderOrientation {
    horizontal = "horizontal",
    vertical = "vertical",
}

export class Slider extends FormAssociated<HTMLInputElement> {
    @attr({ attribute: "readonly", mode: "boolean" })
    public readOnly: boolean; // Map to proxy element
    private readOnlyChanged(): void {
        if (this.proxy instanceof HTMLElement) {
            this.proxy.readOnly = this.readOnly;
        }

        this.readOnly
            ? this.classList.add("readonly")
            : this.classList.remove("readonly");
        this.setAttribute("aria-readonly", this.readOnly.toString());
    }

    @observable
    public root: HTMLDivElement;

    @observable
    public track: HTMLDivElement;

    @observable
    public foregroundTrack: HTMLDivElement;

    @observable
    public thumb: HTMLDivElement;

    @observable
    public upperThumb: HTMLDivElement;

    @observable
    public lowerThumb: HTMLDivElement;

    @observable
    public direction: string = "ltr";

    @observable
    public isDragging: boolean = false;

    @observable
    public position: string;
    @observable
    public lowerPosition: string;
    @observable
    public upperPosition: string;
    @observable
    public trackWidth: number = 0;
    @observable
    public trackMinWidth: number = 0;

    /**
     * The element's value to be included in form submission when checked.
     */
    @attr
    public value: string; // Map to proxy element.
    private valueChanged(): void {
        if (Number(this.value) === Number.NaN) {
            this.value = "0";
        }

        if (this.proxy instanceof HTMLElement) {
            this.updateForm();
        }

        const percentage: number =
            this.direction !== "rtl"
                ? (1 - (Number(this.value) / this.max - this.min)) * 100
                : (Number(this.value) / this.max - this.min) * 100;

        this.position = this.isDragging
            ? `right: ${percentage}%; transition: all 0.1s ease;`
            : `right: ${percentage}%; transition: all 0.2s ease;`;

        this.$emit("change");
    }

    /**
     * Min allowed value
     */
    @attr
    public min: number = 0; // Map to proxy element.
    private minChanged(): void {
        if (this.proxy instanceof HTMLElement) {
            this.proxy.min = `${this.min}`;
        }
    }

    /**
     * Max allowed value
     */
    @attr
    public max: number = 10; // Map to proxy element.
    private maxChanged(): void {
        if (this.proxy instanceof HTMLElement) {
            this.proxy.max = `${this.max}`;
        }
    }

    @attr
    public step: number = 1; // Map to proxy element.
    private stepChanged(): void {
        if (this.proxy instanceof HTMLElement) {
            this.proxy.step = `${this.step}`;
        }
    }

    /**
     * Orientation value, horizontal or vertical
     */
    @attr
    public orientation: SliderOrientation = SliderOrientation.horizontal;

    /**
     * mode value, singleValue | dualThumb | adjustFromUpper | adjustFromLower
     */
    @attr
    public mode: SliderMode = SliderMode.singleValue;

    /**
     * Set to true when the component has constructed
     */
    private constructed: boolean = false;
    protected proxy = document.createElement("input");

    constructor() {
        super();

        this.proxy.setAttribute("type", "range");
        this.setAttribute("role", "slider");
        this.setAttribute("tabindex", "0");
        // TODO: marjon find dir the right way
        const dirAttribute = this.parentElement!.attributes["dir"];
        this.direction = dirAttribute ? dirAttribute.value : "ltr";
        this.constructed = true;
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.updateForm();
        this.setupTrackConstraints();
        this.setupListeners();
        this.setupClassForOrientation();
        this.setupDefaultValue();
    }

    public disconnectedCallback(): void {
        this.removeEventListener("keydown", this.keypressHandler);
        this.removeEventListener("mousedown", this.clickHandler);
    }

    protected keypressHandler = (e: KeyboardEvent) => {
        super.keypressHandler(e);
        switch (e.keyCode) {
            case keyCodeArrowRight:
            case keyCodeArrowUp:
                this.increment();
                break;
            case keyCodeArrowLeft:
            case keyCodeArrowDown:
                this.decrement();
                break;
        }
    };

    private setupTrackConstraints = (): void => {
        this.trackWidth = this.track.clientWidth;
        this.trackMinWidth = this.track.getBoundingClientRect().left;
    };

    private setupListeners = (): void => {
        this.addEventListener("keydown", this.keypressHandler);
        this.addEventListener("mousedown", this.clickHandler);
        this.thumb.addEventListener("mousedown", this.handleThumbMouseDown);
    };

    private setupClassForOrientation = (): void => {
        if (this.orientation === SliderOrientation.horizontal) {
            this.root.classList.add("slider-horizontal");
        } else {
            this.root.classList.add("slider-vertical");
        }
    };

    private setupDefaultValue = (): void => {
        if (this.value === "") {
            this.value = `${this.convertToConstrainedValue((this.max - this.min) / 2)}`;
            this.updateForm();
        }
    };

    private updateForm = (): void => {
        this.proxy.value = this.value;
    };

    /**
     *  Handle mouse moves during a thumb drag operation
     */
    private handleThumbMouseDown = (event: MouseEvent): void => {
        if (this.readOnly || this.disabled || event.defaultPrevented) {
            return;
        }
        event.preventDefault();
        (event.target as HTMLElement).focus();
        window.addEventListener("mouseup", this.handleWindowMouseUp);
        window.addEventListener("mousemove", this.handleMouseMove);
        this.isDragging = true;
    };

    /**
     *  Handle mouse moves during a thumb drag operation
     */
    private handleMouseMove = (e: MouseEvent): void => {
        if (this.readOnly || this.disabled || e.defaultPrevented) {
            return;
        }
        // update the value based on current position
        this.value = `${this.calculateNewValue(e.pageX)}`;
        this.updateForm();
    };

    private calculateNewValue = (rawValue: number): number => {
        // update the value based on current position
        const newPosition = convertPixelToPercent(
            rawValue,
            this.trackMinWidth,
            this.trackWidth,
            this.direction
        );
        const newValue: number = (this.max - this.min) * newPosition + this.min;
        return this.convertToConstrainedValue(newValue);
    };

    /**
     * Handle a window mouse up during a drag operation
     */
    private handleWindowMouseUp = (event: MouseEvent): void => {
        this.stopDragging();
    };

    private stopDragging = (): void => {
        this.isDragging = false;
        window.removeEventListener("mouseup", this.handleWindowMouseUp);
        window.removeEventListener("mousemove", this.handleMouseMove);
    };

    private clickHandler = (e: MouseEvent) => {
        if (!this.disabled && !this.readOnly) {
            let trackElement: any = this.shadowRoot!.querySelector(".track");
            this.trackWidth = trackElement.clientWidth;
            if (this.trackWidth === 0) {
                this.trackWidth = 1;
            }
            this.trackMinWidth = trackElement.getBoundingClientRect().left;

            e.preventDefault();
            (e.target as HTMLElement).focus();
            window.addEventListener("mouseup", this.handleWindowMouseUp);
            window.addEventListener("mousemove", this.handleMouseMove);

            this.value = `${this.calculateNewValue(e.pageX)}`;
            this.updateForm();
        }
    };

    private convertToConstrainedValue = (value: number): number => {
        const remainderVal: number = value % Number(this.step);
        const constrainedVal: number =
            remainderVal >= Number(this.step) / 2
                ? value - remainderVal + Number(this.step)
                : value - remainderVal;

        if (constrainedVal < this.min || constrainedVal > this.max) {
            console.log("Error invalid value for slider:", constrainedVal);
            return Number(this.value);
        } else {
            return constrainedVal;
        }
    };

    private increment = (): void => {
        const newVal: number =
            this.direction !== "rtl"
                ? Number(this.value) + Number(this.step)
                : Number(this.value) - Number(this.step);
        const incrementedVal: number = this.convertToConstrainedValue(newVal);
        const incrementedValString: string =
            incrementedVal < Number(this.max) ? `${incrementedVal}` : `${this.max}`;
        this.value = incrementedValString;
        this.updateForm();
    };

    private decrement = (): void => {
        const newVal =
            this.direction !== "rtl"
                ? Number(this.value) - Number(this.step)
                : Number(this.value) + Number(this.step);
        const decrementedVal: number = this.convertToConstrainedValue(newVal);
        const decrementedValString: string =
            decrementedVal > Number(this.min) ? `${decrementedVal}` : `${this.min}`;
        this.value = decrementedValString;
        this.updateForm();
    };
}
