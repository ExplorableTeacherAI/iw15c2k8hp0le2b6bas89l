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
    linkedHighlightPropsFromDefinition,
} from "../variables";

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 360;
const AXIS_Y = 120;
const LEFT_X = 60;
const PIXELS_PER_CM = 60;

const SEGMENT_LENGTH = 7.3; // cm — deliberately not a whole number of millimetres when halved
const TRUE_MIDPOINT = SEGMENT_LENGTH / 2; // 3.65 cm, between two millimetre marks
const ARC_RADIUS = 3.75; // cm — short construction arcs that cross just above and below AB

const LENS_Y = 258;
const LENS_RADIUS = 56;
const MAGNIFICATION = 6;

const DEFAULT_RULER_READING = 3.4;
const DEFAULT_LENS_POSITION = 2.9;
const LENS_MIN = 0.4;
const LENS_MAX = 6.9;
const RULER_MIN = 2.5;
const RULER_MAX = 4.8;

const INK = "#334155";
const INK_STRUCTURE = "#64748B";
const INK_QUIET = "#CBD5E1";
const ACCENT = "#62D0AD"; // the constructed midpoint and its bisector
const RULER_HUE = "#F7B23B"; // the measured mark, the thing being compared against

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const toScreenX = (centimetres: number) => LEFT_X + centimetres * PIXELS_PER_CM;

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
    const start = point(fromDegrees);
    const end = point(toDegrees);
    return `M ${start.x} ${start.y} A ${radiusPx} ${radiusPx} 0 0 0 ${end.x} ${end.y}`;
};

// ── The strip, drawn once at full size and once inside the lens ──────────────

function RulerStrip({
    scale,
    rulerReading,
    highlight,
    withNumbers,
}: {
    scale: number;
    rulerReading: number;
    highlight: string;
    withNumbers: boolean;
}) {
    const dim = (id: string) => (highlight && highlight !== id ? 0.35 : 1);
    const active = (id: string) => highlight === id;

    const minorTicks: number[] = [];
    for (let index = 0; index <= Math.round(SEGMENT_LENGTH * 10); index += 1) {
        minorTicks.push(index / 10);
    }

    return (
        <g>
            {/* the millimetre and centimetre marks */}
            <g opacity={dim("ruler")} style={EASE_150}>
                {minorTicks.map((centimetres) => {
                    const isWhole = Math.abs(centimetres - Math.round(centimetres)) < 0.001;
                    return (
                        <line
                            key={`tick-${centimetres.toFixed(1)}`}
                            x1={toScreenX(centimetres)}
                            y1={AXIS_Y}
                            x2={toScreenX(centimetres)}
                            y2={AXIS_Y + (isWhole ? 18 : 8) / scale}
                            stroke={isWhole ? INK_STRUCTURE : INK_QUIET}
                            strokeWidth={(isWhole ? 1.6 : 1.2) / scale}
                        />
                    );
                })}
                {withNumbers &&
                    minorTicks
                        .filter((centimetres) => Math.abs(centimetres - Math.round(centimetres)) < 0.001)
                        .map((centimetres) => (
                            <text
                                key={`number-${centimetres}`}
                                x={toScreenX(centimetres)}
                                y={AXIS_Y + 34}
                                fill={INK_STRUCTURE}
                                fontSize="11"
                                textAnchor="middle"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {Math.round(centimetres)}
                            </text>
                        ))}
            </g>

            {/* the segment AB itself */}
            <g opacity={dim("segment")} style={EASE_150}>
                <line
                    x1={toScreenX(0)}
                    y1={AXIS_Y}
                    x2={toScreenX(SEGMENT_LENGTH)}
                    y2={AXIS_Y}
                    stroke={INK}
                    strokeWidth={2.4 / scale}
                    strokeLinecap="round"
                />
                {withNumbers && (
                    <>
                        <text x={toScreenX(0)} y={AXIS_Y - 16} fill={INK} fontSize="13" textAnchor="middle">
                            A
                        </text>
                        <text
                            x={toScreenX(SEGMENT_LENGTH)}
                            y={AXIS_Y - 16}
                            fill={INK}
                            fontSize="13"
                            textAnchor="middle"
                        >
                            B
                        </text>
                    </>
                )}
            </g>

            {/* the constructed midpoint: short arcs, the bisector, and the point itself */}
            <g opacity={dim("constructedMidpoint")} style={EASE_150}>
                {withNumbers && (
                    <>
                        <path
                            d={arcPath(toScreenX(0), AXIS_Y, ARC_RADIUS * PIXELS_PER_CM, 8, 19)}
                            fill="none"
                            stroke={INK_STRUCTURE}
                            strokeWidth={1.6}
                        />
                        <path
                            d={arcPath(toScreenX(0), AXIS_Y, ARC_RADIUS * PIXELS_PER_CM, -19, -8)}
                            fill="none"
                            stroke={INK_STRUCTURE}
                            strokeWidth={1.6}
                        />
                        <path
                            d={arcPath(
                                toScreenX(SEGMENT_LENGTH),
                                AXIS_Y,
                                ARC_RADIUS * PIXELS_PER_CM,
                                161,
                                172,
                            )}
                            fill="none"
                            stroke={INK_STRUCTURE}
                            strokeWidth={1.6}
                        />
                        <path
                            d={arcPath(
                                toScreenX(SEGMENT_LENGTH),
                                AXIS_Y,
                                ARC_RADIUS * PIXELS_PER_CM,
                                -172,
                                -161,
                            )}
                            fill="none"
                            stroke={INK_STRUCTURE}
                            strokeWidth={1.6}
                        />
                    </>
                )}
                {active("constructedMidpoint") && (
                    <line
                        x1={toScreenX(TRUE_MIDPOINT)}
                        y1={AXIS_Y - 62 / scale}
                        x2={toScreenX(TRUE_MIDPOINT)}
                        y2={AXIS_Y + 62 / scale}
                        stroke={ACCENT}
                        strokeWidth={9 / scale}
                        opacity={0.28}
                        strokeLinecap="round"
                    />
                )}
                <line
                    x1={toScreenX(TRUE_MIDPOINT)}
                    y1={AXIS_Y - 62 / scale}
                    x2={toScreenX(TRUE_MIDPOINT)}
                    y2={AXIS_Y + 62 / scale}
                    stroke={ACCENT}
                    strokeWidth={(active("constructedMidpoint") ? 3.6 : 2.4) / scale}
                    strokeLinecap="round"
                    style={EASE_150}
                />
                <circle
                    cx={toScreenX(TRUE_MIDPOINT)}
                    cy={AXIS_Y}
                    r={(active("constructedMidpoint") ? 7 : 5.5) / scale}
                    fill={ACCENT}
                    style={EASE_150}
                />
            </g>

            {/* the ruler mark the student placed */}
            <g opacity={dim("rulerMark")} style={EASE_150}>
                {active("rulerMark") && (
                    <circle
                        cx={toScreenX(rulerReading)}
                        cy={AXIS_Y}
                        r={12 / scale}
                        fill={RULER_HUE}
                        opacity={0.28}
                    />
                )}
                <circle
                    cx={toScreenX(rulerReading)}
                    cy={AXIS_Y}
                    r={(active("rulerMark") ? 7 : 5.5) / scale}
                    fill={RULER_HUE}
                    style={EASE_150}
                />
            </g>
        </g>
    );
}

