import { html } from "@microsoft/fast-element";
import { MenuItem, MenuItemRole } from "./menu-item";

export const MenuItemTemplate = html<MenuItem>`
    <template
        role=${x => x.role}
        aria-checked="${x => (x.role !== MenuItemRole.menuitem ? x.checked : void 0)}"
        aria-disabled="${x => x.disabled}"
        @keydown=${(x, c) => x.handleMenuItemKeyDown(c.event as KeyboardEvent)}
        @click=${(x, c) => x.handleMenuItemClick(c.event as MouseEvent)}
    >
        <slot></slot>
    </template>
`;
