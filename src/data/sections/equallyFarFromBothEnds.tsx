import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const equallyFarFromBothEndsBlocks: ReactElement[] = [
    <StackLayout key="layout-equal-distance-heading" maxWidth="xl">
        <Block id="equal-distance-heading" padding="md">
            <EditableH2 id="h2-equal-distance-heading" blockId="equal-distance-heading">
                The Point That Is Equally Far From Both Ends
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-setup" maxWidth="xl">
        <Block id="equal-distance-setup" padding="sm">
            <EditableParagraph id="para-equal-distance-setup" blockId="equal-distance-setup">
                Take a line segment with ends A and B, and hunt for a point that is exactly as far
                from A as it is from B. The midpoint is the obvious answer. It is not the only one,
                and the others are what make the whole construction work.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-visual" maxWidth="xl">
        <Block id="equal-distance-visual">
            <VisualOptionCards
                blockId="equal-distance-visual"
                cards={[
                    {
                        id: "equal-distance-trail",
                        title: "A dot above a line segment that leaves a mark whenever it is equally far from both ends",
                        looks: "Imagine a short line across the page with A marked at one end and B at the other. A third dot floats above them, joined to each end by a straight rod, and each rod has its length written beside it. Whenever the two lengths match, the dot leaves a small permanent mark behind.",
                        manipulate: "Drag the floating dot around, find the places where the two lengths match, and keep going until the marks build up into a shape",
                        reveals: "All the points that are equally far from both ends lie on one straight line, and that line crosses the segment at a right angle.",
                        paradigm: "constructivist",
                        recommended: true,
                    },
                    {
                        id: "equal-distance-guess-line",
                        title: "A faint straight line students place across a segment before the distances are checked",
                        looks: "Imagine a line segment with ends A and B, and a faint straight line lying loose on top of the page that can be slid and tilted anywhere. Once it is placed, three test dots ride along it, and each one shows its distance to A beside its distance to B.",
                        manipulate: "Place the faint line where they think every point on it is equally far from both ends, then send the test dots along it to check",
                        reveals: "A line through the middle is not enough. Tilt it even slightly and the pairs of distances stop matching.",
                        targetsMisconception: "Students think any line through the midpoint is the perpendicular bisector",
                        paradigm: "prediction",
                    },
                    {
                        id: "equal-distance-bars",
                        title: "A dot dragged near a segment, with two bars showing its distance to each end",
                        looks: "Imagine a segment with A and B and a dot that can be dragged anywhere on the page. Beside the drawing stand two bars, one for the distance to A and one for the distance to B, and they grow and shrink as the dot moves, going level only at certain places.",
                        manipulate: "Drag the dot around the page and hunt for every position where the two bars are exactly level",
                        reveals: "Equal distance to both ends is a strict test, and the positions that pass it form a straight line rather than a scattered cloud.",
                        paradigm: "comparison",
                        secondView: {
                            shows: "Two bars, the distance from the dot to A and the distance from the dot to B",
                            role: "complementary",
                            syncedBy: "the dragged point position, plus a shared hover highlight linking each bar to its rod in the drawing",
                        },
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-insight" maxWidth="xl">
        <Block id="equal-distance-insight" padding="sm">
            <EditableParagraph id="para-equal-distance-insight" blockId="equal-distance-insight">
                Those points all sit on one straight line, and that line meets AB square on. This is
                the perpendicular bisector: bisector because it cuts AB into two equal halves,
                perpendicular because it crosses at a right angle. So why does a pair of compasses
                find it so easily?
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
