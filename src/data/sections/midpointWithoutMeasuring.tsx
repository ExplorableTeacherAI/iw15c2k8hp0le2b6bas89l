import React, { useEffect, useRef, useState, type ReactElement } from "react";
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
    InlineSpotColor,
    InlineTooltip,
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    numberPropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    spotColorPropsFromDefinition,
    clozePropsFromDefinition,
    choicePropsFromDefinition,
    scrubVarsFromDefinitions,
} from "../variables";

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 380;
const LINE_Y = 180;
const LEFT_X = 120;
const PIXELS_PER_CM = 44;

const SEGMENT_LENGTH = 7.3; // cm — halving it lands between two millimetre marks
const HALF_SEGMENT = SEGMENT_LENGTH / 2; // 3.65 cm
const ARC_SWEEP = 9; // degrees each side of the crossing, so the arcs stay in frame

const HEIGHT_MIN = 1.2;
const HEIGHT_MAX = 2.8;
const DEFAULT_HEIGHT = 1.9;
const DEFAULT_STEP = 2;

const INK = "#334155";
const INK_QUIET = "#CBD5E1";
const HANDLE = "#62D0AD"; // teal — the crossing point you drag, and the opening it sets
const SIDE_A = "#8E90F5"; // indigo — the arcs swung from A
const SIDE_B = "#AC8BF9"; // violet — the arcs swung from B
const BISECTOR = "#F8A0CD"; // rose — the perpendicular bisector and its right angle
const MIDPOINT = "#62CCF9"; // sky — the midpoint M, the point the construction produces

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const STEP_CAPTIONS: Record<number, string> = {
    1: "The segment AB",
    2: "Arc from A, opened wider than half of AB",
    3: "The same opening, arc from B",
    4: "The arcs cross at P and Q",
    5: "PQ is the perpendicular bisector, cutting AB at M",
};

const toScreenX = (centimetres: number) => LEFT_X + centimetres * PIXELS_PER_CM;
const toScreenY = (centimetres: number) => LINE_Y - centimetres * PIXELS_PER_CM;

/** ONE formatter for every length this figure prints. */
const formatLength = (value: number) => `${value.toFixed(2)} cm`;

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
    // Always sweep in the increasing-angle direction, so the short arc is drawn
    // whichever order the two ends were given in.
    const first = Math.min(fromDegrees, toDegrees);
    const second = Math.max(fromDegrees, toDegrees);
    const start = point(first);
    const end = point(second);
    return `M ${start.x} ${start.y} A ${radiusPx} ${radiusPx} 0 0 0 ${end.x} ${end.y}`;
};

// ── The bespoke drawing ──────────────────────────────────────────────────────

