import { type ReactElement } from "react";

// Initialize variables and their colors from this file's variable definitions
import { useVariableStore, initializeVariableColors } from "@/stores";
import { getDefaultValues, variableDefinitions } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());
initializeVariableColors(variableDefinitions);

import { orientPerpendicularBisectorsBlocks } from "./sections/orientPerpendicularBisectors";
import { equallyFarFromBothEndsBlocks } from "./sections/equallyFarFromBothEnds";
import { fixedCompassOpeningBlocks } from "./sections/fixedCompassOpening";
import { midpointWithoutMeasuringBlocks } from "./sections/midpointWithoutMeasuring";
import { perpendicularsAtAndFromBlocks } from "./sections/perpendicularsAtAndFrom";
import { constructionWrapUpBlocks } from "./sections/constructionWrapUp";

export const blocks: ReactElement[] = [
    ...orientPerpendicularBisectorsBlocks,
    ...equallyFarFromBothEndsBlocks,
    ...fixedCompassOpeningBlocks,
    ...midpointWithoutMeasuringBlocks,
    ...perpendicularsAtAndFromBlocks,
    ...constructionWrapUpBlocks,
];