// ── The bespoke drawing ──────────────────────────────────────────────────────

function MidpointComparisonDrawing() {
    const setVar = useSetVar();
    const rulerReading = useVar<number>("midpointRulerReading", DEFAULT_RULER_READING);
    const lensPosition = useVar<number>("midpointLensPosition", DEFAULT_LENS_POSITION);
    const highlight = useVar<string>("midpointHighlight", "");

    const [dragging, setDragging] = useState<"mark" | "lens" | null>(null);
    const [hovered, setHovered] = useState<"mark" | "lens" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const gap = Math.abs(rulerReading - TRUE_MIDPOINT);
    const lensX = toScreenX(lensPosition);

    const pointerCentimetres = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!svgRef.current) return 0;
        const rect = svgRef.current.getBoundingClientRect();
        const pointerX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        return (pointerX - LEFT_X) / PIXELS_PER_CM;
    };

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging) return;
        const centimetres = pointerCentimetres(event);
        if (dragging === "mark") {
            // The ruler can only ever offer whole millimetres.
            const snapped = Math.round(clamp(centimetres, RULER_MIN, RULER_MAX) * 10) / 10;
            setVar("midpointRulerReading", snapped);
        } else {
            setVar("midpointLensPosition", clamp(centimetres, LENS_MIN, LENS_MAX));
        }
    };

    const dim = (id: string) => (highlight && highlight !== id ? 0.35 : 1);

    return (
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block w-full">
            <defs>
                <clipPath id="midpoint-lens-clip">
                    <circle cx={lensX} cy={LENS_Y} r={LENS_RADIUS} />
                </clipPath>
                <filter id="midpoint-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            <text
                x={24}
                y={32}
                fill={RULER_HUE}
                fontSize="12"
                textAnchor="start"
                opacity={dim("rulerMark")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Ruler mark: ${rulerReading.toFixed(1)} cm`}
            </text>
            <text
                x={VIEW_WIDTH - 24}
                y={32}
                fill={gap < 0.001 ? ACCENT : INK}
                fontSize="12"
                textAnchor="end"
                opacity={dim("constructedMidpoint")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Out by: ${formatLength(gap)}`}
            </text>

            <RulerStrip scale={1} rulerReading={rulerReading} highlight={highlight} withNumbers />

            {/* what the lens is looking at */}
            <line
                x1={lensX}
                y1={AXIS_Y + 44}
                x2={lensX}
                y2={LENS_Y - LENS_RADIUS}
                stroke={INK_QUIET}
                strokeWidth="1.4"
                strokeDasharray="5 6"
            />

            {/* the magnified strip */}
            <g clipPath="url(#midpoint-lens-clip)">
                <circle cx={lensX} cy={LENS_Y} r={LENS_RADIUS} fill="#FFFFFF" />
                <g
                    transform={`translate(${lensX} ${LENS_Y}) scale(${MAGNIFICATION}) translate(${-lensX} ${-AXIS_Y})`}
                >
                    <RulerStrip
                        scale={MAGNIFICATION}
                        rulerReading={rulerReading}
                        highlight={highlight}
                        withNumbers={false}
                    />
                </g>
            </g>
            <circle
                cx={lensX}
                cy={LENS_Y}
                r={LENS_RADIUS}
                fill="none"
                stroke={INK_STRUCTURE}
                strokeWidth={hovered === "lens" || dragging === "lens" ? 3.2 : 2.4}
                style={{ cursor: dragging === "lens" ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging("lens");
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                onPointerEnter={() => setHovered("lens")}
                onPointerLeave={() => setHovered(null)}
            />
            <text x={lensX} y={LENS_Y + LENS_RADIUS + 22} fill={INK_STRUCTURE} fontSize="12" textAnchor="middle">
                magnifier
            </text>

            {/* hovering the constructed bisector lights the bound phrase in the prose */}
            <line
                x1={toScreenX(TRUE_MIDPOINT)}
                y1={AXIS_Y - 62}
                x2={toScreenX(TRUE_MIDPOINT)}
                y2={AXIS_Y + 62}
                stroke="transparent"
                strokeWidth={18}
                onPointerEnter={() => setVar("midpointHighlight", "constructedMidpoint")}
                onPointerLeave={() => setVar("midpointHighlight", "")}
            />

            {/* the grab area for the ruler mark */}
            <circle
                cx={toScreenX(rulerReading)}
                cy={AXIS_Y}
                r={20}
                fill="transparent"
                style={{ cursor: dragging === "mark" ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging("mark");
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                onPointerEnter={() => {
                    setHovered("mark");
                    setVar("midpointHighlight", "rulerMark");
                }}
                onPointerLeave={() => {
                    setHovered(null);
                    setVar("midpointHighlight", "");
                }}
            />
        </svg>
    );
}

function MidpointComparisonFigure() {
    const setVar = useSetVar();
    const rulerReading = useVar<number>("midpointRulerReading", DEFAULT_RULER_READING);
    const moved = Math.abs(rulerReading - DEFAULT_RULER_READING) > 0.001;
    return (
        <Figure
            id="midpoint-ruler-versus-arcs"
            caption="AB is 7.3 cm long. Slide the amber ruler mark to where you read the halfway point, then drag the magnifier over the middle and see how close it really is to the teal point the arcs found."
            onReset={() => {
                setVar("midpointRulerReading", DEFAULT_RULER_READING);
                setVar("midpointLensPosition", DEFAULT_LENS_POSITION);
                setVar("midpointHighlight", "");
            }}
        >
            <MidpointComparisonDrawing />
            <InteractionHintSequence
                hintKey="midpoint-ruler-versus-arcs-drag"
                currentStep={moved ? 1 : 0}
                steps={[
                    {
                        gesture: "drag-horizontal",
                        label: "Slide the amber mark to the halfway point you read",
                        position: { x: "47%", y: "33%" },
                        dragPath: { type: "line", startOffset: { x: -22, y: 0 }, endOffset: { x: 22, y: 0 } },
                    },
                    {
                        gesture: "drag-horizontal",
                        label: "Now drag the magnifier over the middle",
                        position: { x: "42%", y: "72%" },
                        dragPath: { type: "line", startOffset: { x: -24, y: 0 }, endOffset: { x: 24, y: 0 } },
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
                A ruler gives a midpoint that is nearly right, and nearly is fine for a shelf. It is
                useless in geometry, where the next line of a proof leans on that point being exact.
                Slide the{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="rulerMark"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('midpointHighlight'))}
                >
                    amber ruler mark
                </InlineLinkedHighlight>{" "}
                to where you read halfway, then drag the magnifier across and compare it with the{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="constructedMidpoint"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('midpointHighlight'))}
                >
                    teal point the arcs found
                </InlineLinkedHighlight>
                .
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-visual" maxWidth="xl">
        <Block id="midpoint-visual" padding="sm" hasVisualization>
            <MidpointComparisonFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-insight" maxWidth="xl">
        <Block id="midpoint-insight" padding="sm">
            <EditableParagraph id="para-midpoint-insight" blockId="midpoint-insight">
                AB is 7.3 cm long, so its true middle lies at 3.65 cm, in the gap between two
                millimetre marks. Your ruler mark reads{" "}
                <InlineScrubbleNumber
                    varName="midpointRulerReading"
                    {...numberPropsFromDefinition(getVariableInfo('midpointRulerReading'))}
                    formatValue={(value: number) => `${value.toFixed(1)} cm`}
                />{" "}
                and can never quite land there. The constructed point is exact because it was never
                measured: it comes from two distances being forced equal.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-question-half" maxWidth="xl">
        <Block id="midpoint-question-half" padding="md">
            <EditableParagraph id="para-midpoint-question-half" blockId="midpoint-question-half">A different segment measures 9.5 cm. Its exact middle sits at <InlineFeedback varName={"answer_midpoint_exact_half"} correctValue={["4.75", "4.75 cm", "4,75"]} caseSensitive={false} position={"terminal"} successMessage={"— yes, and 4.75 cm falls halfway between the 4.7 and 4.8 marks, so a ruler has to round it"} failureMessage={"— not quite."} hint={"Halve 9.5 and see whether the answer lands on a millimetre mark"} reviewLabel={"Review this concept"}><InlineClozeInput varName={"answer_midpoint_exact_half"} correctAnswer={"4.75 | 4.75 cm | 4,75"} placeholder={"???"} color={"#E53935"} bgColor={"rgba(59, 130, 246, 0.35)"} caseSensitive={false} id={"cloze-1787714988109-m71er"} /></InlineFeedback> cm, a reading no millimetre mark can give you.</EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-question-why" maxWidth="xl">
        <Block id="midpoint-question-why" padding="md">
            <EditableParagraph id="para-midpoint-question-why" blockId="midpoint-question-why">So why is the constructed midpoint exact when the ruler mark is not? <InlineFeedback varName={"answer_midpoint_why_exact"} correctValue={"it comes from two equal distances, not from reading a scale"} caseSensitive={false} position={"standalone"} successMessage={"Exactly. Nothing was read off a scale, so there was no rounding to do in the first place"} failureMessage={"Not quite!"} hint={"It is not about which tool is better made. Ask what each method actually does"} reviewLabel={"Review this concept"} visualizationHint={{"blockId": "midpoint-visual", "hintKey": "feedback-midpoint-why-exact", "label": "Discover it yourself", "steps": [{"gesture": "drag-horizontal", "label": "Slide the amber mark as close to the middle as the millimetre marks allow", "position": {"x": "47%", "y": "33%"}, "dragPath": {"type": "line", "startOffset": {"x": -22, "y": 0}, "endOffset": {"x": 22, "y": 0}}, "completionVar": "midpointRulerReading", "completionValue": 3.65, "completionTolerance": 0.06}, {"gesture": "drag-horizontal", "label": "Now drag the magnifier over the middle — the two marks still do not meet", "position": {"x": "42%", "y": "72%"}, "dragPath": {"type": "line", "startOffset": {"x": -24, "y": 0}, "endOffset": {"x": 24, "y": 0}}, "completionVar": "midpointLensPosition", "completionValue": 3.65, "completionTolerance": 0.3}], "resetVars": {"midpointRulerReading": 3.4, "midpointLensPosition": 2.9}}}><InlineClozeChoice varName={"answer_midpoint_why_exact"} correctAnswer={"it comes from two equal distances, not from reading a scale"} options={["it comes from two equal distances, not from reading a scale", "a pair of compasses is a more accurate tool than a ruler", "the arcs make the segment easier to halve"]} placeholder={"???"} color={"#E53935"} bgColor={"rgba(59, 130, 246, 0.35)"} id={"choice-1787714988109-o02gt"} /></InlineFeedback></EditableParagraph>
        </Block>
    </StackLayout>,
];