function BisectorConstructionDrawing() {
    const setVar = useSetVar();
    const step = useVar<number>("midpointConstructionStep", DEFAULT_STEP);
    const crossingHeight = useVar<number>("midpointCrossingHeight", DEFAULT_HEIGHT);
    const highlight = useVar<string>("midpointHighlight", "");

    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // One compass opening serves both arcs: it is fixed by where they cross.
    const opening = Math.hypot(HALF_SEGMENT, crossingHeight);

    // Publish it so the formula below the figure can read it live.
    useEffect(() => {
        setVar("midpointOpening", Math.round(opening * 100) / 100);
    }, [opening, setVar]);
    const openingPx = opening * PIXELS_PER_CM;
    const crossingAngle = (Math.atan2(crossingHeight, HALF_SEGMENT) * 180) / Math.PI;

    const pointA = { x: toScreenX(0), y: LINE_Y };
    const pointB = { x: toScreenX(SEGMENT_LENGTH), y: LINE_Y };
    const midX = toScreenX(HALF_SEGMENT);
    const upper = { x: midX, y: toScreenY(crossingHeight) };
    const lower = { x: midX, y: toScreenY(-crossingHeight) };

    const dim = (id: string) => (highlight && highlight !== id ? 0.35 : 1);
    const active = (id: string) => highlight === id;
    const hoverProps = (id: string) => ({
        onPointerEnter: () => setVar("midpointHighlight", id),
        onPointerLeave: () => setVar("midpointHighlight", ""),
    });

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const pointerY = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
        setVar(
            "midpointCrossingHeight",
            clamp((LINE_Y - pointerY) / PIXELS_PER_CM, HEIGHT_MIN, HEIGHT_MAX),
        );
    };

    const arcsFrom = (centre: { x: number; y: number }, facingRight: boolean) => {
        const base = facingRight ? crossingAngle : 180 - crossingAngle;
        const sign = facingRight ? 1 : -1;
        return [
            arcPath(centre.x, centre.y, openingPx, base - sign * ARC_SWEEP, base + sign * ARC_SWEEP),
            arcPath(centre.x, centre.y, openingPx, -base - sign * ARC_SWEEP, -base + sign * ARC_SWEEP),
        ];
    };

    const handleRadius = dragging || hovered ? 12 : 10;

    return (
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block w-full">
            <defs>
                <filter id="bisector-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <text
                x={24}
                y={32}
                fill={HANDLE}
                fontSize="12"
                textAnchor="start"
                opacity={dim("opening")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Compass opening: ${formatLength(opening)}`}
            </text>
            <text
                x={VIEW_WIDTH - 24}
                y={32}
                fill={step >= 5 ? MIDPOINT : INK}
                fontSize="12"
                textAnchor="end"
                opacity={dim("midpoint")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {step >= 5
                    ? `M is at ${formatLength(HALF_SEGMENT)} along AB`
                    : `AB is ${formatLength(SEGMENT_LENGTH)} long`}
            </text>

            {/* Step 1 — the segment itself */}
            <g opacity={dim("segment")} style={EASE_150}>
                <line
                    x1={pointA.x}
                    y1={pointA.y}
                    x2={pointB.x}
                    y2={pointB.y}
                    stroke={INK}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <circle cx={pointA.x} cy={pointA.y} r={5} fill={INK} />
                <circle cx={pointB.x} cy={pointB.y} r={5} fill={INK} />
                <text x={pointA.x} y={pointA.y + 26} fill={INK} fontSize="13" textAnchor="middle">
                    A
                </text>
                <text x={pointB.x} y={pointB.y + 26} fill={INK} fontSize="13" textAnchor="middle">
                    B
                </text>
            </g>

            {/* Step 2 — the arcs swung from A, and the opening that made them */}
            {step >= 2 && (
                <g opacity={dim("arcsFromA")} style={EASE_150} {...hoverProps("arcsFromA")}>
                    <line
                        x1={pointA.x}
                        y1={pointA.y}
                        x2={upper.x}
                        y2={upper.y}
                        stroke={INK_QUIET}
                        strokeWidth="1.4"
                        strokeDasharray="5 6"
                    />
                    {arcsFrom(pointA, true).map((path, index) => (
                        <g key={`arc-a-${index}`}>
                            {active("arcsFromA") && (
                                <path d={path} fill="none" stroke={SIDE_A} strokeWidth="8" opacity={0.28} strokeLinecap="round" />
                            )}
                            <path
                                d={path}
                                fill="none"
                                stroke={SIDE_A}
                                strokeWidth={active("arcsFromA") ? 3 : 1.8}
                                strokeLinecap="round"
                                style={EASE_150}
                            />
                        </g>
                    ))}
                </g>
            )}

            {/* Step 3 — the same opening, swung from B */}
            {step >= 3 && (
                <g opacity={dim("arcsFromB")} style={EASE_150} {...hoverProps("arcsFromB")}>
                    <line
                        x1={pointB.x}
                        y1={pointB.y}
                        x2={upper.x}
                        y2={upper.y}
                        stroke={INK_QUIET}
                        strokeWidth="1.4"
                        strokeDasharray="5 6"
                    />
                    {arcsFrom(pointB, false).map((path, index) => (
                        <g key={`arc-b-${index}`}>
                            {active("arcsFromB") && (
                                <path d={path} fill="none" stroke={SIDE_B} strokeWidth="8" opacity={0.28} strokeLinecap="round" />
                            )}
                            <path
                                d={path}
                                fill="none"
                                stroke={SIDE_B}
                                strokeWidth={active("arcsFromB") ? 3 : 1.8}
                                strokeLinecap="round"
                                style={EASE_150}
                            />
                        </g>
                    ))}
                </g>
            )}

            {/* Step 5 — the bisector through the crossings, and the midpoint */}
            {step >= 5 && (
                <g opacity={dim("bisector")} style={EASE_150} {...hoverProps("bisector")}>
                    {active("bisector") && (
                        <line
                            x1={midX}
                            y1={40}
                            x2={midX}
                            y2={320}
                            stroke={BISECTOR}
                            strokeWidth="10"
                            opacity={0.28}
                            strokeLinecap="round"
                        />
                    )}
                    <line
                        x1={midX}
                        y1={40}
                        x2={midX}
                        y2={320}
                        stroke={BISECTOR}
                        strokeWidth={active("bisector") ? 4 : 2.8}
                        strokeLinecap="round"
                        style={EASE_150}
                    />
                    <path
                        d={`M ${midX + 13} ${LINE_Y} L ${midX + 13} ${LINE_Y - 13} L ${midX} ${LINE_Y - 13}`}
                        fill="none"
                        stroke={BISECTOR}
                        strokeWidth="1.8"
                    />
                </g>
            )}

            {/* Step 4 — the two crossing points */}
            {step >= 4 && (
                <g opacity={dim("crossings")} style={EASE_150}>
                    <circle cx={lower.x} cy={lower.y} r={6} fill={HANDLE} />
                    <text x={lower.x + 16} y={lower.y + 16} fill={INK} fontSize="13" textAnchor="start">
                        Q
                    </text>
                </g>
            )}

            {/* Step 5 — the midpoint M */}
            {step >= 5 && (
                <g opacity={dim("midpoint")} style={EASE_150} {...hoverProps("midpoint")}>
                    {active("midpoint") && <circle cx={midX} cy={LINE_Y} r={13} fill={MIDPOINT} opacity={0.28} />}
                    <circle cx={midX} cy={LINE_Y} r={active("midpoint") ? 7.5 : 6} fill={MIDPOINT} style={EASE_150} />
                    <text x={midX - 14} y={LINE_Y + 26} fill={MIDPOINT} fontSize="13" textAnchor="end">
                        M
                    </text>
                </g>
            )}

            {/* The draggable crossing point: it sets the opening for BOTH arcs at once */}
            {step >= 2 && (
                <g opacity={dim("crossings")} style={EASE_150}>
                    <circle
                        cx={upper.x}
                        cy={upper.y}
                        r={handleRadius}
                        fill={HANDLE}
                        filter="url(#bisector-handle-shadow)"
                        style={{ transition: "r 150ms ease" }}
                    />
                    {step >= 4 && (
                        <text x={upper.x + 18} y={upper.y - 10} fill={INK} fontSize="13" textAnchor="start">
                            P
                        </text>
                    )}
                    <circle
                        cx={upper.x}
                        cy={upper.y}
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
            )}

            <text x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 24} fill={INK} fontSize="12.5" textAnchor="middle">
                {STEP_CAPTIONS[Math.round(step)] ?? STEP_CAPTIONS[1]}
            </text>
        </svg>
    );
}

function BisectorConstructionFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="midpoint-bisector-construction"
            caption="Step through the construction of the perpendicular bisector of AB, then drag the teal crossing point up or down to open both compasses wider at once. The midpoint M stays exactly where it was."
            onReset={() => {
                setVar("midpointConstructionStep", DEFAULT_STEP);
                setVar("midpointCrossingHeight", DEFAULT_HEIGHT);
                setVar("midpointHighlight", "");
                setVar("midpointOpening", Math.round(Math.hypot(HALF_SEGMENT, DEFAULT_HEIGHT) * 100) / 100);
            }}
        >
            <BisectorConstructionDrawing />
            <div className="px-6 pb-5">
                <FigureSlider
                    varName="midpointConstructionStep"
                    label="Construction step"
                    {...numberPropsFromDefinition(getVariableInfo('midpointConstructionStep'))}
                    formatValue={(value: number) => `${Math.round(value)} of 5`}
                />
            </div>
            <InteractionHintSequence
                hintKey="midpoint-bisector-construction-drag"
                steps={[
                    {
                        gesture: "drag-vertical",
                        label: "Drag the teal crossing point up and down",
                        position: { x: "50%", y: "24%" },
                        dragPath: { type: "line", startOffset: { x: 0, y: 20 }, endOffset: { x: 0, y: -22 } },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Section blocks ───────────────────────────────────────────────────────────

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
                A ruler gives a{" "}
                <InlineTooltip
                    id="tooltip-midpoint-word"
                    tooltip="The midpoint of a segment is the one point that splits it into two equal halves."
                >
                    midpoint
                </InlineTooltip>{" "}
                that is nearly right, and nearly is fine for a shelf. It is useless in geometry,
                where the next line of a proof leans on that point being exact. Step through the
                construction below: one{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="arcsFromA"
                    color="#8E90F5"
                    bgColor="rgba(142, 144, 245, 0.22)"
                >
                    indigo pair of arcs from A
                </InlineLinkedHighlight>
                , the same opening swung again as a{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="arcsFromB"
                    color="#AC8BF9"
                    bgColor="rgba(172, 139, 249, 0.22)"
                >
                    violet pair from B
                </InlineLinkedHighlight>
                , then drag the teal crossing point up and down to open both compasses wider at
                once.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-visual" maxWidth="xl">
        <Block id="midpoint-visual" padding="sm" hasVisualization>
            <BisectorConstructionFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-formula" maxWidth="xl">
        <Block id="midpoint-formula" padding="lg">
            <FormulaBlock
                latex="\highlight{opening}{d} = \sqrt{\textcolor{#A8D5A2}{3.65}^2 + \scrub{midpointCrossingHeight}^2} = \val{midpointOpening}\,\text{cm} \quad \highlight{midpoint}{AM} = \highlight{midpoint}{MB}"
                colorMap={{ opening: "#62D0AD", midpoint: "#62CCF9" }}
                linkedHighlights={{
                    opening: {
                        varName: "midpointHighlight",
                        color: "#62D0AD",
                        bgColor: "rgba(98, 208, 173, 0.22)",
                    },
                    midpoint: {
                        varName: "midpointHighlight",
                        color: "#62CCF9",
                        bgColor: "rgba(98, 204, 249, 0.22)",
                    },
                }}
                variables={{
                    ...scrubVarsFromDefinitions(['midpointCrossingHeight', 'midpointOpening']),
                    midpointCrossingHeight: { min: 1.2, max: 2.8, step: 0.05, color: "#62D0AD", formatValue: (value: number) => value.toFixed(2) },
                    midpointOpening: { color: "#62D0AD", step: 0.01, formatValue: (value: number) => value.toFixed(2) },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-insight" maxWidth="xl">
        <Block id="midpoint-insight" padding="sm">
            <EditableParagraph id="para-midpoint-insight" blockId="midpoint-insight">
                The{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="midpoint"
                    color="#62CCF9"
                    bgColor="rgba(98, 204, 249, 0.22)"
                >
                    midpoint M
                </InlineLinkedHighlight>{" "}
                is simply where the{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="bisector"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('midpointHighlight'))}
                >
                    bisector
                </InlineLinkedHighlight>{" "}
                crosses AB, at{" "}
                <InlineSpotColor
                    varName="keySegmentLength"
                    {...spotColorPropsFromDefinition(getVariableInfo('keySegmentLength'))}
                >
                    3.65 cm along a 7.3 cm segment
                </InlineSpotColor>
                . Push the crossings out to{" "}
                <InlineScrubbleNumber
                    varName="midpointCrossingHeight"
                    {...numberPropsFromDefinition(getVariableInfo('midpointCrossingHeight'))}
                    formatValue={(value: number) => `${value.toFixed(1)} cm`}
                />{" "}
                and the{" "}
                <InlineSpotColor
                    varName="midpointOpening"
                    {...spotColorPropsFromDefinition(getVariableInfo('midpointOpening'))}
                >
                    opening d
                </InlineSpotColor>{" "}
                grows with them, yet M does not budge. Jump to the{" "}
                <InlineTrigger varName="midpointConstructionStep" value={5} icon="play">
                    finished bisector
                </InlineTrigger>{" "}
                and read M off: it was never measured, so there was nothing to round.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-question-half" maxWidth="xl">
        <Block id="midpoint-question-half" padding="md">
            <EditableParagraph id="para-midpoint-question-half" blockId="midpoint-question-half">
                A different segment measures 9.5 cm. Its exact middle sits at{" "}
                <InlineFeedback
                    varName="answer_midpoint_exact_half"
                    correctValue={["4.75", "4.75 cm", "4,75"]}
                    position="terminal"
                    successMessage="— yes, and 4.75 cm falls halfway between the 4.7 and 4.8 marks, so a ruler has to round it"
                    failureMessage="— not quite."
                    hint="Halve 9.5 and see whether the answer lands on a millimetre mark"
                >
                    <InlineClozeInput
                        varName="answer_midpoint_exact_half"
                        correctAnswer={["4.75", "4.75 cm", "4,75"]}
                        {...clozePropsFromDefinition(getVariableInfo('answer_midpoint_exact_half'))}
                    />
                </InlineFeedback>{" "}
                cm, a reading no millimetre mark can give you.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-question-why" maxWidth="xl">
        <Block id="midpoint-question-why" padding="md">
            <EditableParagraph id="para-midpoint-question-why" blockId="midpoint-question-why">
                So why is the constructed midpoint exact when a ruler mark is not?{" "}
                <InlineFeedback
                    varName="answer_midpoint_why_exact"
                    correctValue="it comes from two equal distances, not from reading a scale"
                    position="standalone"
                    successMessage="Exactly. Nothing was read off a scale, so there was no rounding to do in the first place"
                    failureMessage="Not quite!"
                    hint="It is not about which tool is better made. Ask what each method actually does"
                    visualizationHint={{
                        blockId: "midpoint-visual",
                        hintKey: "feedback-midpoint-why-exact",
                        label: "Discover it yourself",
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the teal crossing point upward — both arcs swell",
                                position: { x: "50%", y: "24%" },
                                dragPath: { type: "line", startOffset: { x: 0, y: 20 }, endOffset: { x: 0, y: -22 } },
                                completionVar: "midpointCrossingHeight",
                                completionValue: 2.65,
                                completionTolerance: 0.3,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drag it back down — M has not moved a hair",
                                position: { x: "50%", y: "36%" },
                                dragPath: { type: "line", startOffset: { x: 0, y: -20 }, endOffset: { x: 0, y: 22 } },
                                completionVar: "midpointCrossingHeight",
                                completionValue: 1.35,
                                completionTolerance: 0.3,
                            },
                        ],
                        resetVars: {
                            midpointConstructionStep: 5,
                            midpointCrossingHeight: DEFAULT_HEIGHT,
                        },
                    }}
                >
                    <InlineClozeChoice
                        varName="answer_midpoint_why_exact"
                        correctAnswer="it comes from two equal distances, not from reading a scale"
                        options={[
                            "it comes from two equal distances, not from reading a scale",
                            "a pair of compasses is a more accurate tool than a ruler",
                            "the arcs make the segment easier to halve",
                        ]}
                        {...choicePropsFromDefinition(getVariableInfo('answer_midpoint_why_exact'))}
                    />
                </InlineFeedback>
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
