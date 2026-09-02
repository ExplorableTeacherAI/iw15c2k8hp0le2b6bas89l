import React, { useEffect, useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InlineSpotColor,
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    choicePropsFromDefinition,
    spotColorPropsFromDefinition,
    scrubVarsFromDefinitions,
} from "../variables";

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 340;
const ORIGIN_X = 280;
const ORIGIN_Y = 208;
const PIXELS_PER_CM = 44;

const X_LIMIT = 5.6;
const Y_MAX = 3.2;
const Y_MIN = -2.3;

const MATCH_TOLERANCE = 0.12; // cm difference counted as "equal"
const MARK_SPACING = 0.3; // cm — how far apart new pencil marks must be

const INK = "#334155"; // labels
const INK_STRUCTURE = "#64748B"; // the segment itself
const INK_QUIET = "#CBD5E1"; // end caps
const HANDLE = "#62D0AD"; // teal — the point you drag
const SIDE_A = "#8E90F5"; // indigo — everything measured from A
const SIDE_B = "#AC8BF9"; // violet — everything measured from B
const BISECTOR = "#F8A0CD"; // rose — the pencil marks, which trace the bisector

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const DEFAULT_POINT_X = 2.6;
const DEFAULT_POINT_Y = 1.8;

const toScreenX = (x: number) => ORIGIN_X + x * PIXELS_PER_CM;
const toScreenY = (y: number) => ORIGIN_Y - y * PIXELS_PER_CM;

/** ONE formatter for this quantity — used by the drawing and the prose alike. */
const formatLength = (value: number) => `${value.toFixed(1)} cm`;

// ── The bespoke drawing ──────────────────────────────────────────────────────

