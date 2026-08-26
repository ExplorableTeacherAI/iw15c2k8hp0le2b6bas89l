import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const fixedCompassOpeningBlocks: ReactElement[] = [
    <StackLayout key="layout-fixed-opening-heading" maxWidth="xl">
        <Block id="fixed-opening-heading" padding="md">
            <EditableH2 id="h2-fixed-opening-heading" blockId="fixed-opening-heading">
                Why the Compass Opening Must Stay Fixed
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-setup" maxWidth="xl">
        <Block id="fixed-opening-setup" padding="sm">
            <EditableParagraph id="para-fixed-opening-setup" blockId="fixed-opening-setup">
                The recipe is short. Open the compasses wider than half of AB, put the needle on A
                and swing an arc, then move the needle to B and swing another with the same opening.
                The word doing all the work in that sentence is same.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-visual" maxWidth="xl">
        <Block id="fixed-opening-visual">
            <VisualOptionCards
                blockId="fixed-opening-visual"
                cards={[
                    {
                        id: "fixed-opening-two-handles",
                        title: "Two arcs swung from the ends of a segment, each with its own opening",
                        looks: "Imagine a segment with A and B and an arc swung from each end. Each arc has a handle on the page that can be pulled to make just that arc wider or narrower. Where the two arcs cross, dots appear, and a line is drawn through the crossings.",
                        manipulate: "Pull one arc's handle so its opening no longer matches the other, and watch the crossing dots and the line through them swing away",
                        reveals: "Only when both openings are the same does the line through the crossings hit the segment squarely and at its middle.",
                        targetsMisconception: "Students change the compass opening between arcs instead of keeping it fixed",
                        paradigm: "conventional",
                        recommended: true,
                    },
                    {
                        id: "fixed-opening-hit-target",
                        title: "The same two arcs, with the correct line already marked as a faint dashed target",
                        looks: "Imagine a segment where the true perpendicular bisector is already drawn faintly as a dashed line. Two arcs are swung from the ends, their openings set separately, and the solid line through their crossings sits alongside the dashed one so the two can be compared.",
                        manipulate: "Set the two openings so the solid line through the crossings lands exactly on the dashed target",
                        reveals: "Many pairs of openings work, and every single one of them has the two openings equal.",
                        paradigm: "goal",
                    },
                    {
                        id: "fixed-opening-erase-arcs",
                        title: "The construction built one step at a time, with a rubber that can wipe the arcs away",
                        looks: "Imagine a bare segment that builds itself step by step: the first arc appears, then the second, then the two crossing dots, then the finished line. A rubber tool sits beside the page, and using it wipes the arcs off so only the line and the segment are left.",
                        manipulate: "Step through the construction, then rub out the arcs and try to say where the line came from",
                        reveals: "The arcs are the record that the two distances were equal, so rubbing them out throws away the reason the line is correct.",
                        targetsMisconception: "Students rub out the arcs, thinking they are untidy working",
                        paradigm: "temporal",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-insight" maxWidth="xl">
        <Block id="fixed-opening-insight" padding="sm">
            <EditableParagraph id="para-fixed-opening-insight" blockId="fixed-opening-insight">
                With one opening used for both arcs, each crossing point is the same distance from A
                as it is from B, so it has to sit on the bisector. Change the opening between the
                two swings and the crossings drift off the line. The arcs are not untidy working,
                they are the evidence that those distances were equal, so they stay on the page.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
