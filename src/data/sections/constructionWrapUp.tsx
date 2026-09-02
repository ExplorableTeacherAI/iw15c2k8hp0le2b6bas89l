import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineFormula,
    InlineHyperlink,
    InlineSpotColor,
} from "@/components/atoms";
import { getVariableInfo, spotColorPropsFromDefinition } from "../variables";

export const constructionWrapUpBlocks: ReactElement[] = [
    <StackLayout key="layout-wrap-up-heading" maxWidth="xl">
        <Block id="wrap-up-heading" padding="md">
            <EditableH2 id="h2-wrap-up-heading" blockId="wrap-up-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrap-up-idea" maxWidth="xl">
        <Block id="wrap-up-idea" padding="sm">
            <EditableParagraph id="para-wrap-up-idea" blockId="wrap-up-idea">
                Every construction here grew from one idea. A point with{" "}
                <InlineFormula
                    latex="\clr{fromA}{PA} = \clr{fromB}{PB}"
                    colorMap={{ fromA: "#8E90F5", fromB: "#AC8BF9" }}
                />{" "}
                has to sit on the{" "}
                <InlineSpotColor
                    varName="keyPerpendicularBisector"
                    {...spotColorPropsFromDefinition(getVariableInfo('keyPerpendicularBisector'))}
                >
                    perpendicular bisector
                </InlineSpotColor>{" "}
                of AB, and a pair of compasses is simply a machine for making two distances equal.
                Two arcs of{" "}
                <InlineSpotColor
                    varName="keyCompassOpening"
                    {...spotColorPropsFromDefinition(getVariableInfo('keyCompassOpening'))}
                >
                    one opening
                </InlineSpotColor>
                , two crossings, one straightedge, and out comes a line that is exactly square and
                exactly halfway, with nothing measured anywhere.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrap-up-next" maxWidth="xl">
        <Block id="wrap-up-next" padding="sm">
            <EditableParagraph id="para-wrap-up-next" blockId="wrap-up-next">
                That is also why the arcs stay on the page. They are the record of the equal
                distances, and without them the finished line is just a line somebody drew. On{" "}
                <InlineHyperlink id="link-wrap-up-bisector" targetBlockId="midpoint-visual">
                    the bisector you built
                </InlineHyperlink>
                , the arcs are still there doing the proving. The same two arcs sit underneath the angle constructions you meet next, where
                60°, 90°, 45° and the rest all start by making two lengths equal and letting the
                compasses do the rest.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
