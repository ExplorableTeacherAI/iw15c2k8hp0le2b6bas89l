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
    linkedHighlightPropsFromDefinition,
    spotColorPropsFromDefinition,
    choicePropsFromDefinition,
    scrubVarsFromDefinitions,
} from "../variables";

// ── View geometry ────────────────────────────────────────────────────────────

const VIEW_WIDTH = 560;
const VIEW_HEIGHT = 380;
const ORIGIN_X = 280;
const ORIGIN_Y = 190;
const PIXELS_PER_CM = 30;

const SEGMENT_LENGTH = 6; // cm — AB is fixed in this figure
const HALF_SEGMENT = SEGMENT_LENGTH / 2;
const MIN_RADIUS = 2;
const MAX_RADIUS = 5;
const TARGET_TOLERANCE = 0.06; // cm — how close the line must sit to the middle

const DEFAULT_RADIUS_A = 4.2;
const DEFAULT_RADIUS_B = 3.2;

const HANDLE_ANGLE_A = 200; // degrees, measured the usual way from the positive x axis
const HANDLE_ANGLE_B = 340;

const INK = "#334155";
const INK_QUIET = "#CBD5E1";
const HANDLE = "#62D0AD"; // teal — the two handles you drag
const SIDE_A = "#8E90F5"; // indigo — the arc swung from A and its opening
const SIDE_B = "#AC8BF9"; // violet — the arc swung from B and its opening
const BISECTOR = "#F8A0CD"; // rose — the line through the crossings

const EASE_150 = { transition: "opacity 150ms ease, stroke-width 150ms ease" } as const;

const toScreenX = (x: number) => ORIGIN_X + x * PIXELS_PER_CM;
const toScreenY = (y: number) => ORIGIN_Y - y * PIXELS_PER_CM;

/** ONE formatter for every length this figure prints. */
const formatLength = (value: number) => `${value.toFixed(1)} cm`;

const polar = (centreX: number, centreY: number, radiusPx: number, degrees: number) => ({
    x: centreX + radiusPx * Math.cos((degrees * Math.PI) / 180),
    y: centreY - radiusPx * Math.sin((degrees * Math.PI) / 180),
});

// ── The bespoke drawing ──────────────────────────────────────────────────────

