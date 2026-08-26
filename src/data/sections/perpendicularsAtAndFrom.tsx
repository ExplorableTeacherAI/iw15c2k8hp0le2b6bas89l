import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const perpendicularsAtAndFromBlocks: ReactElement[] = [
    <StackLayout key="layout-perpendiculars-heading" maxWidth="xl">
        <Block id="perpendiculars-heading" padding="md">
            <EditableH2 id="h2-perpendiculars-heading" blockId="perpendiculars-heading">
                Perpendiculars at a Point and from a Point
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-setup" maxWidth="xl">
        <Block id="perpendiculars-setup" padding="sm">
            <EditableParagraph id="para-perpendiculars-setup" blockId="perpendiculars-setup">
                The same two arcs quietly solve a second problem. Mark a point P on a line, swing
                equal arcs each side of it, and you have built a small segment with P sitting at its
                middle. Bisect that segment and the bisector stands square on the line at P.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-visual" maxWidth="xl">
        <Block id="perpendiculars-visual">
            <VisualOptionCards
                blockId="perpendiculars-visual"
                cards={[
                    {
                        id: "perpendicular-lift-the-point",
                        title: "A long line with a movable point that can sit on the line or float above it",
                        looks: "Imagine a long horizontal line drawn across the page with a teal point on it. The point can be dragged sideways or lifted up off the line, and the arcs, the two marks they cut on the line and the finished upright all redraw themselves as it moves, with a small right-angle square where they meet.",
                        manipulate: "Slide the point along the line, then lift it up above the line and watch the arcs rebuild themselves around it",
                        reveals: "The two perpendicular constructions are really one construction. Where the point sits only changes how the little segment is found, not what is done with it.",
                        paradigm: "conventional",
                        recommended: true,
                    },
                    {
                        id: "perpendicular-build-it-yourself",
                        title: "A bare line and a point above it, with a pair of compasses students place themselves",
                        looks: "Imagine an empty page with one long line and a single point marked above it. A pair of compasses sits beside them: its needle can be dropped anywhere and its opening set by dragging. Every swing leaves an arc on the page, and any two arcs that cross offer a dot a straightedge can join.",
                        manipulate: "Drop the needle where they think it belongs, swing the arcs, and join the crossings to build the perpendicular from scratch",
                        reveals: "Nothing here has to be memorised. Any two points equally far from the pair of marks on the line will give the perpendicular.",
                        paradigm: "constructivist",
                    },
                    {
                        id: "perpendicular-shortest-path-guess",
                        title: "A point above a line with a faint path from it that students tilt before the arcs appear",
                        looks: "Imagine a line with a point above it and a faint straight path hanging from that point down to the line, free to tilt either way. Its length is written along it. Once it is placed, the arcs are drawn and the true perpendicular appears beside the guess, with both lengths shown together.",
                        manipulate: "Tilt the faint path to where they think the shortest route down to the line runs, then reveal the construction beside it",
                        reveals: "The shortest path from a point to a line is the perpendicular one, and the arcs find it without measuring a single angle.",
                        paradigm: "prediction",
                    },
                ]}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-insight" maxWidth="xl">
        <Block id="perpendiculars-insight" padding="sm">
            <EditableParagraph id="para-perpendiculars-insight" blockId="perpendiculars-insight">
                When P sits above the line instead, one arc swung from P cuts the line in two places,
                and those two cuts become the ends of the segment to bisect. Either way the work is
                identical: turn the problem into a segment, then bisect it. One construction, three
                jobs.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
