import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const midpointWithoutMeasuringBlocks: ReactElement[] = [
    <StackLayout key="layout-midpoint-heading" maxWidth="xl">
        <Block id="midpoint-heading" padding="md">
            <EditableH2 id="h2-midpoint-heading" blockId="midpoint-heading">
                Finding the Midpoint Without Measuring
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-setup" maxWidth="xl">
        <Block id="midpoint-setup" padding="sm">
            <EditableParagraph id="para-midpoint-setup" blockId="midpoint-setup">
                A ruler gives a midpoint that is nearly right. Nearly is fine for a shelf and useless
                in geometry, where the next line of a proof leans on that point being exact. The
                bisector hands the midpoint over for free: it is simply the place where the new line
                crosses AB.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-visual" maxWidth="xl">
        <Block id="midpoint-visual">
            <VisualOptionCards
                blockId="midpoint-visual"
                cards={[
                    {
                        id: "midpoint-ruler-versus-arcs",
                        title: "A ruler mark and a constructed midpoint on one segment, seen through a magnifier",
                        looks: "Imagine a segment with a ruler laid along it and two dots sitting near its centre: an amber one placed by reading the ruler, and a teal one where the arcs' line crosses. A round magnifying window hovers over the middle and blows the gap up until the two dots pull apart.",
                        manipulate: "Slide the amber dot to where they read the halfway mark to be, then drag the magnifier over the middle to compare it with the constructed dot",
                        reveals: "A ruler midpoint is only as good as the smallest mark on the ruler, while the constructed one is exactly halfway by the way it was made.",
                        targetsMisconception: "Students measure with a ruler and mark the midpoint instead of constructing it",
                        paradigm: "comparison",
                        recommended: true,
                    },
                    {
                        id: "midpoint-fold-test",
                        title: "A line pinned through the midpoint of a segment that students tilt, then fold along",
                        looks: "Imagine a segment with its midpoint already marked and a straight line pinned through that point, free to swing round to any angle. Below sits a copy of the segment that folds along whichever angle the line is at, so one half lands on top of the other, matching or missing.",
                        manipulate: "Swing the line to any angle they like through the midpoint, then fold the copy along it and see whether the halves land on each other",
                        reveals: "Only the line that meets the segment at a right angle folds one half exactly onto the other, so passing through the midpoint is not enough on its own.",
                        targetsMisconception: "Students think any line through the midpoint is the perpendicular bisector",
                        paradigm: "prediction",
                    },
                    {
                        id: "midpoint-plank-cut",
                        title: "A wooden plank with a saw line and the two offcuts drawn underneath",
                        looks: "Imagine a plank lying flat across the page with a saw line that slides along it, and beneath the plank the two pieces it would leave, drawn to their real lengths side by side. A pair of compasses rests beside the plank, ready to swing arcs from each end.",
                        manipulate: "Slide the saw line by eye first, then swing the arcs from each end and move it to where they cross",
                        reveals: "Eye and ruler get close, but only the arcs make the two pieces come out the same length every time.",
                        paradigm: "goal",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-insight" maxWidth="xl">
        <Block id="midpoint-insight" padding="sm">
            <EditableParagraph id="para-midpoint-insight" blockId="midpoint-insight">
                The crossing point is exact precisely because it was never measured. It comes from
                two distances being forced equal, not from reading a scale that gives up at
                millimetres. That is the whole difference between drawing a picture of geometry and
                constructing it.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