function EqualDistanceDrawing() {
    const setVar = useSetVar();
    const pointX = useVar<number>("equalDistancePointX", DEFAULT_POINT_X);
    const pointY = useVar<number>("equalDistancePointY", DEFAULT_POINT_Y);
    const segmentLength = useVar<number>("equalDistanceSegmentLength", 6);
    const marks = useVar<number[]>("equalDistanceMarks", []);
    const highlight = useVar<string>("equalDistanceHighlight", "");

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const marksRef = useRef<number[]>(marks);
    marksRef.current = marks;

    // A new segment deserves a fresh page: clear the marks when AB changes.
    const previousLength = useRef(segmentLength);
    useEffect(() => {
        if (previousLength.current !== segmentLength) {
            previousLength.current = segmentLength;
            setVar("equalDistanceMarks", []);
        }
    }, [segmentLength, setVar]);

    const halfSegment = segmentLength / 2;
    const distanceToA = Math.hypot(pointX + halfSegment, pointY);
    const distanceToB = Math.hypot(pointX - halfSegment, pointY);
    const isEqual = Math.abs(distanceToA - distanceToB) < MATCH_TOLERANCE;

    // Publish both lengths so the formula below the figure can read them live.
    useEffect(() => {
        setVar("equalDistanceToA", Math.round(distanceToA * 100) / 100);
        setVar("equalDistanceToB", Math.round(distanceToB * 100) / 100);
    }, [distanceToA, distanceToB, setVar]);

    // The linked-highlight contract: the target pops, everything else recedes.
    const opacityFor = (id: string) => (highlight && highlight !== id ? 0.35 : 1);
    const isActive = (id: string) => highlight === id;
    const hoverProps = (id: string) => ({
        onPointerEnter: () => setVar("equalDistanceHighlight", id),
        onPointerLeave: () => setVar("equalDistanceHighlight", ""),
    });

    const dropMarkIfEqual = (x: number, y: number) => {
        if (Math.abs(Math.hypot(x + halfSegment, y) - Math.hypot(x - halfSegment, y)) >= MATCH_TOLERANCE) return;
        const existing = marksRef.current;
        for (let index = 0; index < existing.length; index += 2) {
            if (Math.hypot(existing[index] - x, existing[index + 1] - y) < MARK_SPACING) return;
        }
        const updated = [...existing, x, y];
        marksRef.current = updated;
        setVar("equalDistanceMarks", updated);
    };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const rawX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        const rawY = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
        const nextX = clamp((rawX - ORIGIN_X) / PIXELS_PER_CM, -X_LIMIT, X_LIMIT);
        const nextY = clamp((ORIGIN_Y - rawY) / PIXELS_PER_CM, Y_MIN, Y_MAX);
        setVar("equalDistancePointX", nextX);
        setVar("equalDistancePointY", nextY);
        dropMarkIfEqual(nextX, nextY);
    };

    const screenA = { x: toScreenX(-halfSegment), y: toScreenY(0) };
    const screenB = { x: toScreenX(halfSegment), y: toScreenY(0) };
    const screenP = { x: toScreenX(pointX), y: toScreenY(pointY) };

    // Rod labels ride the middle of each rod, clamped so they never leave the frame.
    const labelHalfWidth = 44; // widest label is "PA = 10.6 cm" ≈ 86 units
    const labelX = (from: { x: number }) =>
        clamp((from.x + screenP.x) / 2, 24 + labelHalfWidth, VIEW_WIDTH - 24 - labelHalfWidth);
    const labelY = (from: { y: number }) => (from.y + screenP.y) / 2 - 10;

    const markCount = Math.floor(marks.length / 2);
    const markCountColour = markCount > 0 ? BISECTOR : INK;
    const handleRadius = dragging || hovered ? 12 : 10;

    return (
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block w-full">
            <defs>
                <filter id="equal-distance-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Running count of the marks left behind */}
            <text
                x={24}
                y={32}
                fill={markCountColour}
                fontSize="12"
                textAnchor="start"
                opacity={opacityFor("count")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Pencil marks left behind: ${markCount}`}
            </text>

            {/* The pencil marks the point has dropped */}
            <g opacity={opacityFor("marks")} style={EASE_150}>
                {Array.from({ length: markCount }, (_, index) => (
                    <circle
                        key={`mark-${index}`}
                        cx={toScreenX(marks[index * 2])}
                        cy={toScreenY(marks[index * 2 + 1])}
                        r={3.4}
                        fill={BISECTOR}
                        opacity={0.9}
                    />
                ))}
            </g>

            {/* The segment AB */}
            <g opacity={opacityFor("segment")} style={EASE_150}>
                <line
                    x1={screenA.x}
                    y1={screenA.y}
                    x2={screenB.x}
                    y2={screenB.y}
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <circle cx={screenA.x} cy={screenA.y} r={5} fill={INK_STRUCTURE} />
                <circle cx={screenB.x} cy={screenB.y} r={5} fill={INK_STRUCTURE} />
                <circle cx={screenA.x} cy={screenA.y} r={9} fill="none" stroke={INK_QUIET} strokeWidth="1.5" />
                <circle cx={screenB.x} cy={screenB.y} r={9} fill="none" stroke={INK_QUIET} strokeWidth="1.5" />
                <text x={screenA.x} y={screenA.y + 30} fill={INK} fontSize="13" textAnchor="middle">
                    A
                </text>
                <text x={screenB.x} y={screenB.y + 30} fill={INK} fontSize="13" textAnchor="middle">
                    B
                </text>
            </g>

            {/* Rod to A */}
            <g opacity={opacityFor("distanceToA")} style={EASE_150} {...hoverProps("distanceToA")}>
                {isActive("distanceToA") && (
                    <line
                        x1={screenA.x}
                        y1={screenA.y}
                        x2={screenP.x}
                        y2={screenP.y}
                        stroke={SIDE_A}
                        strokeWidth="9"
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={screenA.x}
                    y1={screenA.y}
                    x2={screenP.x}
                    y2={screenP.y}
                    stroke={SIDE_A}
                    strokeWidth={isActive("distanceToA") ? 3.6 : isEqual ? 3 : 2}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                <text
                    x={labelX(screenA)}
                    y={labelY(screenA)}
                    fill={SIDE_A}
                    fontSize="12"
                    fontWeight={isEqual ? 600 : 400}
                    textAnchor="middle"
                    style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
                >
                    {`PA = ${formatLength(distanceToA)}`}
                </text>
            </g>

            {/* Rod to B */}
            <g opacity={opacityFor("distanceToB")} style={EASE_150} {...hoverProps("distanceToB")}>
                {isActive("distanceToB") && (
                    <line
                        x1={screenB.x}
                        y1={screenB.y}
                        x2={screenP.x}
                        y2={screenP.y}
                        stroke={SIDE_B}
                        strokeWidth="9"
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={screenB.x}
                    y1={screenB.y}
                    x2={screenP.x}
                    y2={screenP.y}
                    stroke={SIDE_B}
                    strokeWidth={isActive("distanceToB") ? 3.6 : isEqual ? 3 : 2}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                <text
                    x={labelX(screenB)}
                    y={labelY(screenB)}
                    fill={SIDE_B}
                    fontSize="12"
                    fontWeight={isEqual ? 600 : 400}
                    textAnchor="middle"
                    style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
                >
                    {`PB = ${formatLength(distanceToB)}`}
                </text>
            </g>

            {/* The draggable point */}
            <g opacity={opacityFor("point")} style={EASE_150}>
                {isEqual && (
                    <circle cx={screenP.x} cy={screenP.y} r={handleRadius + 8} fill={BISECTOR} opacity={0.3} />
                )}
                <circle
                    cx={screenP.x}
                    cy={screenP.y}
                    r={handleRadius}
                    fill={HANDLE}
                    filter="url(#equal-distance-handle-shadow)"
                    style={{ transition: "r 150ms ease" }}
                />
                <circle
                    cx={screenP.x}
                    cy={screenP.y}
                    r={24}
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                />
            </g>
        </svg>
    );
}

function EqualDistanceFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="equal-distance-trail"
            caption="Drag the teal dot around the page. The indigo rod measures PA, the violet rod measures PB, and whenever the two readings match the dot leaves a pink pencil mark behind."
            onReset={() => {
                setVar("equalDistancePointX", DEFAULT_POINT_X);
                setVar("equalDistancePointY", DEFAULT_POINT_Y);
                setVar("equalDistanceMarks", []);
                setVar("equalDistanceHighlight", "");
                setVar("equalDistanceToA", 3.16);
                setVar("equalDistanceToB", 1.98);
            }}
        >
            <EqualDistanceDrawing />
            <InteractionHintSequence
                hintKey="equal-distance-trail-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal dot and hunt for places where the two lengths match",
                        position: { x: "70%", y: "38%" },
                        dragPath: { type: "line", startOffset: { x: 24, y: 0 }, endOffset: { x: -34, y: -18 } },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Section blocks ───────────────────────────────────────────────────────────

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
                from A as it is from B. Drag the teal dot below, and whenever its{" "}
                <InlineLinkedHighlight
                    varName="equalDistanceHighlight"
                    highlightId="distanceToA"
                    color="#8E90F5"
                    bgColor="rgba(142, 144, 245, 0.22)"
                >
                    indigo distance to A
                </InlineLinkedHighlight>{" "}
                matches its{" "}
                <InlineLinkedHighlight
                    varName="equalDistanceHighlight"
                    highlightId="distanceToB"
                    color="#AC8BF9"
                    bgColor="rgba(172, 139, 249, 0.22)"
                >
                    violet distance to B
                </InlineLinkedHighlight>
                , it leaves a pencil mark behind. Collect half a dozen marks and see what shape they
                make.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-visual" maxWidth="xl">
        <Block id="equal-distance-visual" padding="sm" hasVisualization>
            <EqualDistanceFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-formula" maxWidth="xl">
        <Block id="equal-distance-formula" padding="lg">
            <FormulaBlock
                latex="\highlight{distanceToA}{PA} = \val{equalDistanceToA}\,\text{cm} \quad \highlight{distanceToB}{PB} = \val{equalDistanceToB}\,\text{cm} \quad \clr{segment}{AB} = \scrub{equalDistanceSegmentLength}\,\text{cm}"
                colorMap={{ segment: "#A8D5A2" }}
                linkedHighlights={{
                    distanceToA: {
                        varName: "equalDistanceHighlight",
                        color: "#8E90F5",
                        bgColor: "rgba(142, 144, 245, 0.22)",
                    },
                    distanceToB: {
                        varName: "equalDistanceHighlight",
                        color: "#AC8BF9",
                        bgColor: "rgba(172, 139, 249, 0.22)",
                    },
                }}
                variables={{
                    ...scrubVarsFromDefinitions(['equalDistanceSegmentLength', 'equalDistanceToA', 'equalDistanceToB']),
                    equalDistanceToA: { color: "#8E90F5", step: 0.1, formatValue: (value: number) => value.toFixed(1) },
                    equalDistanceToB: { color: "#AC8BF9", step: 0.1, formatValue: (value: number) => value.toFixed(1) },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-insight" maxWidth="xl">
        <Block id="equal-distance-insight" padding="sm">
            <EditableParagraph id="para-equal-distance-insight" blockId="equal-distance-insight">
                The two readings above are the{" "}
                <InlineSpotColor
                    varName="equalDistanceToA"
                    {...spotColorPropsFromDefinition(getVariableInfo('equalDistanceToA'))}
                >
                    indigo PA
                </InlineSpotColor>{" "}
                and the{" "}
                <InlineSpotColor
                    varName="equalDistanceToB"
                    {...spotColorPropsFromDefinition(getVariableInfo('equalDistanceToB'))}
                >
                    violet PB
                </InlineSpotColor>
                , and the pink marks appear exactly where they agree. They sit on one straight line
                that meets AB square on: the{" "}
                <InlineTooltip
                    id="tooltip-equal-distance-bisector"
                    tooltip="The line that cuts a segment into two equal halves and crosses it at a right angle. Every point on it is the same distance from both ends."
                >
                    perpendicular bisector
                </InlineTooltip>
                . Stretch{" "}
                <InlineSpotColor
                    varName="equalDistanceSegmentLength"
                    {...spotColorPropsFromDefinition(getVariableInfo('equalDistanceSegmentLength'))}
                >
                    AB
                </InlineSpotColor>{" "}
                to{" "}
                <InlineScrubbleNumber
                    varName="equalDistanceSegmentLength"
                    {...numberPropsFromDefinition(getVariableInfo('equalDistanceSegmentLength'))}
                    formatValue={(value: number) => `${value} cm`}
                />{" "}
                and a fresh page of marks lines up the very same way, always running{" "}
                <InlineTrigger varName="equalDistancePointX" value={0} icon="zap">
                    straight above the middle
                </InlineTrigger>
                .
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-question-line" maxWidth="xl">
        <Block id="equal-distance-question-line" padding="md">
            <EditableParagraph id="para-equal-distance-question-line" blockId="equal-distance-question-line">
                Here is the same test on paper, with no dot to drag. One point sits 8 cm from A and
                8 cm from B. A second point sits 3.5 cm from A and 3.5 cm from B. The straight line
                drawn through those two points is the{" "}
                <InlineFeedback
                    varName="answer_equal_distance_line"
                    correctValue="perpendicular bisector"
                    position="terminal"
                    successMessage="— exactly. Both points pass the equal-distance test, and every point that passes it lands on that one line"
                    failureMessage="— not quite."
                    hint="Both points are the same distance from A as from B, just like every pencil mark the dot left behind"
                    reviewBlockId="equal-distance-visual"
                    reviewLabel="Look again at the marks"
                >
                    <InlineClozeChoice
                        varName="answer_equal_distance_line"
                        correctAnswer="perpendicular bisector"
                        options={["perpendicular bisector", "midpoint", "longest side", "parallel line"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_equal_distance_line'))}
                    />
                </InlineFeedback>{" "}
                of AB.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-equal-distance-question-tilted" maxWidth="xl">
        <Block id="equal-distance-question-tilted" padding="md">
            <EditableParagraph id="para-equal-distance-question-tilted" blockId="equal-distance-question-tilted">
                Now suppose a line is drawn through the middle of AB but tilted, so it is not square
                to it. Is every point on that tilted line the same distance from A as from B?{" "}
                <InlineFeedback
                    varName="answer_equal_distance_tilted"
                    correctValue="no, only the middle one"
                    position="standalone"
                    successMessage="Exactly. The middle point passes the test, but slide either way along a tilted line and the two lengths drift apart"
                    failureMessage="Not quite!"
                    hint="Passing through the middle is only one of the two things the bisector does"
                    visualizationHint={{
                        blockId: "equal-distance-visual",
                        hintKey: "feedback-equal-distance-tilted",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the teal dot left until the two lengths match",
                                position: { x: "62%", y: "38%" },
                                dragPath: { type: "line", startOffset: { x: 26, y: 0 }, endOffset: { x: -26, y: 0 } },
                                completionVar: "equalDistancePointX",
                                completionValue: 0,
                                completionTolerance: 0.4,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drag straight upward, keeping the lengths matched — watch where the marks go",
                                position: { x: "50%", y: "30%" },
                                dragPath: { type: "line", startOffset: { x: 0, y: 22 }, endOffset: { x: 0, y: -26 } },
                                completionVar: "equalDistancePointY",
                                completionValue: 3,
                                completionTolerance: 1.2,
                            },
                        ],
                        resetVars: { equalDistancePointX: DEFAULT_POINT_X, equalDistancePointY: DEFAULT_POINT_Y },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_equal_distance_tilted"
                        correctAnswer="no, only the middle one"
                        options={["no, only the middle one", "yes, all of them", "no, none of them"]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_equal_distance_tilted'))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
