import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 340;
const ORIGIN_X = 280;
const LINE_Y = 230;
const PIXELS_PER_CM = 40;

/** The compass opening from P is always chosen so its arc cuts the line
 *  exactly this far each side of the foot — the same on the line or above it. */
const MARK_DISTANCE = 1.6; // cm
const BISECTOR_RADIUS = 2.4; // cm, wider than MARK_DISTANCE so the arcs cross
const CROSSING_HEIGHT = Math.sqrt(BISECTOR_RADIUS ** 2 - MARK_DISTANCE ** 2); // cm
const BISECTOR_ANGLE = (Math.atan2(CROSSING_HEIGHT, MARK_DISTANCE) * 180) / Math.PI;

const X_LIMIT = 2.6;
const HEIGHT_LIMIT = 3;
const SNAP_TO_LINE = 0.18; // cm — below this the point settles onto the line

const DEFAULT_POINT_X = 0.6;
const DEFAULT_POINT_HEIGHT = 1.9;

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
const ACCENT = "#62D0AD"; // ONE accent: the movable point and the perpendicular it makes

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const toScreenX = (centimetres: number) => ORIGIN_X + centimetres * PIXELS_PER_CM;
const toScreenY = (centimetres: number) => LINE_Y - centimetres * PIXELS_PER_CM;

/** ONE formatter for every length this figure prints. */
const formatLength = (value: number) => `${value.toFixed(1)} cm`;

const arcPath = (
    centreX: number,
    centreY: number,
    radiusPx: number,
    fromDegrees: number,
    toDegrees: number,
) => {
    const point = (degrees: number) => ({
        x: centreX + radiusPx * Math.cos((degrees * Math.PI) / 180),
        y: centreY - radiusPx * Math.sin((degrees * Math.PI) / 180),
    });
    const start = point(fromDegrees);
    const end = point(toDegrees);
    const largeArc = Math.abs(toDegrees - fromDegrees) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radiusPx} ${radiusPx} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

// ── The bespoke drawing ──────────────────────────────────────────────────────

