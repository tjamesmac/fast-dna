import { ExpressionContext } from "./interfaces";
import { HTMLTemplate } from "./template";
import { BehaviorFactory } from "./directives/behavior";
import { DOM } from "./dom";
import { BindingDirective } from "./directives/binding";
import { Directive, AttachedBehaviorDirective } from "./directives/directive";

type InlineDirective = BindingDirective | AttachedBehaviorDirective;

const compilationContext = { locatedDirectives: 0, targetIndex: -1 };

export function compileTemplate(
    html: string | HTMLTemplateElement,
    directives: Directive[]
): HTMLTemplate {
    let element: HTMLTemplateElement;

    if (typeof html === "string") {
        element = document.createElement("template");
        element.innerHTML = html;

        const fec = element.content.firstElementChild;

        if (fec !== null && fec.tagName === "TEMPLATE") {
            element = fec as HTMLTemplateElement;
        }
    } else {
        element = html;
    }

    const hostFactories: BehaviorFactory[] = [];

    compilationContext.locatedDirectives = 0;
    compileAttributes(element, directives, hostFactories, true);

    const fragment = element.content;
    const viewFactories: BehaviorFactory[] = [];
    const directiveCount = directives.length;
    const walker = document.createTreeWalker(
        fragment,
        133, // element, text, comment
        null,
        false
    );

    compilationContext.targetIndex = -1;

    while (compilationContext.locatedDirectives < directiveCount) {
        const node = walker.nextNode();

        if (node === null) {
            break;
        }

        compilationContext.targetIndex++;

        switch (node.nodeType) {
            case 1: // element node
                compileAttributes(node as HTMLElement, directives, viewFactories);
                break;
            case 3: // text node
                // use wholeText to retrieve the textContent of all adjacent text nodes.
                const directive = tryParsePlaceholders(
                    (node as Text).wholeText,
                    directives
                ) as BindingDirective;

                if (directive !== null) {
                    node.textContent = " ";
                    directive.makeIntoTextBinding();
                    viewFactories.push(directive);
                    directive.targetIndex = compilationContext.targetIndex;

                    //remove adjacent text nodes.
                    while (node.nextSibling && node.nextSibling.nodeType === 3) {
                        node.parentNode!.removeChild(node.nextSibling);
                    }
                }

                break;
            case 8: // comment
                if (DOM.isMarker(node)) {
                    const directive =
                        directives[DOM.extractDirectiveIndexFromMarker(node)];
                    directive.targetIndex = compilationContext.targetIndex;
                    compilationContext.locatedDirectives++;
                    viewFactories.push(directive);
                } else {
                    node.parentNode!.removeChild(node);
                    compilationContext.targetIndex--;
                }
        }
    }

    return new HTMLTemplate(element, viewFactories, hostFactories);
}

function compileAttributes(
    node: HTMLElement,
    directives: Directive[],
    factories: BehaviorFactory[],
    includeBasicValues: boolean = false
) {
    const attributes = node.attributes;

    for (let i = 0, ii = attributes.length; i < ii; ++i) {
        const attr = attributes[i];
        const attrValue = attr.value;
        let directive = tryParsePlaceholders(attrValue, directives);

        if (directive === null && includeBasicValues) {
            directive = new BindingDirective(x => attrValue);
            directive.targetName = attr.name;
        }

        if (directive !== null) {
            node.removeAttributeNode(attr);
            i--;
            ii--;

            directive.targetIndex = compilationContext.targetIndex;
            factories.push(directive);
        }
    }
}

function tryParsePlaceholders(
    value: string,
    directives: Directive[]
): InlineDirective | null {
    let i = value.indexOf("@{", 0);
    let ii = value.length;
    let char;
    let pos = 0;
    let open = 0;
    let quote = null;
    let interpolationStart;
    let parts: (string | Directive)[] | null;
    let partIndex = 0;

    while (i >= 0 && i < ii - 2) {
        open = 1;
        interpolationStart = i;
        i += 2;

        do {
            char = value[i];
            i++;

            if (char === "'" || char === '"') {
                if (quote === null) {
                    quote = char;
                } else if (quote === char) {
                    quote = null;
                }
                continue;
            }

            if (char === "\\") {
                i++;
                continue;
            }

            if (quote !== null) {
                continue;
            }

            if (char === "{") {
                open++;
            } else if (char === "}") {
                open--;
            }
        } while (open > 0 && i < ii);

        if (open === 0) {
            // lazy allocate array
            parts = parts! || [];
            if (
                value[interpolationStart - 1] === "\\" &&
                value[interpolationStart - 2] !== "\\"
            ) {
                // escaped interpolation
                parts[partIndex] =
                    value.substring(pos, interpolationStart - 1) +
                    value.substring(interpolationStart, i);
                partIndex++;
            } else {
                // standard interpolation
                parts[partIndex] = value.substring(pos, interpolationStart);
                partIndex++;
                let directiveIndex = parseInt(
                    value.substring(interpolationStart + 2, i - 1)
                );
                let directive = directives[directiveIndex];
                parts[partIndex] = directive;
                partIndex++;
            }
            pos = i;
            i = value.indexOf("@{", i);
        } else {
            break;
        }
    }

    // no interpolation.
    if (partIndex === 0) {
        return null;
    }

    // literal.
    parts![partIndex] = value.substr(pos);
    parts = parts!.filter(x => x !== "");

    if (parts.length == 1) {
        compilationContext.locatedDirectives++;
        return parts[0] as InlineDirective;
    }

    let targetName!: string;
    const partCount = parts.length;
    const finalParts = parts!.map(x => {
        if (typeof x === "string") {
            return () => x;
        }

        targetName = (x as BindingDirective).targetName || targetName;
        compilationContext.locatedDirectives++;
        return (x as BindingDirective).expression;
    });

    const expression = (scope: unknown, context: ExpressionContext) => {
        let output = "";

        for (let i = 0; i < partCount; ++i) {
            output += finalParts[i](scope, context);
        }

        return output;
    };

    const binding = new BindingDirective(expression);
    binding.targetName = targetName;
    return binding;
}
