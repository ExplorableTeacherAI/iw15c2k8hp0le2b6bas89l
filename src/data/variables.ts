/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
/**
 * LESSON COLOUR KEY — one quantity, one colour, everywhere
 * (figures, inline scrubble numbers, formula terms and prose spot colours)
 *
 *   TEAL   #62D0AD  whatever the student drags, and the quantity that handle controls
 *   INDIGO #8E90F5  everything measured from A  (arc from A, PA, PM1)
 *   VIOLET #AC8BF9  everything measured from B  (arc from B, PB, PM2)
 *   ROSE   #F8A0CD  the perpendicular bisector / perpendicular and its right angle
 *   SKY    #62CCF9  the point the construction produces (midpoint M, foot F)
 *   SAGE   #A8D5A2  the length of the segment AB
 *   CORAL  #F4A89A  student answers
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ========================================
    // SECTION: The Point That Is Equally Far From Both Ends
    // ========================================

    equalDistancePointX: {
        defaultValue: 2.6,
        type: 'number',
        label: 'Roaming point, across',
        description: 'Horizontal position of the draggable point, measured from the middle of AB',
        unit: 'cm',
        min: -5.6,
        max: 5.6,
        step: 0.1,
        color: '#62D0AD',
    },
    equalDistancePointY: {
        defaultValue: 1.8,
        type: 'number',
        label: 'Roaming point, up',
        description: 'Vertical position of the draggable point above the line AB',
        unit: 'cm',
        min: -2.3,
        max: 3.2,
        step: 0.1,
        color: '#62D0AD',
    },
    equalDistanceSegmentLength: {
        defaultValue: 6,
        type: 'number',
        label: 'Length of AB',
        description: 'Length of the line segment AB in the equal-distance figure',
        unit: 'cm',
        min: 4,
        max: 9,
        step: 1,
        color: '#A8D5A2',
    },
    equalDistanceToA: {
        defaultValue: 3.16,
        type: 'number',
        label: 'Distance PA',
        description: 'Live distance from the roaming point to A, written by the figure and read by the formula',
        unit: 'cm',
        min: 0,
        max: 12,
        step: 0.1,
        color: '#8E90F5',
    },
    equalDistanceToB: {
        defaultValue: 1.98,
        type: 'number',
        label: 'Distance PB',
        description: 'Live distance from the roaming point to B, written by the figure and read by the formula',
        unit: 'cm',
        min: 0,
        max: 12,
        step: 0.1,
        color: '#AC8BF9',
    },
    equalDistanceMarks: {
        defaultValue: [],
        type: 'array',
        label: 'Pencil marks',
        description: 'Flat list of x, y pairs where the point was equally far from A and B',
    },
    equalDistanceHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Equal-distance highlight',
        description: 'Which measured distance is currently highlighted: distanceToA or distanceToB',
        color: '#F8A0CD',
        bgColor: 'rgba(248, 160, 205, 0.22)',
    },
    answer_equal_distance_line: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: line through two equal-distance points',
        description: 'Student answer naming the line through two points equally far from A and B',
        placeholder: '???',
        correctAnswer: 'perpendicular bisector',
        options: ['perpendicular bisector', 'midpoint', 'longest side', 'parallel line'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },
    answer_equal_distance_tilted: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: tilted line through the midpoint',
        description: 'Student answer about points on a tilted line through the midpoint of AB',
        placeholder: '???',
        correctAnswer: 'no, only the middle one',
        options: ['no, only the middle one', 'yes, all of them', 'no, none of them'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },

    // ========================================
    // SECTION: Why the Compass Opening Must Stay Fixed
    // ========================================

    fixedOpeningRadiusA: {
        defaultValue: 4.2,
        type: 'number',
        label: 'Opening from A',
        description: 'Compass opening used for the arc swung from A',
        unit: 'cm',
        min: 2,
        max: 5,
        step: 0.1,
        color: '#8E90F5',
    },
    fixedOpeningRadiusB: {
        defaultValue: 3.2,
        type: 'number',
        label: 'Opening from B',
        description: 'Compass opening used for the arc swung from B',
        unit: 'cm',
        min: 2,
        max: 5,
        step: 0.1,
        color: '#AC8BF9',
    },
    fixedOpeningHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Fixed opening highlight',
        description: 'Which element of the arcs figure is highlighted: arcFromA, arcFromB or crossingLine',
        color: '#F8A0CD',
        bgColor: 'rgba(248, 160, 205, 0.22)',
    },
    answer_fixed_opening_relation: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: relation between the two openings',
        description: 'Formula choice for the relation the two compass openings must satisfy',
        placeholder: '?',
        correctAnswer: '=',
        options: ['=', '<', '>'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.28)',
    },
    answer_fixed_opening_equal: {
        defaultValue: '',
        type: 'text',
        label: 'Answer: what the two openings must be',
        description: 'Student answer describing the relationship the two compass openings must have',
        placeholder: '???',
        correctAnswer: ['equal', 'the same', 'same', 'identical'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },
    answer_fixed_opening_arcs: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: what rubbing out the arcs loses',
        description: 'Student answer about what is lost when the arcs are erased',
        placeholder: '???',
        correctAnswer: 'the evidence that the two distances were equal',
        options: [
            'the evidence that the two distances were equal',
            'nothing, the line is still correct',
            'the midpoint of the segment',
        ],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },

    // ========================================
    // SECTION: Finding the Midpoint Without Measuring
    // ========================================

    midpointConstructionStep: {
        defaultValue: 2,
        type: 'number',
        label: 'Construction step',
        description: 'How far the perpendicular bisector construction has been built, 1 to 5',
        min: 1,
        max: 5,
        step: 1,
        color: '#64748B',
    },
    midpointCrossingHeight: {
        defaultValue: 1.9,
        type: 'number',
        label: 'Height of the crossing point',
        description: 'How far above AB the arcs cross, which sets the compass opening for both arcs',
        unit: 'cm',
        min: 1.2,
        max: 2.8,
        step: 0.05,
        color: '#62D0AD',
    },
    midpointOpening: {
        defaultValue: 4.11,
        type: 'number',
        label: 'Compass opening',
        description: 'Live compass opening of the bisector construction, written by the figure and read by the formula',
        unit: 'cm',
        min: 0,
        max: 12,
        step: 0.01,
        color: '#62D0AD',
    },
    midpointHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Midpoint figure highlight',
        description: 'Which element is highlighted: arcsFromA, arcsFromB, bisector or midpoint',
        color: '#F8A0CD',
        bgColor: 'rgba(248, 160, 205, 0.22)',
    },
    answer_midpoint_exact_half: {
        defaultValue: '',
        type: 'text',
        label: 'Answer: exact midpoint of a 9.5 cm segment',
        description: 'Student answer for half of 9.5 cm',
        placeholder: '???',
        correctAnswer: ['4.75', '4.75 cm', '4,75'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },
    answer_midpoint_why_exact: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: why the constructed midpoint is exact',
        description: 'Student answer explaining why the construction beats the ruler',
        placeholder: '???',
        correctAnswer: 'it comes from two equal distances, not from reading a scale',
        options: [
            'it comes from two equal distances, not from reading a scale',
            'a pair of compasses is a more accurate tool than a ruler',
            'the arcs make the segment easier to halve',
        ],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },

    // ========================================
    // SECTION: Perpendiculars at a Point and from a Point
    // ========================================

    perpendicularPointX: {
        defaultValue: 0.6,
        type: 'number',
        label: 'Point P, along the line',
        description: 'Horizontal position of the movable point P',
        unit: 'cm',
        min: -2.6,
        max: 2.6,
        step: 0.1,
        color: '#62D0AD',
    },
    perpendicularPointHeight: {
        defaultValue: 1.9,
        type: 'number',
        label: 'Height of P above the line',
        description: 'How far the movable point P sits above the line, zero when it is on the line',
        unit: 'cm',
        min: 0,
        max: 3,
        step: 0.1,
        color: '#62D0AD',
    },
    perpendicularOpening: {
        defaultValue: 2.49,
        type: 'number',
        label: 'Opening from P',
        description: 'Live distance from P to each mark on the line, written by the figure and read by the formula',
        unit: 'cm',
        min: 0,
        max: 6,
        step: 0.01,
        color: '#62D0AD',
    },
    perpendicularHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Perpendicular figure highlight',
        description: 'Which element is highlighted: arcFromPoint, marksOnLine or perpendicular',
        color: '#F8A0CD',
        bgColor: 'rgba(248, 160, 205, 0.22)',
    },
    answer_perpendicular_angle: {
        defaultValue: '',
        type: 'text',
        label: 'Answer: the angle at the foot',
        description: 'Formula cloze answer for the angle between the constructed upright and the line',
        placeholder: '??',
        correctAnswer: ['90', '90°'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.28)',
    },
    answer_perpendicular_foot: {
        defaultValue: '',
        type: 'text',
        label: 'Answer: what the foot is of the two marks',
        description: 'Student answer naming the foot of the perpendicular in terms of the two marks',
        placeholder: '???',
        correctAnswer: ['midpoint', 'mid-point', 'mid point', 'middle'],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },
    answer_perpendicular_first_step: {
        defaultValue: '',
        type: 'select',
        label: 'Answer: first step for a point on the line',
        description: 'Student answer for the first step when the point already lies on the line',
        placeholder: '???',
        correctAnswer: 'swing equal arcs each side of Q to make a short segment',
        options: [
            'swing equal arcs each side of Q to make a short segment',
            'join Q to the nearer end of the line',
            'measure a right angle at Q with a protractor',
        ],
        color: '#F4A89A',
        bgColor: 'rgba(244, 168, 154, 0.22)',
    },

    // ========================================
    // ADD YOUR VARIABLES HERE
    // ========================================

    // Uncomment and modify these examples for your lesson:

    /*
    // ─────────────────────────────────────────
    // NUMBER - Use with sliders
    // ─────────────────────────────────────────
    myValue: {
        defaultValue: 5,
        type: 'number',
        label: 'My Value',
        description: 'A number that controls something',
        unit: 'm',           // optional unit display
        min: 0,
        max: 10,
        step: 0.5,
    },

    // ─────────────────────────────────────────
    // TEXT - Free text input
    // ─────────────────────────────────────────
    lessonTitle: {
        defaultValue: 'My Lesson',
        type: 'text',
        label: 'Lesson Title',
        description: 'The title of your lesson',
        placeholder: 'Enter a title...',
    },

    // ─────────────────────────────────────────
    // SELECT - Dropdown with options
    // ─────────────────────────────────────────
    difficulty: {
        defaultValue: 'medium',
        type: 'select',
        label: 'Difficulty',
        description: 'The difficulty level of the lesson',
        options: ['easy', 'medium', 'hard', 'expert'],
    },

    // ─────────────────────────────────────────
    // BOOLEAN - Toggle switch
    // ─────────────────────────────────────────
    showHints: {
        defaultValue: true,
        type: 'boolean',
        label: 'Show Hints',
        description: 'Toggle to show or hide hints',
    },

    // ─────────────────────────────────────────
    // ARRAY - List of numbers
    // ─────────────────────────────────────────
    dataPoints: {
        defaultValue: [1, 4, 9, 16, 25],
        type: 'array',
        label: 'Data Points',
        description: 'Y-values for plotting a graph',
    },

    // ─────────────────────────────────────────
    // OBJECT - Complex structured data
    // ─────────────────────────────────────────
    graphSettings: {
        defaultValue: { 
            xMin: -10, 
            xMax: 10, 
            showGrid: true 
        },
        type: 'object',
        label: 'Graph Settings',
        description: 'Configuration for the graph display',
        schema: '{ xMin: number, xMax: number, showGrid: boolean }',
    },
    */
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
