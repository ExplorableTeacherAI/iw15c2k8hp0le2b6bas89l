import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph } from "@/components/atoms";

export const orientPerpendicularBisectorsBlocks: ReactElement[] = [
    <StackLayout key="layout-orient-title" maxWidth="xl">
        <Block id="orient-title" padding="md">
            <EditableH1 id="h1-orient-title" blockId="orient-title">
                Perpendicular Bisectors and Midpoints
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-hook" maxWidth="xl">
        <Block id="orient-hook" padding="sm">
            <EditableParagraph id="para-orient-hook" blockId="orient-hook">
                Before a badminton court can be painted, someone has to find the exact centre of the
                baseline and run a line straight across the court from it. No tape measure is trusted
                with that job. The line has to be exactly halfway along and exactly square to the
                baseline, and a reading of 6.7 metres is never exactly anything.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-promise" maxWidth="xl">
        <Block id="orient-promise" padding="sm">
            <EditableParagraph id="para-orient-promise" blockId="orient-promise">
                Here we do that job with two tools only, a pair of compasses and a straightedge. By
                the end you will be able to cut any line segment exactly in half, find its midpoint,
                and drop a perpendicular onto a line from any point you choose, without measuring
                anything.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-prior-knowledge" maxWidth="xl">
        <Block id="orient-prior-knowledge" padding="sm">
            <EditableParagraph id="para-orient-prior-knowledge" blockId="orient-prior-knowledge">
                You already know that every point on a circle sits the same distance from its centre,
                you can swing an arc of any size you choose, and you can spot a right angle. That is
                everything these constructions need.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-block-1787714885544" maxWidth="xl">
        <Block id="block-1787714885544" padding="sm">
            <EditableParagraph id="para-block-1787714885544" blockId="block-1787714885544"></EditableParagraph>
        </Block>
    </StackLayout>,
];