function ArcOpeningDrawing() {
    const setVar = useSetVar();
    const radiusA = useVar<number>("fixedOpeningRadiusA", DEFAULT_RADIUS_A);
    const radiusB = useVar<number>("fixedOpeningRadiusB", DEFAULT_RADIUS_B);
    const highlight = useVar<string>("fixedOpeningHighlight", "");

    const [dragging, setDragging] = useState<"A" | "B" | null>(null);
    const [hovered, setHovered] = useState<"A" | "B" | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const centreA = { x: toScreenX(-HALF_SEGMENT), y: toScreenY(0) };
    const centreB = { x: toScreenX(HALF_SEGMENT), y: toScreenY(0) };

    // Where the two arcs cross: subtracting the circle equations gives the x at once.
    const crossingX = (radiusA * radiusA - radiusB * radiusB) / (4 * HALF_SEGMENT);
    const crossingHeightSquared = radiusA * radiusA - (crossingX + HALF_SEGMENT) ** 2;
    const arcsMeet =
        radiusA + radiusB > SEGMENT_LENGTH &&
        Math.abs(radiusA - radiusB) < SEGMENT_LENGTH &&
        crossingHeightSquared > 0;
    const crossingHeight = arcsMeet ? Math.sqrt(crossingHeightSquared) : 0;
    const onTarget = arcsMeet && Math.abs(crossingX) < TARGET_TOLERANCE;

    const opacityFor = (id: string) => (highlight && highlight !== id ? 0.35 : 1);
    const isActive = (id: string) => highlight === id;
    const hoverProps = (id: string) => ({
        onPointerEnter: () => setVar("fixedOpeningHighlight", id),
        onPointerLeave: () => setVar("fixedOpeningHighlight", ""),
    });

    const handlePointerMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!dragging || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const pointerX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
        const pointerY = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
        const centre = dragging === "A" ? centreA : centreB;
        const openingCm = Math.hypot(pointerX - centre.x, pointerY - centre.y) / PIXELS_PER_CM;
        setVar(
            dragging === "A" ? "fixedOpeningRadiusA" : "fixedOpeningRadiusB",
            clamp(openingCm, MIN_RADIUS, MAX_RADIUS),
        );
    };

    const handleA = polar(centreA.x, centreA.y, radiusA * PIXELS_PER_CM, HANDLE_ANGLE_A);
    const handleB = polar(centreB.x, centreB.y, radiusB * PIXELS_PER_CM, HANDLE_ANGLE_B);
    const crossingScreenX = toScreenX(crossingX);
    const lineTop = 55;
    const lineBottom = 325;

    const renderHandle = (
        which: "A" | "B",
        position: { x: number; y: number },
        id: string,
    ) => {
        const lifted = dragging === which || hovered === which;
        return (
            <g opacity={opacityFor(id)} style={EASE_150}>
                <circle
                    cx={position.x}
                    cy={position.y}
                    r={lifted ? 11 : 9}
                    fill={HANDLE}
                    filter="url(#arc-handle-shadow)"
                    style={{ transition: "r 150ms ease" }}
                />
                <circle
                    cx={position.x}
                    cy={position.y}
                    r={24}
                    fill="transparent"
                    style={{ cursor: dragging === which ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(which);
                    }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => setDragging(null)}
                    onPointerCancel={() => setDragging(null)}
                    onPointerEnter={() => {
                        setHovered(which);
                        setVar("fixedOpeningHighlight", id);
                    }}
                    onPointerLeave={() => {
                        setHovered(null);
                        setVar("fixedOpeningHighlight", "");
                    }}
                />
            </g>
        );
    };

    return (
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="block w-full">
            <defs>
                <filter id="arc-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Openings, one readout per arc, colour-matched to its handle */}
            <text
                x={24}
                y={32}
                fill={SIDE_A}
                fontSize="12"
                textAnchor="start"
                opacity={opacityFor("arcFromA")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Opening from A: ${formatLength(radiusA)}`}
            </text>
            <text
                x={VIEW_WIDTH - 24}
                y={32}
                fill={SIDE_B}
                fontSize="12"
                textAnchor="end"
                opacity={opacityFor("arcFromB")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {`Opening from B: ${formatLength(radiusB)}`}
            </text>

            {/* The faint dashed target: the line we are aiming for */}
            <g opacity={opacityFor("target")} style={EASE_150}>
                <line
                    x1={ORIGIN_X}
                    y1={lineTop}
                    x2={ORIGIN_X}
                    y2={lineBottom}
                    stroke={INK_QUIET}
                    strokeWidth="2"
                    strokeDasharray="7 7"
                    strokeLinecap="round"
                />
                <text x={ORIGIN_X} y={lineTop - 10} fill={INK_QUIET} fontSize="12" textAnchor="middle">
                    target
                </text>
            </g>

            {/* The two arcs */}
            <g opacity={opacityFor("arcFromA")} style={EASE_150} {...hoverProps("arcFromA")}>
                {isActive("arcFromA") && (
                    <circle
                        cx={centreA.x}
                        cy={centreA.y}
                        r={radiusA * PIXELS_PER_CM}
                        fill="none"
                        stroke={SIDE_A}
                        strokeWidth="8"
                        opacity={0.28}
                    />
                )}
                <circle
                    cx={centreA.x}
                    cy={centreA.y}
                    r={radiusA * PIXELS_PER_CM}
                    fill="none"
                    stroke={SIDE_A}
                    strokeWidth={isActive("arcFromA") ? 3 : 1.8}
                    style={EASE_150}
                />
            </g>
            <g opacity={opacityFor("arcFromB")} style={EASE_150} {...hoverProps("arcFromB")}>
                {isActive("arcFromB") && (
                    <circle
                        cx={centreB.x}
                        cy={centreB.y}
                        r={radiusB * PIXELS_PER_CM}
                        fill="none"
                        stroke={SIDE_B}
                        strokeWidth="8"
                        opacity={0.28}
                    />
                )}
                <circle
                    cx={centreB.x}
                    cy={centreB.y}
                    r={radiusB * PIXELS_PER_CM}
                    fill="none"
                    stroke={SIDE_B}
                    strokeWidth={isActive("arcFromB") ? 3 : 1.8}
                    style={EASE_150}
                />
            </g>

            {/* The segment AB */}
            <g opacity={opacityFor("segment")} style={EASE_150}>
                <line
                    x1={centreA.x}
                    y1={centreA.y}
                    x2={centreB.x}
                    y2={centreB.y}
                    stroke={INK}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
                <circle cx={centreA.x} cy={centreA.y} r={4.5} fill={INK} />
                <circle cx={centreB.x} cy={centreB.y} r={4.5} fill={INK} />
                <text x={centreA.x} y={centreA.y + 26} fill={INK} fontSize="13" textAnchor="middle">
                    A
                </text>
                <text x={centreB.x} y={centreB.y + 26} fill={INK} fontSize="13" textAnchor="middle">
                    B
                </text>
            </g>

            {/* The line through the crossings — the accent, and the thing being aimed */}
            {arcsMeet && (
                <g opacity={opacityFor("crossingLine")} style={EASE_150} {...hoverProps("crossingLine")}>
                    {(isActive("crossingLine") || onTarget) && (
                        <line
                            x1={crossingScreenX}
                            y1={lineTop}
                            x2={crossingScreenX}
                            y2={lineBottom}
                            stroke={BISECTOR}
                            strokeWidth="10"
                            opacity={0.28}
                            strokeLinecap="round"
                        />
                    )}
                    <line
                        x1={crossingScreenX}
                        y1={lineTop}
                        x2={crossingScreenX}
                        y2={lineBottom}
                        stroke={BISECTOR}
                        strokeWidth={isActive("crossingLine") || onTarget ? 4 : 2.6}
                        strokeLinecap="round"
                        style={EASE_150}
                    />
                    <circle cx={crossingScreenX} cy={toScreenY(crossingHeight)} r={5.5} fill={BISECTOR} />
                    <circle cx={crossingScreenX} cy={toScreenY(-crossingHeight)} r={5.5} fill={BISECTOR} />
                </g>
            )}

            {/* Where the line landed */}
            <text
                x={ORIGIN_X}
                y={VIEW_HEIGHT - 24}
                fill={onTarget ? BISECTOR : INK}
                fontSize="12.5"
                textAnchor="middle"
                opacity={opacityFor("crossingLine")}
                style={{ ...EASE_150, fontVariantNumeric: "tabular-nums" }}
            >
                {!arcsMeet
                    ? "The two arcs never meet — open them wider"
                    : onTarget
                        ? "Landed on the target"
                        : `The line sits ${formatLength(Math.abs(crossingX))} from the middle`}
            </text>

            {renderHandle("A", handleA, "arcFromA")}
            {renderHandle("B", handleB, "arcFromB")}
        </svg>
    );
}

function ArcOpeningFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="fixed-compass-opening"
            caption="Each arc has its own teal handle. Pull them to change one opening at a time, and try to land the pink line through the crossings exactly on the dashed target."
            onReset={() => {
                setVar("fixedOpeningRadiusA", DEFAULT_RADIUS_A);
                setVar("fixedOpeningRadiusB", DEFAULT_RADIUS_B);
                setVar("fixedOpeningHighlight", "");
            }}
        >
            <ArcOpeningDrawing />
            <InteractionHintSequence
                hintKey="fixed-compass-opening-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Pull a handle to change just that arc's opening",
                        position: { x: "13%", y: "61%" },
                        dragPath: { type: "line", startOffset: { x: -18, y: 10 }, endOffset: { x: 22, y: -12 } },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Section blocks ───────────────────────────────────────────────────────────

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
                The recipe is short: swing{" "}
                <InlineLinkedHighlight
                    varName="fixedOpeningHighlight"
                    highlightId="arcFromA"
                    color="#8E90F5"
                    bgColor="rgba(142, 144, 245, 0.22)"
                >
                    one indigo arc from A
                </InlineLinkedHighlight>
                , move the needle to B and swing{" "}
                <InlineLinkedHighlight
                    varName="fixedOpeningHighlight"
                    highlightId="arcFromB"
                    color="#AC8BF9"
                    bgColor="rgba(172, 139, 249, 0.22)"
                >
                    a violet one from B
                </InlineLinkedHighlight>
                . Each arc has its own teal handle, changing only its own{" "}
                <InlineTooltip
                    id="tooltip-fixed-opening-word"
                    tooltip="The opening is how far apart the two legs of the compasses are set. It is the radius of the arc they draw."
                >
                    opening
                </InlineTooltip>
                . See whether you can land the{" "}
                <InlineLinkedHighlight
                    varName="fixedOpeningHighlight"
                    highlightId="crossingLine"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('fixedOpeningHighlight'))}
                >
                    pink line through the crossings
                </InlineLinkedHighlight>{" "}
                exactly on the dashed target.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-visual" maxWidth="xl">
        <Block id="fixed-opening-visual" padding="sm" hasVisualization>
            <ArcOpeningFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-formula" maxWidth="xl">
        <Block id="fixed-opening-formula" padding="lg">
            <FormulaBlock
                latex="\highlight{arcFromA}{r_A} = \scrub{fixedOpeningRadiusA}\,\text{cm} \quad \highlight{arcFromB}{r_B} = \scrub{fixedOpeningRadiusB}\,\text{cm}"
                colorMap={{ arcFromA: "#8E90F5", arcFromB: "#AC8BF9" }}
                linkedHighlights={{
                    arcFromA: {
                        varName: "fixedOpeningHighlight",
                        color: "#8E90F5",
                        bgColor: "rgba(142, 144, 245, 0.22)",
                    },
                    arcFromB: {
                        varName: "fixedOpeningHighlight",
                        color: "#AC8BF9",
                        bgColor: "rgba(172, 139, 249, 0.22)",
                    },
                }}
                variables={scrubVarsFromDefinitions(['fixedOpeningRadiusA', 'fixedOpeningRadiusB'])}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-insight" maxWidth="xl">
        <Block id="fixed-opening-insight" padding="sm">
            <EditableParagraph id="para-fixed-opening-insight" blockId="fixed-opening-insight">
                Every setting that lands on the target has the{" "}
                <InlineSpotColor
                    varName="fixedOpeningRadiusA"
                    {...spotColorPropsFromDefinition(getVariableInfo('fixedOpeningRadiusA'))}
                >
                    opening from A
                </InlineSpotColor>{" "}
                equal to the{" "}
                <InlineSpotColor
                    varName="fixedOpeningRadiusB"
                    {...spotColorPropsFromDefinition(getVariableInfo('fixedOpeningRadiusB'))}
                >
                    opening from B
                </InlineSpotColor>
                , and no unequal pair ever gets there: try{" "}
                <InlineTrigger varName="fixedOpeningRadiusA" value={4} icon="zap">
                    4 cm from A
                </InlineTrigger>{" "}
                alongside{" "}
                <InlineTrigger varName="fixedOpeningRadiusB" value={4} icon="zap">
                    4 cm from B
                </InlineTrigger>
                . One opening used twice makes each crossing the same distance from A as from B, so
                it has to sit on the bisector. The arcs are the evidence, so they stay on the page.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-condition" maxWidth="xl">
        <Block id="fixed-opening-condition" padding="lg">
            <FormulaBlock
                latex="\textcolor{#F8A0CD}{\text{the pink line lands on the middle}} \iff \highlight{arcFromA}{r_A} \; \choice{answer_fixed_opening_relation} \; \highlight{arcFromB}{r_B}"
                linkedHighlights={{
                    arcFromA: {
                        varName: "fixedOpeningHighlight",
                        color: "#8E90F5",
                        bgColor: "rgba(142, 144, 245, 0.22)",
                    },
                    arcFromB: {
                        varName: "fixedOpeningHighlight",
                        color: "#AC8BF9",
                        bgColor: "rgba(172, 139, 249, 0.22)",
                    },
                }}
                clozeChoices={{
                    answer_fixed_opening_relation: {
                        correctAnswer: "=",
                        options: ["=", "<", ">"],
                        ...choicePropsFromDefinition(getVariableInfo('answer_fixed_opening_relation')),
                    },
                }}
            />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-question-equal" maxWidth="xl">
        <Block id="fixed-opening-question-equal" padding="md">
            <EditableParagraph id="para-fixed-opening-question-equal" blockId="fixed-opening-question-equal">A student bisects a different segment PQ. She swings the first arc with the compasses opened to 5 cm, then knocks them and swings the second at 4 cm, and her line misses the middle of PQ. For the line to land on the middle, the two openings must be <InlineFeedback varName={"answer_fixed_opening_equal"} correctValue={["equal", "the same", "same", "identical"]} caseSensitive={false} position={"terminal"} successMessage={"— yes. Equal openings are what force each crossing to be the same distance from P as from Q"} failureMessage={"— not quite."} hint={"Think about what every winning setting in the figure above had in common"} reviewLabel={"Review this concept"} visualizationHint={{"blockId": "fixed-opening-visual", "hintKey": "feedback-fixed-opening-equal", "label": "Discover it yourself", "steps": [{"gesture": "drag", "label": "Pull the left handle until the opening from A reads 4.0 cm", "position": {"x": "13%", "y": "61%"}, "dragPath": {"type": "line", "startOffset": {"x": -16, "y": 8}, "endOffset": {"x": 20, "y": -10}}, "completionVar": "fixedOpeningRadiusA", "completionValue": 4, "completionTolerance": 0.25}, {"gesture": "drag", "label": "Now pull the right handle to 4.0 cm as well — watch the line reach the target", "position": {"x": "82%", "y": "59%"}, "dragPath": {"type": "line", "startOffset": {"x": 16, "y": 8}, "endOffset": {"x": -20, "y": -10}}, "completionVar": "fixedOpeningRadiusB", "completionValue": 4, "completionTolerance": 0.25}], "resetVars": {"fixedOpeningRadiusA": 4.2, "fixedOpeningRadiusB": 3.2}}}><InlineClozeInput varName={"answer_fixed_opening_equal"} correctAnswer={"equal | the same | same | identical"} placeholder={"???"} color={"#F4A89A"} bgColor={"rgba(244, 168, 154, 0.22)"} caseSensitive={false} id={"cloze-1787714988103-3tk4o"} /></InlineFeedback>.</EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-fixed-opening-question-arcs" maxWidth="xl">
        <Block id="fixed-opening-question-arcs" padding="md">
            <EditableParagraph id="para-fixed-opening-question-arcs" blockId="fixed-opening-question-arcs">Her neighbour finishes the same construction, then rubs the arcs out to make the page look tidy. What has he thrown away? <InlineFeedback varName={"answer_fixed_opening_arcs"} correctValue={"the evidence that the two distances were equal"} caseSensitive={false} position={"standalone"} successMessage={"Exactly. Without the arcs, nobody can tell whether that line was constructed or simply drawn by eye"} failureMessage={"Not quite!"} hint={"Ask what the arcs prove about the crossings, rather than what they look like"} reviewBlockId={"fixed-opening-insight"} reviewLabel={"Read that again"}><InlineClozeChoice varName={"answer_fixed_opening_arcs"} correctAnswer={"the evidence that the two distances were equal"} options={["the evidence that the two distances were equal", "nothing, the line is still correct", "the midpoint of the segment"]} placeholder={"???"} color={"#F4A89A"} bgColor={"rgba(244, 168, 154, 0.22)"} id={"choice-1787714988104-jdpu4"} /></InlineFeedback></EditableParagraph>
        </Block>
    </StackLayout>,
];