function PerpendicularDrawing() {
    const setVar = useSetVar();
    const pointX = useVar<number>("perpendicularPointX", DEFAULT_POINT_X);
    const pointHeight = useVar<number>("perpendicularPointHeight", DEFAULT_POINT_HEIGHT);
    const highlight = useVar<string>("perpendicularHighlight", "");

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const onTheLine = pointHeight < 0.001;
    // One opening, chosen so the arc always cuts the line the same distance each side.
    const openingFromPoint = Math.sqrt(pointHeight ** 2 + MARK_DISTANCE ** 2);

    const dim = (id: string) => (highlight && highlight !== id ? 0.35 : 1);
    const active = (id: string) => highlight === id;
    const hoverProps = (id: string) => ({
        onPointerEnter: () => setVar("perpendicularHighlight", id),
        onPointerLeave: () => setVar("perpendicularHighlight", ""),
    });

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const pointerX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        const pointerY = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
        const nextX = clamp((pointerX - ORIGIN_X) / PIXELS_PER_CM, -X_LIMIT, X_LIMIT);
        const rawHeight = clamp((LINE_Y - pointerY) / PIXELS_PER_CM, 0, HEIGHT_LIMIT);
        setVar("perpendicularPointX", nextX);
        setVar("perpendicularPointHeight", rawHeight < SNAP_TO_LINE ? 0 : rawHeight);
    };

    const pointScreen = { x: toScreenX(pointX), y: toScreenY(pointHeight) };
    const footScreen = { x: toScreenX(pointX), y: LINE_Y };
    const markLeft = toScreenX(pointX - MARK_DISTANCE);
    const markRight = toScreenX(pointX + MARK_DISTANCE);
    const openingPx = openingFromPoint * PIXELS_PER_CM;

    // The arc from P sweeps through the bottom, a little past each mark.
    const angleToRightMark = -(Math.atan2(pointHeight, MARK_DISTANCE) * 180) / Math.PI;
    const angleToLeftMark = -180 - angleToRightMark;
    const arcFromPoint = arcPath(
        pointScreen.x,
        pointScreen.y,
        openingPx,
        angleToLeftMark - 12,
        angleToRightMark + 12,
    );

    const bisectorRadiusPx = BISECTOR_RADIUS * PIXELS_PER_CM;
    const handleRadius = dragging || hovered ? 12 : 10;

    return (
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block w-full">
            <defs>
                <filter id="perpendicular-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <text
                x={24}
                y={32}
                fill={INK}
                fontSize="12"
                textAnchor="start"
                opacity={dim("pointP")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {onTheLine ? "P sits on the line" : `P is ${formatLength(pointHeight)} above the line`}
            </text>
            <text
                x={VIEW_WIDTH - 24}
                y={32}
                fill={INK}
                fontSize="12"
                textAnchor="end"
                opacity={dim("marksOnLine")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Each mark is ${formatLength(MARK_DISTANCE)} from the foot`}
            </text>

            {/* the line itself */}
            <g opacity={dim("baseLine")} style={EASE_150}>
                <line
                    x1={30}
                    y1={LINE_Y}
                    x2={VIEW_WIDTH - 30}
                    y2={LINE_Y}
                    stroke={INK}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
            </g>

            {/* the arc swung from P, cutting the line in two places */}
            <g opacity={dim("arcFromPoint")} style={EASE_150} {...hoverProps("arcFromPoint")}>
                {active("arcFromPoint") && (
                    <path d={arcFromPoint} fill="none" stroke={ACCENT} strokeWidth="8" opacity={0.28} strokeLinecap="round" />
                )}
                <path
                    d={arcFromPoint}
                    fill="none"
                    stroke={active("arcFromPoint") ? ACCENT : INK_STRUCTURE}
                    strokeWidth={active("arcFromPoint") ? 3 : 1.8}
                    strokeLinecap="round"
                    style={EASE_150}
                />
            </g>

            {/* the short bisector arcs from each mark */}
            <g opacity={dim("bisectorArcs")} style={EASE_150}>
                {[
                    { centre: markLeft, from: BISECTOR_ANGLE - 7, to: BISECTOR_ANGLE + 7 },
                    { centre: markLeft, from: -BISECTOR_ANGLE - 7, to: -BISECTOR_ANGLE + 7 },
                    { centre: markRight, from: 180 - BISECTOR_ANGLE - 7, to: 180 - BISECTOR_ANGLE + 7 },
                    { centre: markRight, from: -180 + BISECTOR_ANGLE - 7, to: -180 + BISECTOR_ANGLE + 7 },
                ].map((arc, index) => (
                    <path
                        key={`bisector-arc-${index}`}
                        d={arcPath(arc.centre, LINE_Y, bisectorRadiusPx, arc.from, arc.to)}
                        fill="none"
                        stroke={INK_QUIET}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                ))}
            </g>

            {/* the two marks the arc cut on the line */}
            <g opacity={dim("marksOnLine")} style={EASE_150} {...hoverProps("marksOnLine")}>
                {active("marksOnLine") && (
                    <>
                        <circle cx={markLeft} cy={LINE_Y} r={12} fill={ACCENT} opacity={0.28} />
                        <circle cx={markRight} cy={LINE_Y} r={12} fill={ACCENT} opacity={0.28} />
                    </>
                )}
                <circle cx={markLeft} cy={LINE_Y} r={active("marksOnLine") ? 6.5 : 5} fill={INK} style={EASE_150} />
                <circle cx={markRight} cy={LINE_Y} r={active("marksOnLine") ? 6.5 : 5} fill={INK} style={EASE_150} />
                <text x={markLeft} y={LINE_Y + 24} fill={INK} fontSize="12.5" textAnchor="middle">
                    M₁
                </text>
                <text x={markRight} y={LINE_Y + 24} fill={INK} fontSize="12.5" textAnchor="middle">
                    M₂
                </text>
            </g>

            {/* the perpendicular through the crossings */}
            <g opacity={dim("perpendicular")} style={EASE_150} {...hoverProps("perpendicular")}>
                {active("perpendicular") && (
                    <line
                        x1={footScreen.x}
                        y1={100}
                        x2={footScreen.x}
                        y2={312}
                        stroke={ACCENT}
                        strokeWidth="10"
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={footScreen.x}
                    y1={100}
                    x2={footScreen.x}
                    y2={312}
                    stroke={ACCENT}
                    strokeWidth={active("perpendicular") ? 4 : 2.8}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                <circle cx={footScreen.x} cy={toScreenY(CROSSING_HEIGHT)} r={4.5} fill={ACCENT} />
                <circle cx={footScreen.x} cy={toScreenY(-CROSSING_HEIGHT)} r={4.5} fill={ACCENT} />
                <path
                    d={`M ${footScreen.x + 13} ${LINE_Y} L ${footScreen.x + 13} ${LINE_Y - 13} L ${footScreen.x} ${LINE_Y - 13}`}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="1.8"
                />
                <text x={footScreen.x - 13} y={LINE_Y + 24} fill={INK} fontSize="12.5" textAnchor="end">
                    F
                </text>
            </g>

            {/* the movable point */}
            <g opacity={dim("pointP")} style={EASE_150}>
                <circle
                    cx={pointScreen.x}
                    cy={pointScreen.y}
                    r={handleRadius}
                    fill={ACCENT}
                    filter="url(#perpendicular-handle-shadow)"
                    style={{ transition: "r 150ms ease" }}
                />
                <text x={pointScreen.x + 20} y={pointScreen.y - 12} fill={INK} fontSize="13" textAnchor="start">
                    P
                </text>
                <circle
                    cx={pointScreen.x}
                    cy={pointScreen.y}
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

function PerpendicularFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="perpendicular-lift-the-point"
            caption="Drag the teal point P along the line, then lift it clear of the line. The arc from P, the two marks it cuts and the upright through them all rebuild themselves as P moves."
            onReset={() => {
                setVar("perpendicularPointX", DEFAULT_POINT_X);
                setVar("perpendicularPointHeight", DEFAULT_POINT_HEIGHT);
                setVar("perpendicularHighlight", "");
            }}
        >
            <PerpendicularDrawing />
            <InteractionHintSequence
                hintKey="perpendicular-lift-the-point-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag P down onto the line, then lift it back up",
                        position: { x: "54%", y: "45%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: -18 }, endOffset: { x: 0, y: 24 } },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Section blocks ───────────────────────────────────────────────────────────

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
                The same two arcs quietly solve a second problem. Below, an arc swung from the teal
                point P cuts the line at{" "}
                <InlineLinkedHighlight
                    varName="perpendicularHighlight"
                    highlightId="marksOnLine"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('perpendicularHighlight'))}
                >
                    two marks
                </InlineLinkedHighlight>
                , and bisecting those marks gives the{" "}
                <InlineLinkedHighlight
                    varName="perpendicularHighlight"
                    highlightId="perpendicular"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('perpendicularHighlight'))}
                >
                    upright through them
                </InlineLinkedHighlight>
                . Drag P along the line, lift it clear, and watch what refuses to change.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-visual" maxWidth="xl">
        <Block id="perpendiculars-visual" padding="sm" hasVisualization>
            <PerpendicularFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-insight" maxWidth="xl">
        <Block id="perpendiculars-insight" padding="sm">
            <EditableParagraph id="para-perpendiculars-insight" blockId="perpendiculars-insight">
                Lift P to{" "}
                <InlineScrubbleNumber
                    varName="perpendicularPointHeight"
                    {...numberPropsFromDefinition(getVariableInfo('perpendicularPointHeight'))}
                    formatValue={(value: number) => `${value.toFixed(1)} cm`}
                />{" "}
                and the arc has to reach further, yet M₁ and M₂ stay the same distance from the foot
                and the corner stays square. Set P back down on the line and nothing changes except
                how those two marks were found. One construction, three jobs.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-question-foot" maxWidth="xl">
        <Block id="perpendiculars-question-foot" padding="md">
            <EditableParagraph id="para-perpendiculars-question-foot" blockId="perpendiculars-question-foot">
                Here is the whole lesson in one sentence. An arc swung from a point P cuts a line at
                M₁ and M₂, and the foot of the perpendicular from P is the{" "}
                <InlineFeedback
                    varName="answer_perpendicular_foot"
                    correctValue={["midpoint", "mid-point", "mid point", "middle"]}
                    position="terminal"
                    successMessage="— yes. P is the same distance from both marks, so P lies on their perpendicular bisector, and the foot is where it crosses"
                    failureMessage="— not quite."
                    hint="M₁ and M₂ were both cut by the same compass opening, so what does that make P to them?"
                    reviewBlockId="equal-distance-visual"
                    reviewLabel="Back to the equal-distance marks"
                >
                    <InlineClozeInput
                        varName="answer_perpendicular_foot"
                        correctAnswer={["midpoint", "mid-point", "mid point", "middle"]}
                        {...clozePropsFromDefinition(getVariableInfo('answer_perpendicular_foot'))}
                    />
                </InlineFeedback>{" "}
                of M₁M₂.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-perpendiculars-question-first-step" maxWidth="xl">
        <Block id="perpendiculars-question-first-step" padding="md">
            <EditableParagraph id="para-perpendiculars-question-first-step" blockId="perpendiculars-question-first-step">
                A point Q already sits on the line, and you need a perpendicular standing at Q. What
                is the first move?{" "}
                <InlineFeedback
                    varName="answer_perpendicular_first_step"
                    correctValue="swing equal arcs each side of Q to make a short segment"
                    position="standalone"
                    successMessage="Exactly. Once Q is the middle of a short segment, bisecting that segment is the whole job"
                    failureMessage="Not quite!"
                    hint="You already know how to raise a perpendicular through the middle of a segment, so make yourself a segment"
                    visualizationHint={{
                        blockId: "perpendiculars-visual",
                        hintKey: "feedback-perpendicular-first-step",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag P down until it settles on the line",
                                position: { x: "54%", y: "45%" },
                                dragPath: { type: "line", startOffset: { x: 0, y: -20 }, endOffset: { x: 0, y: 22 } },
                                completionVar: "perpendicularPointHeight",
                                completionValue: 0,
                                completionTolerance: 0.15,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now slide it along the line — the two marks stay equal either side",
                                position: { x: "54%", y: "68%" },
                                dragPath: { type: "line", startOffset: { x: -22, y: 0 }, endOffset: { x: 22, y: 0 } },
                                completionVar: "perpendicularPointX",
                                completionValue: 2,
                                completionTolerance: 0.8,
                            },
                        ],
                        resetVars: {
                            perpendicularPointX: DEFAULT_POINT_X,
                            perpendicularPointHeight: DEFAULT_POINT_HEIGHT,
                        },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_perpendicular_first_step"
                        correctAnswer="swing equal arcs each side of Q to make a short segment"
                        options={[
                            "swing equal arcs each side of Q to make a short segment",
                            "join Q to the nearer end of the line",
                            "measure a right angle at Q with a protractor",
                        ]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_perpendicular_first_step'))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
